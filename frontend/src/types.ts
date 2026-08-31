export type QuestionType = 'likert' | 'multiple_choice' | 'numeric' | 'open_ended';

export interface Question {
  id?: string;
  code: string;
  title: string;
  type: QuestionType;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  required?: boolean;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  archetype: string;
  description: string;
  suggestedQuestions: Question[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  objective?: string;
  archetype?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ANALYZED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  totalResponsesCount?: number;
  _count?: {
    questions: number;
    responses: number;
    analysisRuns: number;
  };
}

export interface PreprocessSummary {
  raw_count: number;
  clean_count: number;
  flagged_count: number;
  clean_rate: number;
  flagged_records: Array<{
    response_id: string;
    index: number;
    reason: string;
    detail: string;
  }>;
  audit_log: string[];
  missing_summary: Record<string, string>;
  clean_data: Array<Record<string, any>>;
}

export interface HypothesisTestResult {
  test_used: string;
  independent_var: string;
  dependent_var: string;
  statistic: number;
  p_value: number;
  p_value_formatted: string;
  degrees_of_freedom?: number | null;
  effect_size: {
    name: string;
    value: number;
    magnitude: 'Small' | 'Medium' | 'Large';
  };
  alpha_raw: number;
  alpha_bonferroni: number;
  is_significant_raw: boolean;
  is_significant_bonferroni: boolean;
  normality_check: {
    tested: boolean;
    p_value: number | null;
    is_normal: boolean;
  };
  assumptions_note: string;
  group_stats: Record<string, any>;
  executive_summary: string;
}

export interface ClusterInfo {
  id: number;
  label: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
  numeric_traits: Record<string, { mean: number; overall_mean: number; delta: number }>;
  top_categories: Record<string, string>;
}

export interface ClusterResultData {
  n_clusters: number;
  method: string;
  silhouette_score: number;
  pca_variance_explained: number[];
  k_evaluations: Array<{ k: number; silhouette_score: number; inertia: number }>;
  clusters: ClusterInfo[];
  points: Array<{
    id: string;
    x: number;
    y: number;
    cluster_id: number;
    metadata: Record<string, string>;
  }>;
}

export interface ThemeItem {
  id: number;
  title: string;
  keywords: string[];
  count: number;
  percentage: number;
  color: string;
  sentiment_breakdown: {
    positive_pct: number;
    negative_pct: number;
    neutral_pct: number;
  };
  representative_quotes: Array<{
    quote: string;
    sentiment: string;
  }>;
}

export interface ThemeResultData {
  themes: ThemeItem[];
  total_analyzed: number;
  sentiment_overview: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface AnalysisRunFull {
  id?: string;
  runId?: string;
  runName: string;
  surveyTitle?: string;
  objective?: string;
  createdAt?: string;
  totalResponses: number;
  cleanResponses: number;
  cleanRate: number;
  flaggedSpeeders: number;
  flaggedStraightliners: number;
  preprocessing: PreprocessSummary;
  hypothesisTesting: {
    totalTests: number;
    alphaRaw: number;
    alphaBonferroni: number;
    tests: HypothesisTestResult[];
  };
  clustering?: ClusterResultData | null;
  nlpThemes?: ThemeResultData | null;
}
