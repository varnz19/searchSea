import React from 'react';
import { Database, Trash2, Layers, BarChart3, Plus } from 'lucide-react';
import { Survey } from '../types';

interface SurveyListProps {
  surveys: Survey[];
  onSelectSurvey: (survey: Survey) => void;
  onOpenIngest: (survey: Survey) => void;
  onRunAnalysis: (survey: Survey) => void;
  onDeleteSurvey: (id: string) => void;
  onNewSurvey: () => void;
}

export const SurveyList: React.FC<SurveyListProps> = ({
  surveys,
  onSelectSurvey,
  onOpenIngest,
  onRunAnalysis,
  onDeleteSurvey,
  onNewSurvey,
}) => {
  const renderStatus = (status: Survey['status']) => {
    switch (status) {
      case 'ANALYZED':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-accent-significant">
            <span className="w-2 h-2 rounded-full bg-accent-significant shrink-0"></span>
            <span>Analyzed</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-accent-flagged">
            <span className="w-2 h-2 rounded-full bg-accent-flagged shrink-0"></span>
            <span>Collecting</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-ink-muted shrink-0"></span>
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
            Research Studies
          </h1>
          <p className="text-sm text-ink-muted mt-1 max-w-2xl font-sans">
            Registered quantitative questionnaires, response collection pipelines, and statistical analysis datasets.
          </p>
        </div>

        <button
          onClick={onNewSurvey}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Study</span>
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="p-12 text-left bg-bg-surface border border-hairline space-y-3">
          <div className="font-mono text-xs text-ink-muted uppercase tracking-wider">
            Empty Dataset Registry
          </div>
          <h2 className="text-base font-serif font-semibold text-ink">
            No Empirical Studies Registered
          </h2>
          <p className="text-xs text-ink-muted max-w-md font-sans">
            Synthesize a new quantitative instrument from a plain-text research objective or import baseline benchmark templates.
          </p>
          <div className="pt-2">
            <button
              onClick={onNewSurvey}
              className="px-3.5 py-1.5 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 transition-opacity"
            >
              Synthesize Questionnaire
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((s) => {
            const respCount = s._count?.responses || s.totalResponsesCount || 0;
            const qCount = s._count?.questions || s.questions?.length || 0;

            return (
              <div
                key={s.id}
                className="bg-bg-base border border-hairline p-4 flex flex-col justify-between space-y-4 hover:border-ink transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {renderStatus(s.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete study "${s.title}"?`)) {
                          onDeleteSurvey(s.id);
                        }
                      }}
                      className="p-1 text-ink-muted hover:text-accent-flagged transition-colors"
                      title="Delete study"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h2
                      onClick={() => onSelectSurvey(s)}
                      className="font-serif font-semibold text-base text-ink hover:text-accent-action cursor-pointer line-clamp-1 transition-colors"
                    >
                      {s.title}
                    </h2>
                    <p className="text-xs text-ink-muted mt-1 line-clamp-2 font-sans">
                      {s.objective || s.description || 'Quantitative empirical research study.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-ink-muted uppercase block">Responses</span>
                      <span className="font-semibold text-ink tabular-nums">{respCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted uppercase block">Questions</span>
                      <span className="font-semibold text-ink tabular-nums">{qCount}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline">
                  <button
                    onClick={() => onOpenIngest(s)}
                    className="inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 border border-hairline text-ink-muted hover:text-ink hover:border-ink text-xs font-sans font-medium transition-colors"
                  >
                    <Database className="w-3 h-3" />
                    <span>Ingest Data</span>
                  </button>

                  <button
                    onClick={() => {
                      if (respCount === 0) {
                        onOpenIngest(s);
                      } else {
                        onRunAnalysis(s);
                      }
                    }}
                    className="inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 transition-opacity"
                  >
                    {respCount === 0 ? (
                      <span>Add Responses</span>
                    ) : (
                      <>
                        <BarChart3 className="w-3 h-3" />
                        <span>Open Study</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SurveyList;
