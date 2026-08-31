import axios from 'axios';
import { PreprocessResponse, HypothesisResult, ClusterResult, ThemeResult } from '../types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export class MLServiceClient {
  private client = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.client.get('/');
      return res.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  async preprocessDataset(params: {
    responses: Record<string, any>[];
    questionMetadata: Record<string, any>;
    speederThresholdSeconds?: number;
    straightlineStdThreshold?: number;
    missingStrategy?: string;
  }): Promise<PreprocessResponse> {
    const res = await this.client.post<PreprocessResponse>('/api/preprocess', {
      responses: params.responses,
      question_metadata: params.questionMetadata,
      speeder_threshold_seconds: params.speederThresholdSeconds || 30.0,
      straightline_std_threshold: params.straightlineStdThreshold || 0.35,
      missing_strategy: params.missingStrategy || 'impute_median',
    });
    return res.data;
  }

  async runHypothesisTest(params: {
    data: Record<string, any>[];
    independentVar: string;
    dependentVar: string;
    testType?: string;
    significanceLevel?: number;
    totalTestsInBatch?: number;
  }): Promise<HypothesisResult> {
    const res = await this.client.post<HypothesisResult>('/api/stats/hypothesize', {
      data: params.data,
      independent_var: params.independentVar,
      dependent_var: params.dependentVar,
      test_type: params.testType || 'auto',
      significance_level: params.significanceLevel || 0.05,
      total_tests_in_batch: params.totalTestsInBatch || 1,
    });
    return res.data;
  }

  async clusterRespondents(params: {
    data: Record<string, any>[];
    featureKeys: string[];
    nClusters?: number;
    method?: string;
  }): Promise<ClusterResult> {
    const res = await this.client.post<ClusterResult>('/api/cluster', {
      data: params.data,
      feature_keys: params.featureKeys,
      n_clusters: params.nClusters,
      method: params.method || 'kmeans',
    });
    return res.data;
  }

  async extractThemes(params: {
    texts: string[];
    nThemes?: number;
  }): Promise<ThemeResult> {
    const res = await this.client.post<ThemeResult>('/api/nlp/themes', {
      texts: params.texts,
      n_themes: params.nThemes || 4,
    });
    return res.data;
  }

  async generateSyntheticData(params: {
    nResponses: number;
    questions: Array<Record<string, any>>;
    injectAnomalies?: boolean;
  }): Promise<{ count: number; responses: Record<string, any>[] }> {
    const res = await this.client.post('/api/generate-synthetic-data', {
      n_responses: params.nResponses,
      questions: params.questions,
      inject_anomalies: params.injectAnomalies !== false,
    });
    return res.data;
  }
}

export const mlClient = new MLServiceClient();
