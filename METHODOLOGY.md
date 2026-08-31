# SearchSea Empirical Methodology & Mathematical Defense

This document provides the complete theoretical foundations, mathematical definitions, and technical defense rationale for the SearchSea automated research platform. It serves as a comprehensive reference and interview defense guide.

---

## 1. System Architecture: Why Polyglot (Node.js + Python)?

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│    (Interactive Visualizations, 2D PCA Map, Dashboards)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            App Layer: Node.js + Express + Prisma            │
│   - I/O Concurrency, Live Webhooks, Google / Qualtrics Sync │
│   - Survey CRUD, Response Ingestion, Versioned Run Storage  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Typed REST Microservice Contract
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          ML & Stats Layer: Python + FastAPI Microservice    │
│   - NumPy, Pandas, SciPy.stats, Scikit-learn, TF-IDF NLP    │
│   - Automated Hypothesis Selection, PCA, K-Means Clustering │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Rationale for Interviews:
1. **Event Loop Non-Blocking**: Heavy numerical linear algebra (matrix decomposition in PCA, eigenvector computation, iterative K-Means optimization) is CPU-bound. If executed inside a Node.js process, it would block the single-threaded event loop and degrade API response times.
2. **Scientific Ecosystem Dominance**: Python possesses `scipy.stats` and `scikit-learn`—the battle-tested, peer-reviewed standard for statistical computing.
3. **Clean Domain Separation**: The Node.js application layer focuses strictly on state management, authentication, integrations, and database orchestration, while the Python FastAPI layer functions as an idempotent, stateless computation engine.

---

## 2. Data Provenance & Preprocessing Integrity

In scientific quantitative research, **mutating raw data destroys reproducibility**. ResearchOS enforces an immutable audit trail:

### A. Speeder Detection
- **Rationale**: Respondents completing surveys at unrealistic speeds are not reading the questions, introducing noise.
- **Formulation**:
  $$\text{Cutoff} = \max\left(15\text{s}, 0.25 \times \text{Median Duration}\right)$$
- Responses with $\text{duration} < \text{Cutoff}$ are flagged and isolated into an audit quarantine.

### B. Straight-Lining Detection
- **Rationale**: Straight-lining occurs when respondents select the same rating (e.g., all 4s) across a Likert question grid to minimize effort.
- **Formulation**: For a respondent's Likert answers vector $\vec{x} = [x_1, x_2, \dots, x_m]$:
  $$\sigma = \sqrt{\frac{1}{m - 1} \sum_{i=1}^m (x_i - \bar{x})^2}$$
  If $\sigma \le 0.35$ (near-zero variance across $\ge 3$ rating items), the record is flagged as straight-lining.

### C. Missing Data Strategy
- **Numeric/Likert fields**: Imputed with column **median** to prevent skewness from extreme outliers.
- **Categorical fields**: Imputed with column **mode**.
- Every imputed cell is logged in the `AnalysisRun.auditLogJson` audit table.

---

## 3. Automated Statistical Hypothesis Decision Tree

ResearchOS replaces manual guesswork with an automated decision tree:

```
                      [ Dependent Variable Type ]
                                  │
         ┌────────────────────────┴────────────────────────┐
     Continuous                                       Categorical
         │                                                 │
 [ Independent Var Type ]                          [ Independent Var Type ]
   ┌─────┴───────────────┐                                 │
Categorical          Continuous                       Categorical
   │                     │                                 │
   ▼                     ▼                                 ▼
[ Groups Count ]   [ Distribution Check ]          [ Pearson Chi-Square ]
 2 Groups:           Normal: Pearson r             Contingency Table &
   Shapiro p > 0.05    Non-Normal: Spearman Rho    Cramér's V Effect Size
   → Welch t-test
   Shapiro p < 0.05
   → Mann-Whitney U
 3+ Groups:
   Shapiro p > 0.05
   → One-Way ANOVA
   Shapiro p < 0.05
   → Kruskal-Wallis H
```

