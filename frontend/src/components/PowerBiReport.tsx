import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Filter, Layers, BarChart2 } from 'lucide-react';
import * as pbi from 'powerbi-client';
import { api, PowerBiEmbedConfig } from '../api';
import { Survey, AnalysisRunFull } from '../types';

interface PowerBiReportProps {
  survey: Survey;
  analysisData?: AnalysisRunFull | null;
}

export const PowerBiReport: React.FC<PowerBiReportProps> = ({ survey, analysisData }) => {
  const [embedConfig, setEmbedConfig] = useState<PowerBiEmbedConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string>('rep_searchsea_exec_01');
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string>('ALL');
  const [activeMetricFilter, setActiveMetricFilter] = useState<string>('ALL');
  
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const powerbiServiceRef = useRef<pbi.service.Service | null>(null);

  const fetchEmbedConfig = async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      const config = await api.reports.getEmbedToken(reportId);
      setEmbedConfig(config);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to retrieve Power BI embed token.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbedConfig(selectedReportId);
  }, [selectedReportId, survey.id]);

  useEffect(() => {
    if (!embedConfig || !reportContainerRef.current || embedConfig.isDemoMode) return;

    try {
      if (!powerbiServiceRef.current) {
        powerbiServiceRef.current = new pbi.service.Service(
          pbi.factories.hpmFactory,
          pbi.factories.wpmpFactory,
          pbi.factories.routerFactory
        );
      }

      const pbiConfig: pbi.IEmbedConfiguration = {
        type: 'report',
        tokenType: pbi.models.TokenType.Embed,
        accessToken: embedConfig.embedToken,
        embedUrl: embedConfig.embedUrl,
        id: embedConfig.reportId,
        settings: {
          panes: {
            filters: { expanded: false, visible: true },
            pageNavigation: { visible: true, position: pbi.models.PageNavigationPosition.Bottom }
          },
          background: pbi.models.BackgroundType.Transparent
        }
      };

      // Reset previous instance
      powerbiServiceRef.current.reset(reportContainerRef.current);
      // Embed report
      const report = powerbiServiceRef.current.embed(reportContainerRef.current, pbiConfig);

      report.on('error', (event: any) => {
        console.error('Power BI SDK error:', event.detail);
        if (event.detail?.message?.includes('TokenExpired')) {
          setError('Power BI session token has expired. Please refresh the embed.');
        }
      });
    } catch (sdkError: any) {
      console.warn('Power BI SDK embed initialization notice:', sdkError);
    }
  }, [embedConfig]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Report Slicer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            App-Owns-Data Embedded Canvas
          </div>
          <h2 className="text-base font-serif font-semibold text-ink">
            Executive Power BI Report View
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="px-2.5 py-1 bg-bg-base border border-hairline text-ink text-xs font-mono outline-none"
          >
            <option value="rep_searchsea_exec_01">Report 1: Executive Cross-Tabs & Stats</option>
            <option value="rep_searchsea_clusters_02">Report 2: Persona Attribution Model</option>
          </select>

          <button
            onClick={() => fetchEmbedConfig(selectedReportId)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 border border-hairline text-ink-muted hover:text-ink hover:border-ink transition-colors"
            title="Refresh Token"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Token</span>
          </button>
        </div>
      </div>

      {/* Embed Token & Architecture Status Strip */}
      <div className="p-3 bg-bg-surface border border-hairline text-xs font-mono flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${embedConfig?.isDemoMode ? 'bg-accent-action' : 'bg-accent-significant'}`}></span>
            <span className="font-semibold text-ink">
              {embedConfig?.isDemoMode ? 'Interactive Sandbox Mode' : 'Live Entra ID / Power BI REST'}
            </span>
          </div>
          <span className="text-ink-muted">|</span>
          <span className="text-ink-muted truncate max-w-xs">
            Workspace: {embedConfig?.workspaceId || 'ws_searchsea_shared'}
          </span>
        </div>

        <div className="text-[11px] text-ink-muted flex items-center space-x-2">
          <span>TTL: <strong className="text-ink">{embedConfig?.expiresInMinutes || 60}m</strong></span>
          <span>&bull;</span>
          <span>Tokens scoped per App-Owns-Data pattern</span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-bg-surface border-l-2 border-accent-flagged text-xs text-ink space-y-1">
          <div className="font-semibold text-accent-flagged font-mono uppercase text-[11px] flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Power BI Service Notice</span>
          </div>
          <p className="text-ink-muted">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => fetchEmbedConfig(selectedReportId)}
              className="px-2.5 py-1 bg-bg-base border border-hairline font-mono text-[11px] hover:border-ink"
            >
              Retry Token Acquisition
            </button>
          </div>
        </div>
      )}

      {/* Embedded Container */}
      <div className="border border-hairline bg-bg-base overflow-hidden">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-2 text-xs font-mono text-ink-muted">
            <RefreshCw className="w-5 h-5 animate-spin text-accent-action" />
            <p>Negotiating Entra ID OAuth token and initializing report canvas...</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Live SDK Mount Target */}
            {!embedConfig?.isDemoMode && (
              <div
                ref={reportContainerRef}
                className="w-full h-[650px] bg-bg-base"
              />
            )}

            {/* High-Fidelity Power BI Interactive Canvas */}
            {embedConfig?.isDemoMode && (
              <div className="p-6 space-y-6 bg-bg-base">
                {/* Simulated Power BI Top Action Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-0.5 bg-accent-action text-white text-[10px] font-semibold">POWER BI</div>
                    <span className="font-serif text-sm font-semibold text-ink">{embedConfig.reportName}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-ink-muted">
                    <div className="flex items-center space-x-1">
                      <Filter className="w-3 h-3" />
                      <span>Cohort Slicer:</span>
                      <select
                        value={activeSegmentFilter}
                        onChange={(e) => setActiveSegmentFilter(e.target.value)}
                        className="px-1.5 py-0.5 bg-bg-surface border border-hairline font-mono text-[11px] text-ink outline-none"
                      >
                        <option value="ALL">All Respondent Segments</option>
                        {analysisData?.clustering?.clusters?.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Power BI Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Visual 1: Cross-Tabulation Matrix */}
                  <div className="md:col-span-2 border border-hairline p-4 space-y-3 bg-bg-surface">
                    <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                      <span className="font-serif font-semibold text-xs text-ink">
                        Multivariate Hypothesis Matrix (DAX Evaluated)
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted uppercase">Matrix Visual</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-hairline font-mono text-[10px] uppercase text-ink-muted bg-bg-base">
                            <th className="px-3 py-1.5">Independent Factor</th>
                            <th className="px-3 py-1.5">Dependent Metric</th>
                            <th className="px-3 py-1.5">Observed Statistic</th>
                            <th className="px-3 py-1.5">p-Value</th>
                            <th className="px-3 py-1.5">Bonferroni Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline font-mono text-xs">
                          {analysisData?.hypothesisTesting?.tests?.map((t, idx) => (
                            <tr key={idx} className="hover:bg-bg-base/70">
                              <td className="px-3 py-2 font-sans font-medium text-ink">{t.independent_var}</td>
                              <td className="px-3 py-2 font-sans text-ink">{t.dependent_var}</td>
                              <td className="px-3 py-2 tabular-nums text-ink">{t.statistic}</td>
                              <td className="px-3 py-2 tabular-nums font-semibold text-accent-significant">{t.p_value_formatted}</td>
                              <td className="px-3 py-2 text-[11px]">
                                {t.is_significant_bonferroni ? (
                                  <span className="text-accent-significant font-semibold">VALIDATED</span>
                                ) : (
                                  <span className="text-ink-muted">UNCORRECTED</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Visual 2: Data Model Slices */}
                  <div className="border border-hairline p-4 space-y-3 bg-bg-base">
                    <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                      <span className="font-serif font-semibold text-xs text-ink">
                        Segment Attribution (DAX)
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted uppercase">Donut Card</span>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      {analysisData?.clustering?.clusters?.map((cl, i) => (
                        <div key={cl.id} className="p-2 bg-bg-surface border border-hairline flex justify-between items-center">
                          <span className="font-sans font-medium text-ink truncate max-w-[130px]">{cl.name}</span>
                          <span className="font-mono font-semibold text-ink tabular-nums">{cl.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Report Page Bottom Tabs (Emulating Power BI Bottom Tabs) */}
                <div className="flex border-t border-hairline pt-3 justify-between items-center text-xs font-mono text-ink-muted">
                  <div className="flex space-x-2">
                    <span className="px-2.5 py-1 bg-bg-surface border border-hairline text-ink font-semibold">Page 1: Statistical Summary</span>
                    <span className="px-2.5 py-1 text-ink-muted hover:text-ink cursor-pointer">Page 2: Demographic Decomposition</span>
                    <span className="px-2.5 py-1 text-ink-muted hover:text-ink cursor-pointer">Page 3: NLP Theme Sentiment</span>
                  </div>
                  <div className="text-[10px]">
                    Dataset Refresh: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PowerBiReport;
