import React, { useState } from 'react';
import { X, BookOpen, AlertTriangle } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'provenance' | 'clustering' | 'nlp' | 'interview'>('stats');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-bg-base border border-hairline my-6 text-ink shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg-surface">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Technical Documentation & Validation Supplement
            </div>
            <h2 className="text-base font-serif font-semibold text-ink">
              SearchSea Methodology & Empirical Defense
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-bg-base px-6 space-x-4 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'stats'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            1. Statistical Decision Tree
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'provenance'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            2. Data Provenance & Cleaning
          </button>
          <button
            onClick={() => setActiveTab('clustering')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'clustering'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            3. Segmentation & PCA
          </button>
          <button
            onClick={() => setActiveTab('nlp')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'nlp'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            4. NLP Theme Extraction
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'interview'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            5. Interview Q&A Defense
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto text-xs leading-relaxed text-ink space-y-4 font-sans">
          {activeTab === 'stats' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="text-sm font-serif font-semibold text-ink">
                Automated Test Selection Decision Engine
              </h3>
              <p className="text-ink-muted">
                Rather than applying arbitrary parametric assumptions, the engine dynamically selects tests based on distribution normality, variable measurement scale, sample sizes, and degrees of freedom:
              </p>

              <div className="border border-hairline divide-y divide-hairline">
                <div className="p-3 bg-bg-surface">
                  <div className="font-semibold text-ink">1. Normality Assessment (Shapiro-Wilk & D'Agostino-Pearson)</div>
                  <p className="text-ink-muted mt-0.5">
                    Evaluates continuous dependent variables prior to group comparison. When $p &lt; 0.05$ (non-normal), non-parametric rank tests are automatically selected to prevent Type I inflation.
                  </p>
                </div>
                <div className="p-3 bg-bg-base">
                  <div className="font-semibold text-ink">2. Two-Sample Mean Comparison</div>
                  <p className="text-ink-muted mt-0.5">
                    Parametric: <strong>Welch's Two-Sample t-Test</strong> (unconstrained variance assumption).<br />
                    Non-parametric: <strong>Mann-Whitney U Test</strong> (rank-sum distribution).
                  </p>
                </div>
                <div className="p-3 bg-bg-surface">
                  <div className="font-semibold text-ink">3. Multi-Group Comparison (3+ Groups)</div>
                  <p className="text-ink-muted mt-0.5">
                    Parametric: <strong>One-Way ANOVA</strong> ($F$-statistic with $\eta^2$ effect size).<br />
                    Non-parametric: <strong>Kruskal-Wallis H Test</strong> ($\varepsilon^2$ effect size).
                  </p>
                </div>
                <div className="p-3 bg-bg-base">
                  <div className="font-semibold text-ink">4. Categorical Contingency Analysis</div>
                  <p className="text-ink-muted mt-0.5">
                    Standard: <strong>Pearson's Chi-Square (&chi;<sup>2</sup>) Test of Independence</strong> with Cramér's V.<br />
                    Small cells (expected count E &lt; 5 in 2&times;2 table): <strong>Fisher's Exact Test</strong> (hypergeometric probability).
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-bg-surface border-l-2 border-accent-flagged space-y-1">
                <div className="font-semibold text-accent-flagged flex items-center space-x-1 font-mono text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Multiple Testing Control (Bonferroni & Benjamini-Hochberg)</span>
                </div>
                <p className="text-ink-muted">
                  When executing k simultaneous comparisons, family-wise error rate scales as 1 - (1 - &alpha;)<sup>k</sup>. We enforce Bonferroni threshold &alpha;<sub>adj</sub> = &alpha; / k and report FDR-adjusted q-values.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="text-sm font-serif font-semibold text-ink">
                Data Provenance & Cleaning Audit Trail
              </h3>
              <p className="text-ink-muted">
                Mutating raw data in place violates scientific reproducibility. ResearchOS persists raw response logs alongside versioned, immutable cleaned datasets:
              </p>
              <div className="border border-hairline divide-y divide-hairline">
                <div className="p-3 bg-bg-surface">
                  <span className="font-semibold text-ink">Speeders Detection: </span>
                  <span className="text-ink-muted">Flags completion durations below 25% of sample median or under 15 seconds.</span>
                </div>
                <div className="p-3 bg-bg-base">
                  <span className="font-semibold text-ink">Straight-Lining Filter: </span>
                  <span className="text-ink-muted">Identifies respondents with near-zero standard deviation ($\sigma \le 0.35$) across Likert matrices.</span>
                </div>
                <div className="p-3 bg-bg-surface">
                  <span className="font-semibold text-ink">Low-Effort / Gibberish Detection: </span>
                  <span className="text-ink-muted">Applies Shannon character entropy ($H &lt; 2.5$) and length thresholds on open-ended feedback.</span>
                </div>
                <div className="p-3 bg-bg-base">
                  <span className="font-semibold text-ink">Missing Data Imputation: </span>
                  <span className="text-ink-muted">Numeric columns use median imputation; categorical variables use mode imputation with audit logging.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clustering' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="text-sm font-serif font-semibold text-ink">
                Unsupervised Respondent Segmentation
              </h3>
              <p className="text-ink-muted">
                Features undergo one-hot encoding and standard $z$-score normalization before K-Means or Hierarchical Agglomerative clustering:
              </p>
              <div className="border border-hairline divide-y divide-hairline">
                <div className="p-3 bg-bg-surface">
                  <span className="font-semibold text-ink">Automated $K$ Selection: </span>
                  <span className="text-ink-muted">Computes mean Silhouette Coefficient across $K=2$ to $K=8$ and selects the global maximum.</span>
                </div>
                <div className="p-3 bg-bg-base">
                  <span className="font-semibold text-ink">PCA Dimensionality Reduction: </span>
                  <span className="text-ink-muted">Projects high-dimensional respondent matrices onto the first 2 principal components with explained variance tracking.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nlp' && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="text-sm font-serif font-semibold text-ink">
                NLP Semantic Theme Extraction
              </h3>
              <p className="text-ink-muted">
                Processes qualitative open-ended responses through TF-IDF n-gram vectorization and semantic centroid distance scoring:
              </p>
              <div className="border border-hairline divide-y divide-hairline">
                <div className="p-3 bg-bg-surface">
                  <span className="font-semibold text-ink">Centroid Distance Quote Extraction: </span>
                  <span className="text-ink-muted">Calculates Euclidean cosine distance between quote vectors and cluster centroids, surfacing minimal-distance verbatim quotes.</span>
                </div>
                <div className="p-3 bg-bg-base">
                  <span className="font-semibold text-ink">Sentiment Distribution: </span>
                  <span className="text-ink-muted">Classifies polarity distribution (positive / negative / neutral) per identified thematic cluster.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-3 max-w-3xl">
              <h3 className="text-sm font-serif font-semibold text-ink">
                Technical Defense Q&A
              </h3>
              
              <div className="p-3 bg-bg-surface border border-hairline space-y-1">
                <div className="font-mono text-[11px] font-semibold text-accent-action">Q: Why separate Node.js and Python microservices?</div>
                <p className="text-ink-muted">
                  A: Node.js handles high-concurrency I/O, webhooks, and CRUD orchestration, while Python executes specialized scientific computing (`scipy`, `pandas`, `scikit-learn`). Decoupling them prevents compute-intensive stats runs from blocking the Node event loop.
                </p>
              </div>

              <div className="p-3 bg-bg-surface border border-hairline space-y-1">
                <div className="font-mono text-[11px] font-semibold text-accent-action">Q: Why calculate effect sizes alongside p-values?</div>
                <p className="text-ink-muted">
                  A: At large sample sizes ($N &gt; 5,000$), even practically trivial differences produce $p &lt; 0.05$. Effect sizes (Cohen's $d$, $\eta^2$, Cramér's $V$) quantify real-world magnitude independently of sample size.
                </p>
              </div>

              <div className="p-3 bg-bg-surface border border-hairline space-y-1">
                <div className="font-mono text-[11px] font-semibold text-accent-action">Q: How does the system handle multiple comparisons?</div>
                <p className="text-ink-muted">
                  A: Running 20 independent tests at $\alpha = 0.05$ creates a 64% cumulative false-positive risk. We apply Bonferroni adjustment ($\alpha / k$) and Benjamini-Hochberg FDR control.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-bg-surface flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-hairline text-xs font-sans font-medium text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MethodologyModal;
