import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface EmbedConfig {
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

export const powerBiService = {
  /**
   * Retrieves an Entra ID (Azure AD) OAuth2 token using client credentials flow
   */
  async getEntraToken(): Promise<string | null> {
    const tenantId = process.env.POWERBI_TENANT_ID;
    const clientId = process.env.POWERBI_CLIENT_ID;
    const clientSecret = process.env.POWERBI_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      return null;
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('scope', 'https://analysis.windows.net/powerbi/api/.default');

      const response = await axios.post(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return response.data.access_token;
    } catch (error: any) {
      console.warn('Entra ID authentication failed, falling back to demo embedding mode:', error.message);
      return null;
    }
  },

  /**
   * Generates short-lived report embed token via Power BI REST API
   * or falls back to structured interactive demo configuration
   */
  async getReportEmbedConfig(reportId: string = 'default'): Promise<EmbedConfig> {
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    const entraToken = await this.getEntraToken();

    // If Azure credentials are fully configured, generate genuine Power BI REST tokens
    if (entraToken && workspaceId && reportId !== 'demo-report') {
      try {
        const headers = { Authorization: `Bearer ${entraToken}` };

        // 1. Get report details
        const reportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
        const reportRes = await axios.get(reportUrl, { headers });
        const { name, embedUrl, datasetId } = reportRes.data;

        // 2. Generate embed token (App-owns-data pattern)
        const tokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
        const tokenRes = await axios.post(tokenUrl, { accessLevel: 'View', datasetId }, { headers });

        return {
          reportId,
          reportName: name || 'Executive Quantitative Research Report',
          embedUrl,
          embedToken: tokenRes.data.token,
          isDemoMode: false,
          expiresInMinutes: 60,
          workspaceId
        };
      } catch (error: any) {
        console.warn(`Power BI REST API call failed (${error.message}). Activating portfolio demo simulator.`);
      }
    }

    // High-Fidelity Portfolio / Interview Demo Mode Fallback
    return {
      reportId: reportId === 'default' ? 'rep_searchsea_exec_01' : reportId,
      reportName: 'Executive Quantitative Findings & Empirical Distributions',
      embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=rep_searchsea_exec_01',
      embedToken: 'pbi_embed_token_simulated_searchsea_verified',
      isDemoMode: true,
      expiresInMinutes: 60,
      workspaceId: workspaceId || 'ws_searchsea_shared',
      datasetSummary: {
        modelType: 'Star Schema (Responses x Question Dimensions)',
        refreshTimestamp: new Date().toISOString(),
        metricsCount: 14
      }
    };
  }
};
