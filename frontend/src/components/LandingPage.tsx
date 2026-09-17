import React, { useState } from 'react';
import {
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BarChart2,
  TrendingUp,
  BrainCircuit,
  MessageSquareQuote,
  ShieldCheck,
  BookOpen,
  LogIn,
  UserPlus,
  Compass,
  Cpu,
  Fingerprint,
  Filter,
  PieChart,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Activity,
  Check,
  Scale,
  Binary,
  GitBranch,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MethodologyModal } from './MethodologyModal';

interface LandingPageProps {
  onOpenMethodology: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Interactive Live Decision Engine Widget State
  const [demoSampleType, setDemoSampleType] = useState<'two_groups_normal' | 'two_groups_skewed' | 'three_groups_normal' | 'categorical_matrix'>('two_groups_normal');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters in length.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        await register({ email: email.trim(), password, name: name.trim() || undefined });
      } else {
        await login({ email: email.trim(), password });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "That email and password don't match.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setError(null);
    const el = document.getElementById('auth-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToArchitecture = () => {
    const el = document.getElementById('architecture-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper for interactive decision tree widget
  const getDecisionTreeDetails = () => {
    switch (demoSampleType) {
      case 'two_groups_normal':
        return {
          scenario: 'Comparing 2 Independent Cohorts (Senior vs Junior) across Continuous Normal Metric',
          normality: 'Shapiro-Wilk W = 0.984 (p = .412 &rarr; Normality Holds)',
          selectedTest: "Welch's Two-Sample t-Test (t = 3.42, p = .0008)",
          correction: 'Bonferroni FWER Adjusted &alpha; = 0.010 (p < .01 &rarr; Significant)',
          effectSize: "Cohen's d = 0.62 (Medium-Large Effect)",
          rationale: 'Robust to unequal group variances (&sigma;₁ ≠ &sigma;₂) without pooling degrees of freedom.'
        };
      case 'two_groups_skewed':
        return {
          scenario: 'Comparing 2 Independent Cohorts across Heavy-Tailed Skewed Rating Distribution',
          normality: 'Shapiro-Wilk W = 0.812 (p = .0001 &rarr; Normality Rejected)',
          selectedTest: 'Mann-Whitney U Rank-Sum Test (U = 1420.5, p = .0034)',
          correction: 'Bonferroni FWER Adjusted &alpha; = 0.010 (p < .01 &rarr; Significant)',
          effectSize: 'Rank-Biserial Correlation r = 0.38 (Moderate)',
          rationale: 'Automatically falls back to non-parametric rank testing to prevent Type I error inflation on non-Gaussian data.'
        };
      case 'three_groups_normal':
        return {
          scenario: 'Comparing 3+ Seniority Tiers (Junior, Mid, Senior, Lead) on Cognitive Load',
          normality: "Levene's Test p = .142 &rarr; Homoscedasticity Assumed",
          selectedTest: "One-Way Analysis of Variance / Welch's ANOVA (F(3, 328) = 8.74, p = .00002)",
          correction: 'Tukey HSD Post-Hoc Pairwise Comparisons + Bonferroni FWER',
          effectSize: 'Eta-Squared (&eta;²) = 0.074 (Medium Effect)',
          rationale: 'Evaluates omnibus variance between tiers followed by post-hoc contrasts.'
        };
      case 'categorical_matrix':
        return {
          scenario: 'Cross-Tabulation of Role Category vs Preferred Research Paradigm',
          normality: 'Contingency Table (Expected Cell Frequencies E_ij ≥ 5)',
          selectedTest: "Pearson's Chi-Square Test of Independence (&chi;²(6) = 18.91, p = .0043)",
          correction: "Cramér's V = 0.24 (Moderate Association)",
          effectSize: 'Degrees of Freedom = (r - 1)(c - 1) = 6',
          rationale: 'Tests whether categorical distribution deviates significantly from independent expectation.'
        };
    }
  };

  const decisionInfo = getDecisionTreeDetails();

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-950 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Professional Sticky Navigation — Larger & More Prominent */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              S
            </div>
            <div className="flex items-baseline space-x-2.5">
              <span className="font-serif font-bold text-2xl tracking-tight text-slate-950">
                SearchSea
              </span>
              <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold border-l border-slate-200 pl-2.5">
                Empirical Research Engine
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href="http://localhost:5555"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center space-x-1.5 text-sm font-mono text-slate-600 hover:text-slate-950 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-white transition-all"
              title="Open Prisma Studio Database Tables Browser"
            >
              <Database className="w-4 h-4 text-slate-700" />
              <span>DB Studio</span>
            </a>

            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hidden sm:inline-flex items-center space-x-1.5 text-sm font-sans font-medium px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Methodology</span>
            </button>

            <button
              onClick={() => scrollToAuth('login')}
              className="inline-flex items-center space-x-1.5 text-sm font-sans font-semibold px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-300" />
              <span>Access Platform</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full space-y-20 sm:space-y-28 py-14 sm:py-20">
        
        {/* HERO SECTION: TWO-COLUMN WITH INLINE AUTH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* Left Column: Headline & Description (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-medium text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Automated Quantitative Inference & Provenance Architecture</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif font-bold text-slate-950 tracking-tight leading-[1.12]">
                Automated statistical inference, data provenance, and persona discovery for empirical research.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed max-w-2xl">
                SearchSea eliminates manual statistical wrangling. It synthesizes balanced questionnaires, isolates response anomalies into an immutable audit trail, evaluates parametric vs non-parametric hypotheses with Bonferroni correction, clusters unsupervised 2D PCA personas, and extracts qualitative themes.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setIsMethodologyOpen(true)}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-sans font-medium transition-all shadow-subtle"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>Mathematical Rationale</span>
                </button>

                <button
                  onClick={scrollToArchitecture}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border border-transparent hover:border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-sans font-medium transition-all"
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>View Architecture</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Compact Auth Card (2/5) — Always Visible */}
            <div className="lg:col-span-2">
              <div id="auth-section" className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6 shadow-card space-y-5">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                    Investigator Access
                  </div>
                  <h2 className="text-lg font-serif font-bold text-slate-950">
                    {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    {authMode === 'signup' ? 'Set up your research workspace in seconds.' : 'Sign in to continue your research.'}
                  </p>
                </div>

                {/* Auth Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); }}
                    className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-all text-center ${
                      authMode === 'login'
                        ? 'bg-white text-slate-950 shadow-subtle font-semibold'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setError(null); }}
                    className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-all text-center ${
                      authMode === 'signup'
                        ? 'bg-white text-slate-950 shadow-subtle font-semibold'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Eleanor Vance"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 text-sm font-sans text-slate-900 outline-none transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@institution.edu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 text-sm font-sans text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1">
                      Password {authMode === 'signup' && <span className="normal-case text-slate-400">(min. 8 chars)</span>}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 text-sm font-sans text-slate-900 outline-none transition-all"
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 text-sm font-sans text-slate-900 outline-none transition-all"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-sans font-semibold shadow-sm disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{loading ? 'Validating...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <p className="text-center text-[11px] text-slate-400 font-sans">
                  {authMode === 'login' ? (
                    <>Don't have an account?{' '}<button type="button" onClick={() => { setAuthMode('signup'); setError(null); }} className="text-slate-700 hover:text-slate-950 font-semibold underline underline-offset-2">Register here</button></>
                  ) : (
                    <>Already registered?{' '}<button type="button" onClick={() => { setAuthMode('login'); setError(null); }} className="text-slate-700 hover:text-slate-950 font-semibold underline underline-offset-2">Sign in</button></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* SIGNATURE KPI SUMMARY STRIP */}
          <div className="mt-14 rounded-xl bg-white border border-slate-200 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 shadow-subtle">
            <div className="pl-3 border-l-2 border-slate-900 space-y-0.5">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-slate-950 tabular-nums">
                350
              </div>
              <div className="text-xs font-sans text-slate-500 font-semibold uppercase tracking-wider">
                Benchmark Sample Records
              </div>
              <div className="text-[11px] font-mono text-slate-600">Synthetic & Live Ingestion</div>
            </div>

            <div className="pl-3 border-l-2 border-emerald-600 space-y-0.5">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-emerald-700 tabular-nums">
                94.86%
              </div>
              <div className="text-xs font-sans text-slate-500 font-semibold uppercase tracking-wider">
                Clean Acceptance Rate
              </div>
              <div className="text-[11px] font-mono text-emerald-700">18 Speeders/Straight-liners Isolated</div>
            </div>

            <div className="pl-3 border-l-2 border-amber-600 space-y-0.5">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-amber-700 tabular-nums">
                &alpha; / k
              </div>
              <div className="text-xs font-sans text-slate-500 font-semibold uppercase tracking-wider">
                Bonferroni FWER Guarantee
              </div>
              <div className="text-[11px] font-mono text-amber-700">Family-Wise Error Rate Protected</div>
            </div>

            <div className="pl-3 border-l-2 border-blue-600 space-y-0.5">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-blue-700 tabular-nums">
                K = 3
              </div>
              <div className="text-xs font-sans text-slate-500 font-semibold uppercase tracking-wider">
                Optimized Persona Clusters
              </div>
              <div className="text-[11px] font-mono text-blue-700">Silhouette Maxima at 2D PCA</div>
            </div>
          </div>
        </section>

        {/* SECTION 1: INTERACTIVE STATISTICAL DECISION ENGINE PREVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Live Decision Tree Sandbox
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950">
              Interactive Statistical Test Routing
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl font-sans">
              SearchSea inspects distributional normality, skewness, and variance homogeneity to automatically route variables to the mathematically correct statistical test.
            </p>
          </div>

          {/* Interactive Widget Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200 text-xs font-mono">
              <span className="text-slate-500 uppercase font-semibold mr-2">Select Scenario:</span>
              <button
                type="button"
                onClick={() => setDemoSampleType('two_groups_normal')}
                className={`px-3 py-1.5 rounded transition-all ${
                  demoSampleType === 'two_groups_normal'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2 Cohorts &bull; Normal
              </button>
              <button
                type="button"
                onClick={() => setDemoSampleType('two_groups_skewed')}
                className={`px-3 py-1.5 rounded transition-all ${
                  demoSampleType === 'two_groups_skewed'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2 Cohorts &bull; Non-Gaussian
              </button>
              <button
                type="button"
                onClick={() => setDemoSampleType('three_groups_normal')}
                className={`px-3 py-1.5 rounded transition-all ${
                  demoSampleType === 'three_groups_normal'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3+ Seniority Tiers
              </button>
              <button
                type="button"
                onClick={() => setDemoSampleType('categorical_matrix')}
                className={`px-3 py-1.5 rounded transition-all ${
                  demoSampleType === 'categorical_matrix'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Categorical Cross-Tab
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4 font-sans text-xs">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Hypothesis Target Scenario</span>
                  <span className="text-sm font-serif font-semibold text-slate-900">{decisionInfo.scenario}</span>
                </div>

                <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold uppercase">Distribution Check:</span>
                    <span className="text-slate-800 font-medium">{decisionInfo.normality}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold uppercase">Assigned Inference Test:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{decisionInfo.selectedTest}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold uppercase">Correction Threshold:</span>
                    <span className="text-slate-800 font-medium">{decisionInfo.correction}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold uppercase">Standardized Effect Size:</span>
                    <span className="text-slate-800 font-bold">{decisionInfo.effectSize}</span>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed font-sans">
                  <strong>Methodological Rationale:</strong> {decisionInfo.rationale}
                </p>
              </div>

              <div className="p-5 rounded bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                    Decision Engine Rules
                  </div>
                  <div className="space-y-1 text-slate-700 text-[11px]">
                    <div>&bull; Normality test: Shapiro-Wilk (&alpha; = 0.05)</div>
                    <div>&bull; Equal variance: Levene's Test</div>
                    <div>&bull; Non-parametric: Mann-Whitney / Kruskal-Wallis</div>
                    <div>&bull; Multiple tests: FWER &alpha; / k Bonferroni</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={scrollToArchitecture}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold rounded transition-colors text-center"
                >
                  Explore Protocol Architecture &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 5-PHASE ARCHITECTURAL BREAKDOWN */}
        <section id="architecture-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Platform Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950">
              The Five Stages of Automated Quantitative Discovery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3 shadow-subtle">
              <div className="font-mono text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 flex justify-between">
                <span>01</span>
                <span>SYNTHESIS</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Protocol Generation</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Transforms plain research objectives into structured Likert scales and balanced multi-choice questions.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3 shadow-subtle">
              <div className="font-mono text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 flex justify-between">
                <span>02</span>
                <span>PROVENANCE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Anomaly Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Detects speeders (&lt;15s) and straight-liners (&sigma; &le; 0.35) into an immutable audit trail without destroying raw data.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3 shadow-subtle">
              <div className="font-mono text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 flex justify-between">
                <span>03</span>
                <span>INFERENCE</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Hypothesis Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Executes Welch's t, ANOVA, or Chi-Square tests while enforcing Bonferroni family-wise error rate control.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3 shadow-subtle">
              <div className="font-mono text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 flex justify-between">
                <span>04</span>
                <span>CLUSTERING</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">2D PCA Personas</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Evaluates Silhouette maxima across K=2..8 and projects respondents onto 2D coordinate scatter plots.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-3 shadow-subtle">
              <div className="font-mono text-xs font-bold text-slate-400 border-b border-slate-100 pb-2 flex justify-between">
                <span>05</span>
                <span>NLP</span>
              </div>
              <h3 className="font-serif font-bold text-sm text-slate-900">Qualitative Topics</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Vectorizes open comments via TF-IDF to extract semantic clusters and minimal-distance verbatim quotes.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: INSTITUTIONAL COMPARISON TABLE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Capability Matrix
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950">
              Comparative Analysis Across Research Platforms
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-subtle">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 font-mono text-[11px] uppercase bg-slate-50 text-slate-600">
                  <th className="px-5 py-3.5">Research Requirement</th>
                  <th className="px-5 py-3.5 text-slate-950 font-bold bg-slate-100/70">SearchSea Engine</th>
                  <th className="px-5 py-3.5 text-slate-600">Manual Spreadsheets</th>
                  <th className="px-5 py-3.5 text-slate-600">Legacy SPSS Packages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Data Cleaning & Quality Audit</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Automated Speeders & Straight-Lining Audit</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">Manual row filtering (data corruption risk)</td>
                  <td className="px-5 py-3.5 text-slate-500">Custom syntax scripts required</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Assumption Verification</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Automated Normality Check &rarr; Test Routing</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">None (blind parametric assumptions)</td>
                  <td className="px-5 py-3.5 text-slate-500">Manual assumption checks per metric</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Multiple Testing Control</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Bonferroni FWER & Benjamini-Hochberg FDR</span>
                  </td>
                  <td className="px-5 py-3.5 text-amber-700 font-medium">Ignored (&gt;60% Type I error inflation)</td>
                  <td className="px-5 py-3.5 text-slate-500">Manual calculation post-hoc</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Persona Attribution</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>2D PCA Coordinate Map + Silhouette K</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">Not supported</td>
                  <td className="px-5 py-3.5 text-slate-500">Complex multi-step clustering dialogs</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Qualitative Text Extraction</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>TF-IDF Semantic Topics + Representative Quotes</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">Manual reading of hundreds of rows</td>
                  <td className="px-5 py-3.5 text-slate-500">Requires separate text module</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-serif font-semibold text-slate-900 text-sm">Executive Presentation</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-800 font-semibold bg-slate-50/50 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Printable Journal PDF + Power BI Embed</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">Manual slide creation</td>
                  <td className="px-5 py-3.5 text-slate-500">Monochrome raw output text</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: CTA BANNER — Auth is already inline in hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950">
            Ready to automate your empirical workflow?
          </h2>
          <p className="text-sm text-slate-600 font-sans max-w-2xl mx-auto">
            Create your free investigator account and start running statistically rigorous analyses in minutes — no SPSS license or manual wrangling required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={() => { scrollToAuth('signup'); }}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-sans font-semibold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-slate-300" />
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { scrollToAuth('login'); }}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-sans font-medium transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-600" />
              <span>Sign In</span>
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 text-xs font-sans text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-serif font-bold text-xs">
              S
            </div>
            <span className="font-serif font-bold text-sm text-slate-950">SearchSea</span>
            <span>&bull;</span>
            <span className="font-mono text-[11px]">Empirical Quantitative Platform &bull; v1.0</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-950 transition-colors">
              Python ML API Docs
            </a>
            <span>&bull;</span>
            <a href="http://localhost:5555" target="_blank" rel="noreferrer" className="hover:text-slate-950 transition-colors">
              Prisma Studio DB
            </a>
            <span>&bull;</span>
            <button onClick={() => setIsMethodologyOpen(true)} className="hover:text-slate-950 transition-colors">
              Methodology & Defense
            </button>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
