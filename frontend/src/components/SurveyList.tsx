import React from 'react';
import { Database, Trash2, Layers, BarChart3, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
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
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Analyzed</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
            <span>Collecting</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Research Studies Registry</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">
            Registered Empirical Protocols
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl font-sans leading-relaxed">
            Manage quantitative questionnaires, response collection pipelines, cleaned datasets, and statistical models.
          </p>
        </div>

        <button
          onClick={onNewSurvey}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-sans font-semibold rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Protocol</span>
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div className="font-mono text-xs text-slate-600 uppercase tracking-wider font-semibold">
            Empty Dataset Registry
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">
            No Empirical Studies Registered
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto font-sans leading-relaxed">
            Synthesize a new quantitative instrument from a plain-text research objective or import baseline benchmark templates.
          </p>
          <div className="pt-2">
            <button
              onClick={onNewSurvey}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-sans font-semibold rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
              Synthesize Questionnaire with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((s) => {
            const respCount = s._count?.responses || s.totalResponsesCount || 0;
            const qCount = s._count?.questions || s.questions?.length || 0;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-200 group"
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
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete study"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h2
                      onClick={() => onSelectSurvey(s)}
                      className="font-serif font-bold text-lg text-slate-900 group-hover:text-indigo-600 cursor-pointer line-clamp-1 transition-colors"
                    >
                      {s.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-sans leading-relaxed">
                      {s.objective || s.description || 'Quantitative empirical research study.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-600 uppercase block font-semibold">Responses</span>
                      <span className="font-bold text-slate-900 tabular-nums text-sm">{respCount.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-600 uppercase block font-semibold">Questions</span>
                      <span className="font-bold text-slate-900 tabular-nums text-sm">{qCount}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenIngest(s)}
                    className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 text-xs font-sans font-semibold transition-all"
                  >
                    <Database className="w-3.5 h-3.5" />
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
                    className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-semibold shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all"
                  >
                    {respCount === 0 ? (
                      <span>Add Responses</span>
                    ) : (
                      <>
                        <BarChart3 className="w-3.5 h-3.5" />
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
