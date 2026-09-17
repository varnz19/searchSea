# SearchSea (ResearchOS) 🌊 📊

[![Project Status: Active Development / Ongoing Research](https://img.shields.io/badge/status-active--development%20%2F%20ongoing-orange.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.112+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748.svg?logo=prisma)](https://prisma.io)
[![Power BI](https://img.shields.io/badge/Power%20BI-Embedded-F2C811.svg?logo=powerbi)](https://powerbi.microsoft.com)

> ⚠️ **Project Status**: **Active Development / Ongoing Research (WIP)**  
> SearchSea (ResearchOS) is an actively evolving, automated end-to-end quantitative research and empirical statistical intelligence platform. Core anomaly quarantine engines, dynamic hypothesis selection trees, unsupervised clustering algorithms, and Power BI embedded analytical dashboards are actively being iterated, expanded with real-world survey connectors, and validated against formal econometric and psychometric benchmarks.

---

## 📌 Overview

**SearchSea** is an autonomous empirical research operating system engineered to transform raw survey datasets into publication-grade statistical analysis, respondent segmentations, and qualitative consensus models in seconds.

Unlike traditional survey platforms that provide superficial descriptive charts (e.g., standard bar plots) or legacy statistical packages (SPSS, R, Stata) that demand manual scripting and prone-to-error testing, SearchSea enforces **strict data provenance** and an **automated mathematical decision tree**:
- **Automated Data Integrity**: Quarantines speeder responses ($< 0.25 \times \text{median duration}$) and straight-liners ($\sigma \le 0.35$ on Likert scales) with deterministic median/mode imputation audit trails.
- **Empirical Hypothesis Testing**: Automatically inspects variable distributions via Shapiro-Wilk normality testing to select parametric (Welch's t-Test, ANOVA, Pearson $r$) or non-parametric alternatives (Mann-Whitney U, Kruskal-Wallis, Spearman $\rho$, Chi-Square), computing effect sizes (Cohen's $d$, $\eta^2$, Cramér's $V$) and correcting for Family-Wise Error Rates (FWER) via Bonferroni & Benjamini-Hochberg FDR.
- **Unsupervised Respondent Clustering & PCA**: Implements K-Means and Hierarchical clustering with automatic $K$-optimization using Silhouette score analysis and extracts 2D eigenvector projections via Principal Component Analysis (PCA).
- **Semantic Theme & Representative Quote Extraction**: Mines open-ended feedback via TF-IDF vectorization, cluster centroid distance matching, and sentiment polarity breakdown.

---

## 🚀 Features & Implementation Matrix

| Module | Core Functionality | Status |
| :--- | :--- | :---: |
| **Data Provenance & Cleaning Engine** | Speeder cutoff detection, straight-liner variance quarantine, deterministic imputation & immutable audit logging | 🟢 Functional |
| **Automated Hypothesis Decision Tree** | Shapiro-Wilk distribution testing with Welch's t-test, Mann-Whitney U, ANOVA, Kruskal-Wallis & Chi-square selection | 🟢 Functional |
| **Effect Size & FWER Corrections** | Cohen's $d$, $\eta^2$, Cramér's $V$ computation with Bonferroni correction & Benjamini-Hochberg FDR adjustment | 🟢 Functional |
| **Unsupervised Clustering (2D PCA)** | K-Means / Hierarchical clustering with automated optimal $K$ silhouette search & 2D PCA interactive coordinate map | 🟢 Functional |
| **Semantic NLP & Theme Extraction** | TF-IDF keyphrase mining, sentiment distribution, and Euclidean centroid representative quote selection | 🟢 Functional |
| **Synthetic Survey Response Generator** | Monte Carlo response synthesis with controlled behavioral bias and speeder/straight-liner injection | 🟢 Functional |
| **Third-Party Data Ingestion** | Google Forms CSV webhook parser, Qualtrics JSON survey payload sync & native survey collection | 🟢 Functional |
| **Power BI Embedded Analytics** | App-owns-data REST proxy service, direct secure embed token generation & interactive telemetry dashboards | 🟡 In Active Development |
| **Researcher Profile & Audit Export** | ORCID verification, customized methodological threshold presets, system activity trails & CSV/JSON export | 🟢 Functional |
| **Automated Academic Paper Generator** | Exporting IEEE/APA-formatted methodological write-ups and LaTeX statistical tables directly from run snapshots | 🟡 In Progress |
| **Bayesian Inference Engine** | Transitioning hypothesis testing to include Bayes Factors ($BF_{10}$) alongside frequentist $p$-values | ⚪ Planned |

**Legend:**  
🟢 Ready / Functional &nbsp;|&nbsp; 🟡 In Active Development / In Progress &nbsp;|&nbsp; ⚪ Upcoming on Roadmap

---

## 🧩 Architecture

```text
                             SearchSea Platform (WIP)
                                        |
                 +----------------------+----------------------+
                 |                                             |
           Web Client                                  Node.js App Layer
     (React 18 / TypeScript / Vite)                 (Express 4 / Prisma ORM)
     - Interactive PCA Scatter Plot                 - User & Study Management (JWT)
     - Hypothesis & Effect Size Matrix              - Survey CRUD & Ingestion Hub
     - Power BI Embedded Canvas                     - Versioned Run Audit Storage
                 |                                             |
                 +----------------------+----------------------+
                                        |
                        Typed REST Microservice Contract
                                        |
                                        ▼
                         Machine Learning & Stats Engine
                               (FastAPI / Python 3.11)
                                        |
         +--------------------+---------+---------+--------------------+
         |                    |                   |                    |
   Preprocessing         Hypothesis         Unsupervised            NLP Theme
  & Quarantine Tree      Selection          Clustering & PCA        Extraction
  - Speeder Cutoff      - Welch / ANOVA    - Silhouette K-Search   - TF-IDF Vectors
  - Straight-Lining     - Mann-Whitney     - 2D Eigenvectors       - Centroid Quotes
  - Median Imputation   - Bonferroni / BH  - Scikit-Learn          - Polarity Lexicon
```

---

## 🛠️ Current Tech Stack

### Client (Web Application)
- **Framework:** React 18.3 with Vite 5 & TypeScript 5.5
- **Styling & UI:** Tailwind CSS 3.4, PostCSS, Lucide React icons, Clsx & Tailwind-Merge
- **Data Visualizations:** Recharts (bar, scatter, line charts), Custom SVG 2D PCA scatter maps
- **Embedded Analytics:** Microsoft `powerbi-client` SDK for app-owns-data embedded reports
- **State & HTTP:** React Hooks, Context API (`AuthContext`), Axios

### Application & Orchestration Backend (Node.js)
- **Runtime:** Node.js 20+ with TypeScript & TSX watcher
- **Web Framework:** Express 4.21 with CORS & Rate Limiting (`express-rate-limit`)
- **Database & ORM:** SQLite (development) with Prisma 5.19 ORM (fully schema-migratable to PostgreSQL)
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`) in `httpOnly` secure cookies, `bcryptjs` password hashing
- **Microservice Client:** Typed Axios communication layer with health checks and circuit fallbacks

### Machine Learning & Statistical Engine (Python)
- **Framework:** FastAPI 0.112+ with Uvicorn ASGI server
- **Data Manipulation:** Pandas 2.2+, NumPy 1.26+
- **Scientific & Statistical Testing:** SciPy 1.13+ (`scipy.stats` for Welch's t, Mann-Whitney, Shapiro-Wilk, Kruskal-Wallis, Chi-square)
- **Unsupervised Learning & NLP:** Scikit-learn 1.5+ (`PCA`, `KMeans`, `AgglomerativeClustering`, `silhouette_score`, `TfidfVectorizer`)
- **Validation:** Pydantic 2.8+ schemas with strict parameter typing

---

## 📁 Repository Structure

```text
research-project/
├── METHODOLOGY.md               # Complete empirical defense, equations & theoretical rationale
├── package.json                 # Root monorepo orchestration scripts (concurrent runner)
│
├── frontend/                    # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/          # UI Views and Modals
│   │   │   ├── DashboardView.tsx        # Statistical dashboard (PCA, tests, clusters, themes)
│   │   │   ├── LandingPage.tsx          # Hero page, feature previews & interactive demo
│   │   │   ├── MethodologyModal.tsx     # In-app mathematical formula inspection modal
│   │   │   ├── PowerBiReport.tsx        # Power BI Embedded analytics container
│   │   │   ├── ProfilePage.tsx          # Researcher ORCID, institution & activity timeline
│   │   │   ├── ProfileModal.tsx         # Methodological settings & significance alpha tuning
│   │   │   ├── SurveyGeneratorModal.tsx # Archetype & custom survey builder
│   │   │   ├── DataIntegrationModal.tsx # CSV, Google Forms, Qualtrics & synthetic importer
│   │   │   └── SurveyList.tsx           # Study catalog & status manager
│   │   ├── context/             # Global AuthContext & user state
│   │   ├── api.ts               # Axios client for Node.js API endpoints
│   │   ├── types.ts             # Shared frontend TypeScript interfaces
│   │   └── App.tsx              # View routing & application layout
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend-node/                # Express + Prisma Application Layer
│   ├── src/
│   │   ├── routes/              # API Controllers
│   │   │   ├── authRoutes.ts            # Registration, login, logout, session verification
│   │   │   ├── userRoutes.ts            # Profile settings, password, activity logs, data export
│   │   │   ├── surveyRoutes.ts          # Survey CRUD, archetypes, dynamic question management
│   │   │   ├── analysisRoutes.ts        # ML orchestration pipeline, hypothesis tests, run storage
│   │   │   ├── integrationRoutes.ts     # Google Forms, Qualtrics, synthetic generator endpoints
│   │   │   └── reportRoutes.ts          # Power BI embed tokens & report registry
│   │   ├── services/
│   │   │   └── mlClient.ts              # Typed HTTP proxy connecting Node.js to FastAPI ML engine
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts        # JWT cookie verification & authorization guards
│   │   ├── prisma/
│   │   │   └── schema.prisma            # Relational database schema (User, Survey, AnalysisRun, etc.)
│   │   ├── seed-demo.ts                 # Realistic research dataset seeder (CSAT, Behavioral, PMF)
│   │   └── index.ts                     # Express server setup & port binding
│   └── tsconfig.json
│
└── backend-ml/                  # FastAPI Statistical Computing Microservice
    ├── main.py                  # Statistical engine, decision tree, PCA, clustering & NLP endpoints
    ├── requirements.txt         # Python package dependencies
    └── .venv/                   # Python virtual environment
```

---

## 🔌 API Reference (Active Endpoints)

### 🔬 Machine Learning & Statistical Engine (Port `8000`)
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Health check & microservice version info | 🟢 Functional |
| `POST` | `/api/preprocess` | Speeder & straight-liner quarantine with median/mode imputation | 🟢 Functional |
| `POST` | `/api/stats/hypothesize` | Automated hypothesis test selector with Welch/Mann-Whitney & Bonferroni | 🟢 Functional |
| `POST` | `/api/cluster` | Unsupervised K-Means/Hierarchical clustering with Silhouette & 2D PCA | 🟢 Functional |
| `POST` | `/api/nlp/themes` | TF-IDF keyphrase clustering & centroid representative quote extraction | 🟢 Functional |
| `POST` | `/api/generate-synthetic-data` | Monte Carlo synthetic respondent generator with configurable anomalies | 🟢 Functional |

### 📋 Study & Ingestion Orchestration (Port `5000`)
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | App layer status, database connection, and ML engine health check | 🟢 Functional |
| `POST` | `/api/analysis/run/:surveyId` | Execute complete end-to-end cleaning, statistical, and ML pipeline | 🟢 Functional |
| `POST` | `/api/analysis/custom-hypothesis/:surveyId` | Ad-hoc hypothesis test execution between arbitrary survey variables | 🟢 Functional |
| `GET` | `/api/analysis/runs/:surveyId` | Retrieve versioned historical analysis run snapshots | 🟢 Functional |
| `POST` | `/api/integrations/synthetic/:surveyId` | Generate & ingest synthetic respondents into survey database | 🟢 Functional |
| `POST` | `/api/integrations/google-forms/sync/:surveyId` | Parse & ingest Google Forms CSV survey responses | 🟢 Functional |
| `POST` | `/api/integrations/qualtrics/sync/:surveyId` | Ingest Qualtrics JSON survey payload with duration metadata | 🟢 Functional |
| `POST` | `/api/integrations/submit/:surveyId` | Public respondent submission endpoint for active surveys | 🟢 Functional |

### 🔐 Authentication & Researcher Profile (Port `5000`)
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Create researcher account with hashed credentials | 🟢 Functional |
| `POST` | `/api/auth/login` | Authenticate researcher & issue secure `httpOnly` JWT cookie | 🟢 Functional |
| `POST` | `/api/auth/logout` | Invalidate researcher session cookie | 🟢 Functional |
| `GET` | `/api/auth/me` | Fetch authenticated researcher session profile | 🟢 Functional |
| `GET` | `/api/user/profile` | Retrieve comprehensive profile, ORCID, institution & statistics | 🟢 Functional |
| `PUT` | `/api/user/settings` | Update default statistical significance ($\alpha$), speeder thresholds | 🟢 Functional |
| `GET` | `/api/user/activity` | Retrieve immutable activity audit log of pipeline runs & data edits | 🟢 Functional |
| `GET` | `/api/reports/:id/embed-token`| Issue Power BI REST embed token for embedded visual analytics | 🟡 In Testing |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or newer (`npm` v10+)
- **Python**: `3.11` or newer with `venv` support
- **Git**

---

### 1. Repository Setup & Dependencies

Clone the repository and install root and service dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/research-project.git
cd research-project

# Install root dependencies
npm install

# Install Frontend dependencies
cd frontend && npm install && cd ..

# Install Node.js backend dependencies
cd backend-node && npm install && cd ..
```

---

### 2. Python ML Microservice Setup

```bash
cd backend-ml

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install scientific dependencies
pip install -r requirements.txt

# Return to root directory
cd ..
```

---

### 3. Database Initialization & Seeding

The Node.js backend utilizes Prisma with an embedded SQLite database for zero-config local development:

```bash
cd backend-node

# Generate Prisma client bindings and push schema
npx prisma generate
npx prisma db push

# Optional: Seed realistic research studies with sample datasets
npx tsx src/seed-demo.ts

# Return to root directory
cd ..
```

---

### 4. Running the Entire System Concurrently

From the root project directory, run:

```bash
npm run dev
```

This single command launches all three tiers in parallel:
- **FastAPI ML Microservice**: `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`)
- **Express Node.js App Layer**: `http://localhost:5000` (Health: `http://localhost:5000/api/health`)
- **React Frontend**: `http://localhost:5173`

---

## 🗺️ Roadmap & Upcoming Milestones

- [ ] **Milestone 1 (Current)**: Refine multi-test hypothesis auto-selection logic with Benjamini-Hochberg (FDR) adjustments across large response matrices ($N > 10,000$).
- [ ] **Milestone 2**: Solidify Microsoft Power BI Embedded gateway with direct DirectQuery/Push-dataset synchronization for live survey dashboards.
- [ ] **Milestone 3**: Implement automated APA 7th Edition & IEEE statistical write-up generators with one-click LaTeX table exports.
- [ ] **Milestone 4**: Expand NLP pipeline with localized transformer embeddings (HuggingFace / BERTopic) for deeper semantic facet clustering.
- [ ] **Milestone 5**: Introduce Bayesian analysis suite ($BF_{10}$ Bayes Factors, credible intervals) alongside standard null-hypothesis significance testing (NHST).

---

## 🔒 Data Provenance, Ethics & Research Integrity

- **Non-Destructive Preprocessing**: Raw responses are never mutated or permanently deleted. Cleaned datasets are versioned alongside full audit logs (`auditLogJson`) documenting every quarantined respondent and imputed value.
- **Reproducible Seed Control**: Clustering and dimensional reduction methods adhere to deterministic pseudo-random seeds to guarantee scientific reproducibility across runs.
- **Family-Wise Error Rate Safeguards**: Automated testing calculates both unadjusted $p$-values and Bonferroni/BH-corrected thresholds to prevent data dredging and Type I false discovery inflation.
- **Secure Authentication**: User data and sensitive empirical studies are guarded by JWT tokens inside `httpOnly` secure cookies with bcrypt cryptographic salt hashing.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
