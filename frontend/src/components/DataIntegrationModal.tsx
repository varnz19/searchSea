import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Survey } from '../types';

interface DataIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey;
  onDataIngested: () => void;
}

export const DataIntegrationModal: React.FC<DataIntegrationModalProps> = ({
  isOpen,
  onClose,
  survey,
  onDataIngested,
}) => {
  const [activeSource, setActiveSource] = useState<'synthetic' | 'google_forms' | 'qualtrics'>('synthetic');
  const [syntheticCount, setSyntheticCount] = useState<number>(300);
  const [injectAnomalies, setInjectAnomalies] = useState<boolean>(true);
  const [sheetUrl, setSheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [qualtricsId, setQualtricsId] = useState<string>('SV_3rD9vXN1qW5Y7zL');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleIngestSynthetic = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await api.generateSyntheticData(survey.id, syntheticCount, injectAnomalies);
      setSuccessMessage(res.message);
      onDataIngested();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Data generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGoogleForms = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await api.syncGoogleForms(survey.id, sheetUrl, 75);
      setSuccessMessage(res.message);
      onDataIngested();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Google Forms sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncQualtrics = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await api.syncQualtrics(survey.id, qualtricsId);
      setSuccessMessage(res.message);
      onDataIngested();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Qualtrics sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-bg-base border border-hairline my-6 text-ink shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg-surface">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Data Pipeline Ingestion
            </div>
            <h2 className="text-base font-serif font-semibold text-ink">
              {survey.title}
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

        {/* Source Navigation */}
        <div className="flex border-b border-hairline bg-bg-base text-xs font-mono">
          <button
            onClick={() => setActiveSource('synthetic')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeSource === 'synthetic'
                ? 'border-accent-action text-ink font-semibold bg-bg-surface'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Synthetic Dataset ($N$)
          </button>
          <button
            onClick={() => setActiveSource('google_forms')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeSource === 'google_forms'
                ? 'border-accent-action text-ink font-semibold bg-bg-surface'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Google Forms / Sheets
          </button>
          <button
            onClick={() => setActiveSource('qualtrics')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeSource === 'qualtrics'
                ? 'border-accent-action text-ink font-semibold bg-bg-surface'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Qualtrics Connector
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-bg-surface border border-accent-significant text-accent-significant text-xs font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-accent-significant shrink-0"></span>
              <span>{successMessage}</span>
            </div>
          )}

          {activeSource === 'synthetic' && (
            <div className="space-y-6">
              {/* Large Mono Numeral Display */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-2">
                  Ingestion Sample Target ($N$)
                </label>
                <div className="flex items-baseline space-x-3 p-4 bg-bg-surface border border-hairline">
                  <div className="font-mono text-4xl font-semibold text-ink tabular-nums tracking-tight">
                    {syntheticCount.toLocaleString()}
                  </div>
                  <span className="text-xs font-mono text-ink-muted uppercase">
                    Records to Generate
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[100, 300, 1000, 5000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSyntheticCount(n)}
                      className={`py-1.5 px-2 border text-xs font-mono tabular-nums transition-colors ${
                        syntheticCount === n
                          ? 'border-accent-action bg-accent-action text-white font-semibold'
                          : 'border-hairline bg-bg-base text-ink-muted hover:border-ink hover:text-ink'
                      }`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anomaly Checkbox Panel */}
              <div className="p-3.5 bg-bg-surface border border-hairline space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={injectAnomalies}
                    onChange={(e) => setInjectAnomalies(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-none border-hairline text-accent-action focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block font-sans">
                      Inject Data Cleaning Anomalies (Speeders & Straight-Liners)
                    </span>
                    <span className="text-[11px] text-ink-muted font-sans leading-relaxed block mt-0.5">
                      Simulates low-duration submissions (&lt;15s) and invariant Likert matrix responses (&sigma; &le; 0.35) for verification in the provenance audit trail.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeSource === 'google_forms' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-ink-muted pb-2 border-b border-hairline">
                <span className="w-2 h-2 rounded-full bg-accent-significant"></span>
                <span>Endpoint Ready: Google Sheets API v4 Connector</span>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1.5">
                  Linked Google Sheet Responses URL
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-mono text-ink outline-none"
                />
              </div>
              <p className="text-xs text-ink-muted font-sans leading-relaxed">
                Pulls row-level Google Forms responses, maps column headers to registered survey questions, and validates response schema.
              </p>
            </div>
          )}

          {activeSource === 'qualtrics' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-ink-muted pb-2 border-b border-hairline">
                <span className="w-2 h-2 rounded-full bg-accent-significant"></span>
                <span>Endpoint Ready: Qualtrics v3 REST API</span>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1.5">
                  Qualtrics Survey Identifier (SV_*)
                </label>
                <input
                  type="text"
                  value={qualtricsId}
                  onChange={(e) => setQualtricsId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-mono text-ink outline-none"
                />
              </div>
              <p className="text-xs text-ink-muted font-sans leading-relaxed">
                Executes asynchronous export job (`/surveys/{'{id}'}/export-responses`), polls job progress, and extracts normalized survey responses.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-hairline bg-bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-hairline text-xs font-sans font-medium text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            Cancel
          </button>

          {activeSource === 'synthetic' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleIngestSynthetic}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Synthesizing Records...' : `Ingest ${syntheticCount.toLocaleString()} Records`}</span>
            </button>
          )}

          {activeSource === 'google_forms' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleSyncGoogleForms}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Syncing...' : 'Execute Sync'}</span>
            </button>
          )}

          {activeSource === 'qualtrics' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleSyncQualtrics}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Polling Qualtrics Job...' : 'Execute Qualtrics Export'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataIntegrationModal;
