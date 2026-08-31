import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  FileDown,
  AlertTriangle,
  Layers,
  Search,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import { api } from '../api';
import { Survey, AnalysisRunFull, HypothesisTestResult } from '../types';
import { PowerBiReport } from './PowerBiReport';

interface DashboardViewProps {
  survey: Survey;
  onBack: () => void;
  onOpenIngest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  survey,
  onBack,
  onOpenIngest,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'provenance' | 'hypotheses' | 'clustering' | 'nlp' | 'report' | 'powerbi'>('overview');
  const [analysisData, setAnalysisData] = useState<AnalysisRunFull | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);

  // Custom hypothesis tester state
  const [customIv, setCustomIv] = useState<string>('user_segment');
  const [customDv, setCustomDv] = useState<string>('');
  const [customTestResult, setCustomTestResult] = useState<HypothesisTestResult | null>(null);
  const [customTesting, setCustomTesting] = useState<boolean>(false);

  const fetchLatestRun = async () => {
    setLoading(true);
    try {
      const runs = await api.getAnalysisRuns(survey.id);
      if (runs && runs.length > 0) {
        const fullDetail = await api.getAnalysisRunDetail(runs[0].id);
        setAnalysisData(fullDetail);
      } else {
        const respCount = survey._count?.responses || survey.totalResponsesCount || 0;
        if (respCount >= 5) {
          const run = await api.runAnalysis(survey.id);
          setAnalysisData(run);
        }
      }
    } catch (err: any) {
      console.error('Failed to load analysis run:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRun();
  }, [survey.id]);

  useEffect(() => {
    if (survey.questions && survey.questions.length > 0 && !customDv) {
      const firstLikert = survey.questions.find((q) => q.type === 'likert' || q.type === 'numeric');
      if (firstLikert) setCustomDv(firstLikert.code);
    }
  }, [survey.questions]);

  const handleRunPipeline = async () => {
    setRunningAnalysis(true);
    try {
      const result = await api.runAnalysis(survey.id);
      setAnalysisData(result);
      setActiveTab('overview');
    } catch (err: any) {
      alert(`Pipeline execution error: ${err.message}`);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleRunCustomTest = async () => {
    if (!customIv || !customDv) return;
    setCustomTesting(true);
    try {
      const res = await api.runCustomHypothesis(survey.id, {
        independentVar: customIv,
        dependentVar: customDv,
        testType: 'auto',
      });
      setCustomTestResult(res);
    } catch (err: any) {
      alert(`Hypothesis test error: ${err.message}`);
    } finally {
      setCustomTesting(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 font-mono text-xs text-ink-muted">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent-action" />
        <p>Loading dataset and evaluating statistical models...</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="bg-bg-surface border border-hairline p-12 text-left max-w-xl mx-auto space-y-3 my-8">
        <div className="font-mono text-xs text-ink-muted uppercase tracking-wider">
          Unprocessed Study Protocol
        </div>
        <h2 className="text-lg font-serif font-semibold text-ink">
          Awaiting Response Ingestion
        </h2>
        <p className="text-xs text-ink-muted font-sans max-w-md">
          This study requires respondent data before the automated preprocessing, hypothesis testing, and clustering engine can execute.
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 border border-hairline text-xs font-sans text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            Return to Registry
          </button>
          <button
            onClick={onOpenIngest}
            className="px-3.5 py-1.5 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 transition-opacity"
          >
            Ingest Responses
          </button>
        </div>
      </div>
    );
  }

  const flaggedTotal = (analysisData.flaggedSpeeders || 0) + (analysisData.flaggedStraightliners || 0);
  const clusterColors = ['#2B3A67', '#1F6F5C', '#B5651D', '#5A6072', '#12151C'];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1 text-xs font-mono text-ink-muted hover:text-ink transition-colors mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>STUDIES REGISTRY</span>
          </button>
          <div className="flex items-baseline space-x-3">
            <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              {survey.title}
            </h1>
            <span className="inline-flex items-center space-x-1 text-xs font-mono text-accent-significant">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-significant"></span>
              <span>Validated Dataset</span>
            </span>
          </div>
          <p className="text-xs text-ink-muted font-sans max-w-2xl">
            {survey.objective || 'Automated quantitative empirical pipeline.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start lg:self-auto">
          <button
            onClick={onOpenIngest}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-hairline bg-bg-base text-ink text-xs font-sans font-medium hover:border-ink transition-colors"
          >
            <Database className="w-3 h-3 text-ink-muted" />
            <span>Ingest Data</span>
          </button>

          <button
            disabled={runningAnalysis}
            onClick={handleRunPipeline}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw className={`w-3 h-3 ${runningAnalysis ? 'animate-spin' : ''}`} />
            <span>{runningAnalysis ? 'Executing Pipeline...' : 'Re-run Pipeline'}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-hairline text-ink-muted hover:text-ink hover:border-ink text-xs font-sans font-medium transition-colors"
          >
            <FileDown className="w-3 h-3" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Signature Element: KPI Summary Strip (The ONLY element allowed elevation/border) */}
      <div className="kpi-strip p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="font-mono text-2xl font-semibold text-ink tabular-nums tracking-tight">
            {analysisData.totalResponses?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] font-sans text-ink-muted uppercase tracking-wider mt-0.5">
            Total Responses
          </div>
        </div>

        <div>
          <div className="font-mono text-2xl font-semibold text-ink tabular-nums tracking-tight">
            100%
          </div>
          <div className="text-[11px] font-sans text-ink-muted uppercase tracking-wider mt-0.5">
            Completion Rate
          </div>
        </div>

        <div>
          <div className="font-mono text-2xl font-semibold text-accent-significant tabular-nums tracking-tight">
            {analysisData.cleanRate || 0}%
          </div>
          <div className="text-[11px] font-sans text-ink-muted uppercase tracking-wider mt-0.5">
            Clean Rate
          </div>
        </div>

        <div>
          <div className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${
            flaggedTotal > 0 ? 'text-accent-flagged' : 'text-ink'
          }`}>
            {flaggedTotal.toLocaleString()}
          </div>
          <div className="text-[11px] font-sans text-ink-muted uppercase tracking-wider mt-0.5">
            Flagged Anomalies
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-hairline space-x-6 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          1. Overview
        </button>

        <button
          onClick={() => setActiveTab('provenance')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'provenance'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          2. Data Provenance ({flaggedTotal})
        </button>

        <button
          onClick={() => setActiveTab('hypotheses')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'hypotheses'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          3. Hypothesis Testing ({analysisData.hypothesisTesting?.tests?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('clustering')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'clustering'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          4. Segmentation (K={analysisData.clustering?.n_clusters || 3})
        </button>

        <button
          onClick={() => setActiveTab('nlp')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'nlp'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          5. NLP Themes ({analysisData.nlpThemes?.themes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'report'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          6. Executive Report
        </button>

        <button
          onClick={() => setActiveTab('powerbi')}
          className={`py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'powerbi'
              ? 'border-accent-action text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          7. Power BI Executive
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Executive Synthesis */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-serif font-semibold text-ink">
                  Executive Research Synthesis
                </h2>
                <p className="text-xs text-ink-muted font-sans leading-relaxed max-w-2xl">
                  Automated empirical evaluation over{' '}
                  <span className="font-mono font-medium text-ink tabular-nums">{analysisData.cleanResponses?.toLocaleString()}</span>{' '}
                  clean records (out of <span className="font-mono text-ink tabular-nums">{analysisData.totalResponses?.toLocaleString()}</span> ingested).{' '}
                  Data cleaning filtered{' '}
                  <span className="font-mono font-medium text-accent-flagged tabular-nums">{analysisData.flaggedSpeeders || 0} speeders</span> and{' '}
                  <span className="font-mono font-medium text-accent-flagged tabular-nums">{analysisData.flaggedStraightliners || 0} straight-liners</span>.
                </p>
              </div>

              {/* Stat Highlights Table */}
              <div className="border border-hairline">
                <div className="px-4 py-2.5 bg-bg-surface border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Primary Statistical Findings
                </div>
                <div className="divide-y divide-hairline">
                  {analysisData.hypothesisTesting?.tests?.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="p-3.5 space-y-1 bg-bg-base">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-serif font-semibold text-ink">
                          {t.independent_var} &rarr; {t.dependent_var}
                        </span>
                        <span className={`font-mono text-xs font-semibold tabular-nums ${
                          t.is_significant_bonferroni
                            ? 'text-accent-significant'
                            : t.is_significant_raw
                            ? 'text-accent-flagged'
                            : 'text-ink-muted'
                        }`}>
                          p = {t.p_value_formatted}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted font-sans leading-normal">
                        {t.executive_summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Persona Snapshot & Protocol Summary */}
            <div className="space-y-4">
              <div className="border border-hairline p-4 space-y-3 bg-bg-surface">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Identified Personas ({analysisData.clustering?.n_clusters || 0})
                </div>
                <div className="space-y-2">
                  {analysisData.clustering?.clusters?.map((cl, idx) => (
                    <div key={cl.id} className="text-xs pb-2 border-b border-hairline last:border-0 last:pb-0">
                      <div className="flex justify-between font-mono">
                        <span className="font-semibold text-ink">{cl.name}</span>
                        <span className="text-ink-muted tabular-nums">{cl.percentage}%</span>
                      </div>
                      <div className="text-[11px] text-ink-muted font-sans mt-0.5">
                        Sample: <span className="font-mono tabular-nums">{cl.count}</span> respondents
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-hairline p-4 space-y-2 bg-bg-base">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  Protocol Details
                </div>
                <div className="text-xs font-mono text-ink-muted space-y-1">
                  <div>Study ID: <span className="text-ink">{survey.id.slice(0, 8)}...</span></div>
                  <div>Archetype: <span className="text-ink">{survey.archetype || 'custom'}</span></div>
                  <div>PCA Variance: <span className="text-ink">{analysisData.clustering?.pca_variance_explained?.reduce((a, b) => a + b, 0)}%</span></div>
                  <div>Created: <span className="text-ink">{new Date(survey.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA PROVENANCE & AUDIT */}
      {activeTab === 'provenance' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-serif font-semibold text-ink">
              Data Cleaning & Provenance Audit Log
            </h2>
            <p className="text-xs text-ink-muted font-sans max-w-2xl">
              Strict audit trail of raw response records vs validated output. All flagged anomalies are isolated without mutating historical raw data.
            </p>
          </div>

          {/* Audit Steps */}
          <div className="border border-hairline">
            <div className="px-4 py-2.5 bg-bg-surface border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Pipeline Execution Sequence
            </div>
            <div className="divide-y divide-hairline">
              {analysisData.preprocessing?.audit_log?.map((log: string, idx: number) => (
                <div key={idx} className="px-4 py-2.5 text-xs font-mono flex items-baseline space-x-3 bg-bg-base">
                  <span className="text-ink-muted tabular-nums shrink-0">{idx + 1}.</span>
                  <span className="text-ink font-sans">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flagged Records Table */}
          <div className="border border-hairline">
            <div className="px-4 py-2.5 bg-bg-surface border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted flex justify-between">
              <span>Isolated Anomaly Records ({analysisData.preprocessing?.flagged_records?.length || 0})</span>
              <span>Thresholds: Speeders &lt;15s | Straight-Liners &sigma; &le; 0.35</span>
            </div>

            {analysisData.preprocessing?.flagged_records && analysisData.preprocessing.flagged_records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-hairline font-mono text-[10px] uppercase text-ink-muted bg-bg-surface">
                      <th className="px-4 py-2">Index</th>
                      <th className="px-4 py-2">Response ID</th>
                      <th className="px-4 py-2">Isolation Reason</th>
                      <th className="px-4 py-2">Audit Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline font-mono text-xs">
                    {analysisData.preprocessing.flagged_records.map((r, i) => (
                      <tr key={i} className="hover:bg-bg-surface/50">
                        <td className="px-4 py-2 text-ink-muted tabular-nums">{r.index}</td>
                        <td className="px-4 py-2 font-medium text-ink">{r.response_id}</td>
                        <td className="px-4 py-2 text-accent-flagged font-sans">{r.reason}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-xs font-mono text-ink-muted">
                No anomalous records flagged in current dataset.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HYPOTHESIS TESTING EXPLORER */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          {/* Interactive Hypothesis Tester */}
          <div className="border border-hairline p-4 bg-bg-surface space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-ink font-semibold">
                Interactive Hypothesis Selector
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                Automated: Normality Check &rarr; Welch's t / Mann-Whitney / ANOVA / Chi-Square
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Independent Variable (Group)
                </label>
                <select
                  value={customIv}
                  onChange={(e) => setCustomIv(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-bg-base border border-hairline text-xs font-sans text-ink outline-none"
                >
                  <option value="user_segment">user_segment (Cohort / Persona)</option>
                  {survey.questions?.map((q) => (
                    <option key={q.code} value={q.code}>
                      {q.code} ({q.title.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Dependent Variable (Metric)
                </label>
                <select
                  value={customDv}
                  onChange={(e) => setCustomDv(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-bg-base border border-hairline text-xs font-sans text-ink outline-none"
                >
                  {survey.questions?.map((q) => (
                    <option key={q.code} value={q.code}>
                      {q.code} ({q.title.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  disabled={customTesting}
                  onClick={handleRunCustomTest}
                  className="w-full py-1.5 px-3 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {customTesting ? 'Evaluating...' : 'Execute Test'}
                </button>
              </div>
            </div>

            {customTestResult && (
              <div className="p-3.5 bg-bg-base border border-hairline space-y-2 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono font-semibold text-ink">
                    {customTestResult.test_used}
                  </span>
                  <span className={`font-mono text-xs font-semibold tabular-nums ${
                    customTestResult.is_significant_raw ? 'text-accent-significant' : 'text-ink-muted'
                  }`}>
                    {customTestResult.is_significant_raw ? 'Significant (p < .05)' : 'Not Significant'}
                  </span>
                </div>
                <p className="text-xs text-ink font-sans leading-relaxed">
                  {customTestResult.executive_summary}
                </p>
                <div className="flex flex-wrap gap-4 font-mono text-[11px] text-ink-muted pt-2 border-t border-hairline">
                  <div>Statistic: <span className="text-ink font-semibold tabular-nums">{customTestResult.statistic}</span></div>
                  <div>$p$-value: <span className="text-ink font-semibold tabular-nums">{customTestResult.p_value_formatted}</span></div>
                  <div>
                    Effect Size ({customTestResult.effect_size?.name}):{' '}
                    <span className="text-ink font-semibold tabular-nums">{customTestResult.effect_size?.value} ({customTestResult.effect_size?.magnitude})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Table (R Stats / Academic Journal Table format) */}
          <div className="border border-hairline">
            <div className="px-4 py-2.5 bg-bg-surface border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted flex justify-between">
              <span>Statistical Inference Results Table</span>
              <span>Bonferroni Family-Wise Adjustment Applied</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-hairline font-mono text-[10px] uppercase text-ink-muted bg-bg-surface">
                    <th className="px-4 py-2">Hypothesis (IV &rarr; DV)</th>
                    <th className="px-4 py-2">Test Used</th>
                    <th className="px-4 py-2">Statistic</th>
                    <th className="px-4 py-2">p-value</th>
                    <th className="px-4 py-2">Effect Size</th>
                    <th className="px-4 py-2">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {analysisData.hypothesisTesting?.tests?.map((t, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-bg-surface/50">
                        <td className="px-4 py-3 font-medium text-ink font-serif">
                          {t.independent_var} &rarr; {t.dependent_var}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                          {t.test_used}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink">
                          {t.statistic}
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs tabular-nums font-semibold ${
                          t.is_significant_bonferroni
                            ? 'text-accent-significant'
                            : t.is_significant_raw
                            ? 'text-accent-flagged'
                            : 'text-ink-muted'
                        }`}>
                          {t.p_value_formatted}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink">
                          {t.effect_size?.value} ({t.effect_size?.name})
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {t.is_significant_bonferroni ? (
                            <span className="text-accent-significant">Survives Bonferroni</span>
                          ) : t.is_significant_raw ? (
                            <span className="text-accent-flagged">Raw p&lt;.05 Only</span>
                          ) : (
                            <span className="text-ink-muted">Non-Significant</span>
                          )}
                        </td>
                      </tr>

                      {/* Group Distribution Chart row */}
                      {t.group_stats && Object.keys(t.group_stats).length > 0 && (
                        <tr className="bg-bg-surface/30">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="space-y-1 max-w-xl">
                              <div className="text-[10px] font-mono uppercase text-ink-muted">
                                Group Distribution Mean
                              </div>
                              <div className="h-28 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={Object.entries(t.group_stats).map(([name, vals]: [string, any]) => ({
                                      name: name.length > 18 ? name.slice(0, 18) + '...' : name,
                                      mean: vals.mean !== undefined ? parseFloat(vals.mean?.toFixed?.(2) || vals.mean) : undefined,
                                      count: vals.count,
                                    }))}
                                    margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                                  >
                                    <XAxis dataKey="name" stroke="#5A6072" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} interval={0} />
                                    <YAxis stroke="#5A6072" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                                    <RechartsTooltip
                                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E5E9', fontSize: '11px', fontFamily: 'IBM Plex Mono' }}
                                    />
                                    <Bar dataKey={Object.values(t.group_stats).some((v: any) => v.mean !== undefined) ? 'mean' : 'count'} fill="#2B3A67" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESPONDENT CLUSTERING & PCA */}
      {activeTab === 'clustering' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2D PCA Scatter Visualization */}
            <div className="lg:col-span-2 border border-hairline p-4 space-y-3 bg-bg-base">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <div>
                  <h3 className="font-serif font-semibold text-sm text-ink">
                    2D PCA Coordinate Projection
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted">
                    Explained Variance: {analysisData.clustering?.pca_variance_explained?.reduce((a, b) => a + b, 0)}%
                  </p>
                </div>
                <span className="text-xs font-mono text-ink-muted">
                  K = {analysisData.clustering?.n_clusters || 3} Clusters
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                    <XAxis type="number" dataKey="x" name="PCA 1" stroke="#5A6072" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                    <YAxis type="number" dataKey="y" name="PCA 2" stroke="#5A6072" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                    <ZAxis range={[25, 25]} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '2 2' }}
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="p-2 bg-bg-base border border-hairline text-xs font-mono shadow-sm">
                              <div className="font-semibold text-ink">Cluster {pt.cluster_id + 1}</div>
                              <div className="text-ink-muted">ID: {pt.id}</div>
                              <div className="text-ink-muted">({pt.x}, {pt.y})</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {analysisData.clustering?.clusters?.map((cl, idx) => {
                      const clusterPoints = analysisData.clustering?.points?.filter((p) => p.cluster_id === cl.id) || [];
                      return (
                        <Scatter
                          key={cl.id}
                          name={cl.name}
                          data={clusterPoints}
                          fill={clusterColors[idx % clusterColors.length]}
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Silhouette Optimization */}
            <div className="border border-hairline p-4 space-y-3 bg-bg-surface">
              <div>
                <h3 className="font-serif font-semibold text-sm text-ink">
                  Silhouette Analysis ($K$)
                </h3>
                <p className="text-[11px] font-mono text-ink-muted">Optimization for cluster compactness</p>
              </div>

              <div className="space-y-1.5">
                {analysisData.clustering?.k_evaluations?.map((ev) => (
                  <div
                    key={ev.k}
                    className={`p-2 border text-xs font-mono flex items-center justify-between ${
                      ev.k === analysisData.clustering?.n_clusters
                        ? 'border-accent-action bg-bg-base text-ink font-semibold'
                        : 'border-hairline bg-bg-surface text-ink-muted'
                    }`}
                  >
                    <span>K = {ev.k}</span>
                    <span className="tabular-nums">Score: {ev.silhouette_score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Persona Panels */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">
              Distinguishing Segment Personas
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisData.clustering?.clusters?.map((cl, idx) => (
                <div
                  key={cl.id}
                  className="border border-hairline p-4 bg-bg-surface space-y-3"
                >
                  <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                    <div className="font-serif font-semibold text-sm text-ink">{cl.name}</div>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">{cl.percentage}%</span>
                  </div>

                  <div className="text-xs font-mono text-ink-muted">
                    Size: <span className="text-ink font-semibold tabular-nums">{cl.count}</span> respondents
                  </div>

                  <div className="space-y-1 pt-1 text-xs font-mono">
                    <div className="text-[10px] uppercase tracking-wider text-ink-muted">Distinguishing Traits:</div>
                    {Object.entries(cl.numeric_traits || {}).slice(0, 3).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-ink-muted">
                        <span className="truncate max-w-[150px]">{key}:</span>
                        <span className="text-ink font-semibold tabular-nums">
                          {val.mean} ({val.delta > 0 ? `+${val.delta}` : val.delta})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart: Cluster Centroids */}
          {analysisData.clustering?.clusters && analysisData.clustering.clusters.length > 0 && (() => {
            const allTraits = new Set<string>();
            analysisData.clustering!.clusters!.forEach((cl) => {
              Object.keys(cl.numeric_traits || {}).forEach((k) => allTraits.add(k));
            });
            const traitKeys = Array.from(allTraits).slice(0, 6);
            if (traitKeys.length < 2) return null;

            const radarData = traitKeys.map((trait) => {
              const entry: any = { trait: trait.replace(/_/g, ' ') };
              analysisData.clustering!.clusters!.forEach((cl) => {
                entry[cl.name || `Cluster ${cl.id + 1}`] = cl.numeric_traits?.[trait]?.mean ?? 0;
              });
              return entry;
            });

            return (
              <div className="border border-hairline p-4 space-y-3 bg-bg-base">
                <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                  Centroid Comparison Radar
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#E3E5E9" />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 9, fill: '#5A6072', fontFamily: 'IBM Plex Mono' }} />
                      <PolarRadiusAxis tick={{ fontSize: 8, fill: '#5A6072', fontFamily: 'IBM Plex Mono' }} />
                      {analysisData.clustering!.clusters!.map((cl, idx) => (
                        <Radar
                          key={cl.id}
                          name={cl.name || `Cluster ${cl.id + 1}`}
                          dataKey={cl.name || `Cluster ${cl.id + 1}`}
                          stroke={clusterColors[idx % clusterColors.length]}
                          fill={clusterColors[idx % clusterColors.length]}
                          fillOpacity={0.1}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Mono' }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E5E9', fontSize: '11px', fontFamily: 'IBM Plex Mono' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: NLP THEMES & SENTIMENT */}
      {activeTab === 'nlp' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-serif font-semibold text-ink">
              Qualitative NLP Thematic Discovery
            </h2>
            <p className="text-xs text-ink-muted font-sans max-w-2xl">
              Semantic clustering over open-ended feedback via TF-IDF vectorization and Euclidean distance centroid ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.nlpThemes?.themes?.map((th) => {
              const isPositive = th.sentiment_breakdown?.positive_pct >= th.sentiment_breakdown?.negative_pct;
              return (
                <div
                  key={th.id}
                  className="border border-hairline p-4 bg-bg-surface space-y-3"
                >
                  <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isPositive ? 'bg-accent-significant' : 'bg-accent-flagged'
                      }`}></span>
                      <h3 className="font-serif font-semibold text-sm text-ink">{th.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">
                      {th.percentage}% ({th.count} mentions)
                    </span>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1">
                    {th.keywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-bg-base border border-hairline text-[10px] font-mono text-ink-muted"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Representative Quotes (Italic Sans) */}
                  <div className="space-y-2 pt-2 border-t border-hairline">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                      Representative Quotes:
                    </div>
                    {th.representative_quotes?.map((rq, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-bg-base border border-hairline text-xs font-sans italic text-ink leading-relaxed"
                      >
                        &ldquo;{rq.quote}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: EXECUTIVE REPORT VIEW (PRINT-OPTIMIZED) */}
      {activeTab === 'report' && (
        <div className="border border-hairline p-8 bg-bg-base space-y-6 print-page max-w-4xl">
          {/* Header */}
          <div className="border-b border-hairline pb-4 space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Empirical Research Report Supplement
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink">
              {survey.title}
            </h1>
            <div className="flex gap-4 font-mono text-xs text-ink-muted">
              <div>Date: <span className="text-ink">{new Date().toLocaleDateString()}</span></div>
              <div>Sample Size: <span className="text-ink tabular-nums">{analysisData.cleanResponses}</span></div>
              <div>Validity Rate: <span className="text-ink tabular-nums">{analysisData.cleanRate}%</span></div>
            </div>
          </div>

          {/* Section 1: Objective */}
          <div className="space-y-1">
            <h2 className="text-sm font-serif font-semibold text-ink uppercase tracking-wider">
              1. Research Objective & Context
            </h2>
            <p className="text-xs text-ink font-sans leading-relaxed max-w-2xl">
              {survey.objective || survey.description || 'Quantitative empirical research study.'}
            </p>
          </div>

          {/* Section 2: Summary Stats */}
          <div className="space-y-2">
            <h2 className="text-sm font-serif font-semibold text-ink uppercase tracking-wider">
              2. Statistical Inference Summary Table
            </h2>
            <table className="w-full text-left text-xs font-sans border border-hairline">
              <thead>
                <tr className="border-b border-hairline font-mono text-[10px] uppercase text-ink-muted bg-bg-surface">
                  <th className="px-3 py-1.5">Independent Var</th>
                  <th className="px-3 py-1.5">Dependent Var</th>
                  <th className="px-3 py-1.5">Test Statistic</th>
                  <th className="px-3 py-1.5">p-value</th>
                  <th className="px-3 py-1.5">Effect Size</th>
                  <th className="px-3 py-1.5">Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline font-mono text-xs">
                {analysisData.hypothesisTesting?.tests?.map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-1.5 font-sans font-medium text-ink">{t.independent_var}</td>
                    <td className="px-3 py-1.5 font-sans text-ink">{t.dependent_var}</td>
                    <td className="px-3 py-1.5 tabular-nums">{t.statistic}</td>
                    <td className="px-3 py-1.5 tabular-nums font-semibold text-ink">{t.p_value_formatted}</td>
                    <td className="px-3 py-1.5 tabular-nums">{t.effect_size?.value}</td>
                    <td className="px-3 py-1.5 font-sans text-xs">
                      {t.is_significant_bonferroni ? 'Bonferroni Sig (p < .01)' : t.is_significant_raw ? 'Raw p < .05' : 'n.s.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Personas */}
          <div className="space-y-2">
            <h2 className="text-sm font-serif font-semibold text-ink uppercase tracking-wider">
              3. Unsupervised Segment Profiles
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {analysisData.clustering?.clusters?.map((cl) => (
                <div key={cl.id} className="p-3 border border-hairline text-xs font-sans space-y-1">
                  <div className="font-serif font-semibold text-ink">{cl.name}</div>
                  <div className="font-mono text-[11px] text-ink-muted">Weight: {cl.percentage}% ({cl.count})</div>
                  <div className="font-mono text-[10px] text-ink-muted pt-1 border-t border-hairline">
                    {Object.entries(cl.numeric_traits || {}).slice(0, 2).map(([k, v]) => (
                      <div key={k}>{k}: {v.mean}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Print button */}
          <div className="pt-4 border-t border-hairline no-print flex justify-end">
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 transition-opacity"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Print Executive PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: POWER BI EMBEDDED REPORT */}
      {activeTab === 'powerbi' && (
        <PowerBiReport survey={survey} analysisData={analysisData} />
      )}
    </div>
  );
};

export default DashboardView;