### Why Welch's t-Test over Student's t-Test?
Student's two-sample t-test assumes equal variances ($\sigma_1^2 = \sigma_2^2$). In real-world surveys, different respondent segments have unequal sample sizes and variances. **Welch's t-test** does not assume homoscedasticity and provides robust Type I error control:
$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}}$$

### Non-Parametric Fallbacks (Mann-Whitney U & Kruskal-Wallis)
When Shapiro-Wilk detects non-normality ($p < 0.05$), the engine converts continuous scores into ranks to avoid invalid Gaussian assumptions.

---

## 4. Effect Size vs. Statistical Significance

### Why P-Values Alone Are Dangerous
With large sample sizes ($N > 5,000$), even miniscule differences (e.g., $4.01$ vs $4.03$ on a 5-point scale) yield $p < 0.001$. Reporting **effect size** communicates practical significance:

1. **Cohen's $d$ (Two Groups)**:
   $$d = \frac{\bar{X}_1 - \bar{X}_2}{s_{\text{pooled}}}, \quad s_{\text{pooled}} = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}}$$
   - Interpretation: $|d| < 0.2$ (Negligible), $0.2 \le |d| < 0.5$ (Small), $0.5 \le |d| < 0.8$ (Medium), $|d| \ge 0.8$ (Large).
2. **Eta-Squared ($\eta^2$, ANOVA)**:
   $$\eta^2 = \frac{SS_{\text{between}}}{SS_{\text{total}}}$$
3. **Cramér's $V$ (Chi-Square Contingency Tables)**:
   $$V = \sqrt{\frac{\chi^2}{n \cdot \min(r - 1, c - 1)}}$$

---

## 5. Multiple Comparisons Problem & Bonferroni Correction

When testing $k$ simultaneous hypotheses at significance level $\alpha = 0.05$, the probability of at least one false positive (Type I error) is:
$$\alpha_{\text{FWER}} = 1 - (1 - \alpha)^k$$
For $k = 10$ tests, $\alpha_{\text{FWER}} = 1 - (0.95)^{10} \approx 40.1\%$.

**ResearchOS Solution**: Computes the Bonferroni adjusted threshold:
$$\alpha_{\text{Bonferroni}} = \frac{\alpha}{k}$$
and tags every test in the dashboard as *Significant (Raw Only)* vs *Significant (Bonferroni Passed)*.

---

## 6. Unsupervised Respondent Segmentation & 2D PCA

1. **Feature Matrix**: One-hot encodes categorical segments, standardizes Likert scales with $z$-score normalization:
   $$z = \frac{x - \mu}{\sigma}$$
2. **Optimal $K$ Selection via Silhouette Analysis**:
   Iterates $K \in [2, 6]$ and computes the Silhouette coefficient:
   $$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$
   Where $a(i)$ is mean intra-cluster distance and $b(i)$ is mean nearest-cluster distance. Selects $K$ maximizing the mean silhouette score.
3. **PCA Dimensionality Reduction**:
   Computes covariance matrix $\Sigma = \frac{1}{n} X^T X$, extracts top 2 eigenvectors with largest eigenvalues, and projects respondents to 2D $(x, y)$ coordinates for visualization.

---

## 7. NLP Theme Extraction & Representative Quote Selection

1. **TF-IDF Feature Extraction**:
   $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{|D|}{|\{d \in D : t \in d\}|}\right)$$
2. **Representative Quote Selection**:
   Computes the centroid vector $\vec{c}_j$ of theme cluster $j$. For each quote $\vec{q}_i \in j$, evaluates Euclidean distance $\|\vec{q}_i - \vec{c}_j\|$. Quotes with minimal distance represent the central consensus of the theme.
3. **Sentiment Distribution**: Lexicon polarity mapping categorizes positive vs. negative sentiment percentage per theme.
