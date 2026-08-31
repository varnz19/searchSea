import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';
import { api } from '../api';
import { Question, SurveyTemplate } from '../types';

interface SurveyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveyCreated: (survey: any) => void;
}

export const SurveyGeneratorModal: React.FC<SurveyGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSurveyCreated,
}) => {
  const [step, setStep] = useState<'prompt' | 'edit'>('prompt');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('Senior engineers, product researchers, and data practitioners');
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('pmf_validation');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generated survey state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState('product_market_fit');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [refinementSource, setRefinementSource] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      api.getTemplates().then((tpls) => {
        setTemplates(tpls);
        if (tpls.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(tpls[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!objective.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateSurvey({
        objective,
        templateId: selectedTemplateId,
        targetAudience,
      });

      setTitle(res.title);
      setDescription(res.description);
      setArchetype(res.archetype);
      setQuestions(res.questions);
      setRefinementSource(res.refinementSource);
      setStep('edit');
    } catch (err: any) {
      alert(`Survey generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSurvey = async () => {
    if (!title.trim() || questions.length === 0) return;
    setLoading(true);
    try {
      const created = await api.createSurvey({
        title,
        description,
        objective,
        archetype,
        questions,
      });
      onSurveyCreated(created);
      onClose();
    } catch (err: any) {
      alert(`Failed to save survey: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      code: `q_${questions.length + 1}`,
      title: 'New Question Item',
      type: 'likert',
      scaleMin: 1,
      scaleMax: 5,
      required: true,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const formatQuestionType = (type: string) => {
    switch (type) {
      case 'likert': return 'LIKERT-5';
      case 'multiple_choice': return 'MULTIPLE-CHOICE';
      case 'numeric': return 'NUMERIC';
      case 'open_ended': return 'OPEN-TEXT';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-bg-base border border-hairline my-6 text-ink shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg-surface">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              {step === 'prompt' ? 'Protocol Synthesis' : 'Document Review'}
            </div>
            <h2 className="text-base font-serif font-semibold text-ink">
              {step === 'prompt' ? 'Synthesize Research Instrument' : 'Review & Refine Questionnaire'}
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {step === 'prompt' ? (
            <div className="space-y-6">
              {/* Hero Objective Prompt Field */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted mb-2">
                  Stated Research Objective
                </label>
                <textarea
                  rows={4}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Evaluate whether senior engineers experience significantly lower cognitive load and higher trust when using automated statistical testing tools compared to junior engineers."
                  className="w-full px-4 py-3 bg-bg-base border border-hairline focus:border-accent-action text-base font-serif text-ink placeholder:text-ink-muted/50 leading-relaxed transition-colors outline-none resize-y"
                />
              </div>

              {/* Research Presets */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
                  Empirical Study Presets
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setObjective('Evaluate developer adoption and cognitive effort when utilizing AI-driven statistical testing and research automation.');
                      setSelectedTemplateId('pmf_validation');
                    }}
                    className="block w-full text-left text-xs p-2 bg-bg-surface border border-hairline hover:border-ink text-ink font-sans transition-colors"
                  >
                    <span className="font-medium">1. Developer Cognitive Load & AI Tool Adoption:</span>{' '}
                    <span className="text-ink-muted">Evaluates productivity, trust, and mental workload reduction.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setObjective('Measure enterprise customer satisfaction (CSAT), net promoter score (NPS), and support effort score across subscription tiers.');
                      setSelectedTemplateId('csat_ces_nps');
                    }}
                    className="block w-full text-left text-xs p-2 bg-bg-surface border border-hairline hover:border-ink text-ink font-sans transition-colors"
                  >
                    <span className="font-medium">2. Enterprise CSAT & NPS Benchmark:</span>{' '}
                    <span className="text-ink-muted">Measures tier-based satisfaction, effort scores, and retention.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setObjective('Analyze behavioral differences in transparency trust and automation bias among novice vs expert researchers.');
                      setSelectedTemplateId('academic_behavioral');
                    }}
                    className="block w-full text-left text-xs p-2 bg-bg-surface border border-hairline hover:border-ink text-ink font-sans transition-colors"
                  >
                    <span className="font-medium">3. Behavioral Automation Bias & Trust Study:</span>{' '}
                    <span className="text-ink-muted">Assesses domain expertise interaction with algorithmic trust.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setObjective('Assess organizational employee engagement, psychological safety, manager trust, and cross-functional collaboration.');
                      setSelectedTemplateId('employee_engagement');
                    }}
                    className="block w-full text-left text-xs p-2 bg-bg-surface border border-hairline hover:border-ink text-ink font-sans transition-colors"
                  >
                    <span className="font-medium">4. Organizational Engagement & Psychological Safety:</span>{' '}
                    <span className="text-ink-muted">Surveys manager trust, voice, and advancement opportunities.</span>
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
                  Archetype Baseline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3 border cursor-pointer transition-colors ${
                        selectedTemplateId === tpl.id
                          ? 'border-accent-action bg-bg-surface'
                          : 'border-hairline bg-bg-base hover:border-ink-muted'
                      }`}
                    >
                      <div className="font-serif font-semibold text-xs text-ink mb-1">{tpl.title}</div>
                      <p className="text-[11px] text-ink-muted line-clamp-2 font-sans">{tpl.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                  Target Sample Cohort
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs text-ink font-sans outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Refinement Status Banner */}
              <div className="p-3 bg-bg-surface border border-hairline text-xs font-mono flex items-center justify-between text-ink">
                <div>
                  <span className="text-ink-muted">Synthesized via: </span>
                  <span className="font-semibold text-ink">
                    {refinementSource === 'claude_api' ? 'Claude API (JSON Constrained)' : 'Deterministic Synthesizer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  className="text-xs text-accent-action hover:underline font-sans"
                >
                  Edit Objective
                </button>
              </div>

              {/* Study Metadata */}
              <div className="space-y-3 pb-4 border-b border-hairline">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                    Study Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-base font-serif font-semibold text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                    Respondent Instructions
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
                  />
                </div>
              </div>

              {/* Annotated Document Question List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-hairline">
                  <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                    Instrument Items ({questions.length})
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center space-x-1 text-xs font-mono text-accent-action hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Append Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-bg-surface border border-hairline space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-baseline space-x-2 flex-1">
                          <span className="font-mono font-semibold text-ink-muted tabular-nums shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider bg-bg-base px-1.5 py-0.5 border border-hairline shrink-0">
                            {formatQuestionType(q.type)}
                          </span>
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) => handleUpdateQuestion(idx, 'title', e.target.value)}
                            className="flex-1 bg-transparent border-b border-transparent focus:border-accent-action text-xs text-ink font-sans outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-1 text-ink-muted hover:text-accent-flagged transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pl-6 text-[11px] text-ink-muted">
                        <div>
                          <span className="font-mono uppercase text-[10px] mr-1.5">Code:</span>
                          <input
                            type="text"
                            value={q.code}
                            onChange={(e) => handleUpdateQuestion(idx, 'code', e.target.value)}
                            className="px-1.5 py-0.5 bg-bg-base border border-hairline font-mono text-[10px] text-ink w-24 outline-none"
                          />
                        </div>

                        <div>
                          <span className="font-mono uppercase text-[10px] mr-1.5">Type:</span>
                          <select
                            value={q.type}
                            onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                            className="px-1.5 py-0.5 bg-bg-base border border-hairline text-[11px] font-sans text-ink outline-none"
                          >
                            <option value="likert">Likert Scale (1-5)</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="numeric">Numeric / Continuous</option>
                            <option value="open_ended">Open-Ended Text</option>
                          </select>
                        </div>

                        {q.type === 'multiple_choice' && q.options && (
                          <div className="flex-1 font-mono text-[10px] text-ink-muted truncate">
                            Options: {q.options.join(', ')}
                          </div>
                        )}

                        {q.type === 'likert' && (
                          <div className="font-mono text-[10px] text-ink-muted">
                            Scale: {q.scaleMin || 1} to {q.scaleMax || 5}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-hairline bg-bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-hairline text-xs font-sans font-medium text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            Cancel
          </button>

          {step === 'prompt' ? (
            <button
              type="button"
              disabled={generating || !objective.trim()}
              onClick={handleGenerate}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
            >
              <span>{generating ? 'Synthesizing Protocol...' : 'Synthesize Questionnaire'}</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="px-3.5 py-1.5 border border-hairline text-xs font-sans font-medium text-ink-muted hover:text-ink hover:border-ink transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveSurvey}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
              >
                <span>{loading ? 'Registering Study...' : 'Register Study Protocol'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyGeneratorModal;
