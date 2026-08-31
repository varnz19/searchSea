import axios from 'axios';
import {
  Survey,
  SurveyTemplate,
  Question,
  AnalysisRunFull,
  HypothesisTestResult,
} from './types';

// Ensure httpOnly session cookies are transmitted across requests
axios.defaults.withCredentials = true;

const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  institution?: string | null;
  discipline?: string | null;
  orcidId?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface MethodologicalSettings {
  defaultAlpha: number;
  defaultCorrectionMethod: 'bonferroni' | 'benjamini_hochberg' | 'none';
  speederDurationCutoffSeconds: number;
  straightlineStdThreshold: number;
  entropyCutoffThreshold: number;
  reportingNotationStyle: 'apa_7th' | 'clinical' | 'compact_latex';
  autoRunPipelineOnIngest: boolean;
}

export interface LifetimeAnalytics {
  studiesCount: number;
  totalRawResponses: number;
  totalCleanResponses: number;
  totalPipelinesRun: number;
  totalHypothesesEvaluated: number;
  totalSignificantFindings: number;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  details: string;
  entityId?: string | null;
  entityType?: string | null;
  createdAt: string;
}

export interface UserProfileResponse {
  profile: User;
  settings: MethodologicalSettings;
  analytics: LifetimeAnalytics;
  recentActivity: ActivityLogItem[];
}

export interface PowerBiEmbedConfig {
  reportId: string;
  reportName: string;
  embedUrl: string;
  embedToken: string;
  isDemoMode: boolean;
  expiresInMinutes: number;
  workspaceId?: string;
  datasetSummary?: {
    modelType: string;
    refreshTimestamp: string;
    metricsCount: number;
  };
}

export const api = {
  // Auth
  auth: {
    register: async (params: { email: string; password: string; name?: string }): Promise<{ user: User; message: string }> => {
      const res = await axios.post(`${API_BASE}/auth/register`, params);
      return res.data;
    },
    login: async (params: { email: string; password: string }): Promise<{ user: User; message: string }> => {
      const res = await axios.post(`${API_BASE}/auth/login`, params);
      return res.data;
    },
    logout: async (): Promise<{ message: string }> => {
      const res = await axios.post(`${API_BASE}/auth/logout`);
      return res.data;
    },
    getMe: async (): Promise<{ user: User }> => {
      const res = await axios.get(`${API_BASE}/auth/me`);
      return res.data;
    }
  },

  // User Profile & Settings
  user: {
    getProfile: async (): Promise<UserProfileResponse> => {
      const res = await axios.get(`${API_BASE}/user/profile`);
      return res.data;
    },
    updateProfile: async (params: Partial<User>): Promise<{ message: string; profile: User }> => {
      const res = await axios.put(`${API_BASE}/user/profile`, params);
      return res.data;
    },
    updateSettings: async (settings: Partial<MethodologicalSettings>): Promise<{ message: string; settings: MethodologicalSettings }> => {
      const res = await axios.put(`${API_BASE}/user/settings`, settings);
      return res.data;
    },
    changePassword: async (params: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
      const res = await axios.put(`${API_BASE}/user/password`, params);
      return res.data;
    },
    getActivity: async (limit: number = 30): Promise<ActivityLogItem[]> => {
      const res = await axios.get(`${API_BASE}/user/activity?limit=${limit}`);
      return res.data;
    },
    downloadPortfolioExport: async (): Promise<void> => {
      const res = await axios.get(`${API_BASE}/user/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `searchsea_research_portfolio_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  },

  // Health
  checkHealth: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  // Templates
  getTemplates: async (): Promise<SurveyTemplate[]> => {
    const res = await axios.get(`${API_BASE}/surveys/templates`);
    return res.data;
  },

  // Generate Survey with AI
  generateSurvey: async (params: {
    objective: string;
    templateId?: string;
    targetAudience?: string;
  }): Promise<{
    title: string;
    description: string;
    archetype: string;
    questions: Question[];
    refinementSource: string;
  }> => {
    const res = await axios.post(`${API_BASE}/surveys/generate`, params);
    return res.data;
  },

  // Surveys CRUD
  getSurveys: async (): Promise<Survey[]> => {
    const res = await axios.get(`${API_BASE}/surveys`);
    return res.data;
  },

  getSurvey: async (id: string): Promise<Survey> => {
    const res = await axios.get(`${API_BASE}/surveys/${id}`);
    return res.data;
  },

  createSurvey: async (data: {
    title: string;
    description?: string;
    objective?: string;
    archetype?: string;
    questions: Question[];
  }): Promise<Survey> => {
    const res = await axios.post(`${API_BASE}/surveys`, data);
    return res.data;
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/surveys/${id}`);
  },

  // Integrations & Data Ingestion
  generateSyntheticData: async (
    surveyId: string,
    count: number,
    injectAnomalies: boolean = true
  ): Promise<{ message: string; totalAdded: number }> => {
    const res = await axios.post(`${API_BASE}/integrations/synthetic/${surveyId}`, {
      count,
      injectAnomalies,
    });
    return res.data;
  },

  syncGoogleForms: async (
    surveyId: string,
    sheetUrl?: string,
    sampleResponsesCount: number = 50
  ): Promise<{ message: string; syncedCount: number }> => {
    const res = await axios.post(`${API_BASE}/integrations/google-forms/sync/${surveyId}`, {
      sheetUrl,
      sampleResponsesCount,
    });
    return res.data;
  },

  syncQualtrics: async (
    surveyId: string,
    qualtricsSurveyId?: string
  ): Promise<{ message: string; syncedCount: number }> => {
    const res = await axios.post(`${API_BASE}/integrations/qualtrics/sync/${surveyId}`, {
      qualtricsSurveyId,
    });
    return res.data;
  },

  // Analysis Pipeline
  runAnalysis: async (surveyId: string, runName?: string): Promise<AnalysisRunFull> => {
    const res = await axios.post(`${API_BASE}/analysis/run/${surveyId}`, { runName });
    return res.data;
  },

  getAnalysisRuns: async (surveyId: string): Promise<any[]> => {
    const res = await axios.get(`${API_BASE}/analysis/runs/${surveyId}`);
    return res.data;
  },

  getAnalysisRunDetail: async (runId: string): Promise<AnalysisRunFull> => {
    const res = await axios.get(`${API_BASE}/analysis/run-detail/${runId}`);
    return res.data;
  },

  runCustomHypothesis: async (
    surveyId: string,
    params: {
      independentVar: string;
      dependentVar: string;
      testType?: string;
      significanceLevel?: number;
    }
  ): Promise<HypothesisTestResult> => {
    const res = await axios.post(`${API_BASE}/analysis/custom-hypothesis/${surveyId}`, params);
    return res.data;
  },

  // Power BI Reports
  reports: {
    getEmbedToken: async (reportId: string = 'default'): Promise<PowerBiEmbedConfig> => {
      const res = await axios.get(`${API_BASE}/reports/${reportId}/embed-token`);
      return res.data;
    },
    getAvailable: async (): Promise<Array<{ id: string; title: string; description: string; pagesCount: number; isDefault: boolean }>> => {
      const res = await axios.get(`${API_BASE}/reports/available`);
      return res.data;
    }
  }
};
