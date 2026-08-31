import React, { useState, useEffect } from 'react';
import { X, User, Settings, History, Shield, Download, RefreshCw, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { api, UserProfileResponse, MethodologicalSettings } from '../api';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user: authUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'history' | 'security'>('profile');
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [institution, setInstitution] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [bio, setBio] = useState('');

  // Settings form state
  const [settings, setSettings] = useState<MethodologicalSettings>({
    defaultAlpha: 0.05,
    defaultCorrectionMethod: 'bonferroni',
    speederDurationCutoffSeconds: 15,
    straightlineStdThreshold: 0.35,
    entropyCutoffThreshold: 2.5,
    reportingNotationStyle: 'apa_7th',
    autoRunPipelineOnIngest: true,
  });

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const loadProfileData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.user.getProfile();
      setData(res);
      setName(res.profile.name || '');
      setUsername(res.profile.username || '');
      setInstitution(res.profile.institution || '');
      setDiscipline(res.profile.discipline || '');
      setOrcidId(res.profile.orcidId || '');
      setBio(res.profile.bio || '');
      setSettings(res.settings);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load investigator profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.user.updateProfile({
        name,
        username,
        institution,
        discipline,
        orcidId,
        bio,
      });
      setSuccessMsg(res.message);
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.user.updateSettings(settings);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save methodological settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New password confirmation does not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.user.changePassword({ currentPassword, newPassword });
      setSuccessMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update account password.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPortfolio = async () => {
    try {
      await api.user.downloadPortfolioExport();
      setSuccessMsg('Portfolio JSON backup downloaded successfully.');
    } catch (err: any) {
      setErrorMsg('Failed to download portfolio backup.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-bg-base border border-hairline my-6 text-ink shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-bg-surface">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Investigator Settings & Governance
            </div>
            <h2 className="text-base font-serif font-semibold text-ink">
              Profile, Methodological Defaults & Research History
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

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-bg-base px-6 space-x-6 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => { setActiveTab('profile'); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            1. Investigator Identity
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            2. Methodological Defaults
          </button>
          <button
            onClick={() => { setActiveTab('history'); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            3. Research Activity & History
          </button>
          <button
            onClick={() => { setActiveTab('security'); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'security'
                ? 'border-accent-action text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            4. Security & Export
          </button>
        </div>

        {/* Notification Status Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-bg-surface border border-accent-significant text-accent-significant text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-bg-surface border-l-2 border-accent-flagged text-xs text-ink">
            <span className="font-semibold text-accent-flagged font-mono uppercase text-[11px] block">Error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto text-xs leading-relaxed text-ink space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-2 font-mono text-xs text-ink-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent-action" />
              <p>Loading investigator record...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: INVESTIGATOR IDENTITY */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Full Name / Title
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Eleanor Vance"
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Username (Identifier)
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e_vance"
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-mono text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Academic / Institutional Affiliation
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="University of Oxford, Dept. of Computer Science"
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Primary Research Discipline
                      </label>
                      <input
                        type="text"
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                        placeholder="Human-Computer Interaction, Quantitative Psychology"
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        ORCID Identifier
                      </label>
                      <input
                        type="text"
                        value={orcidId}
                        onChange={(e) => setOrcidId(e.target.value)}
                        placeholder="0000-0002-1825-0097"
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-mono text-ink outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Research Focus & Bio
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Focuses on cognitive load reduction, empirical trust modeling in autonomous algorithmic systems, and large-scale behavioral survey methodologies."
                        className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none resize-y"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
                    >
                      {saving ? 'Saving Profile...' : 'Save Investigator Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: METHODOLOGICAL DEFAULTS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
                  <div className="space-y-1">
                    <h3 className="font-serif font-semibold text-sm text-ink">
                      Statistical Decision & Inference Defaults
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Configure default hypotheses criteria, significance limits, and multiple testing adjustments applied automatically during pipeline execution.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Default Significance Level (&alpha;)
                      </label>
                      <select
                        value={settings.defaultAlpha}
                        onChange={(e) => setSettings({ ...settings, defaultAlpha: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-base border border-hairline text-xs font-mono text-ink outline-none"
                      >
                        <option value="0.05">&alpha; = 0.05 (Standard 95% Confidence)</option>
                        <option value="0.01">&alpha; = 0.01 (Strict 99% Confidence)</option>
                        <option value="0.001">&alpha; = 0.001 (High-Rigor 99.9% Confidence)</option>
                        <option value="0.10">&alpha; = 0.10 (Exploratory 90% Confidence)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Multiple Testing Correction Method
                      </label>
                      <select
                        value={settings.defaultCorrectionMethod}
                        onChange={(e) => setSettings({ ...settings, defaultCorrectionMethod: e.target.value as any })}
                        className="w-full px-3 py-2 bg-bg-base border border-hairline text-xs font-mono text-ink outline-none"
                      >
                        <option value="bonferroni">Bonferroni (FWER &alpha; / k Control)</option>
                        <option value="benjamini_hochberg">Benjamini-Hochberg (FDR q-Value Control)</option>
                        <option value="none">Unadjusted (Raw p-Values Only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Speeder Duration Cutoff (Seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.speederDurationCutoffSeconds}
                        onChange={(e) => setSettings({ ...settings, speederDurationCutoffSeconds: parseInt(e.target.value) || 15 })}
                        className="w-full px-3 py-2 bg-bg-base border border-hairline text-xs font-mono text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Straight-Lining Std Dev Threshold (&sigma;)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={settings.straightlineStdThreshold}
                        onChange={(e) => setSettings({ ...settings, straightlineStdThreshold: parseFloat(e.target.value) || 0.35 })}
                        className="w-full px-3 py-2 bg-bg-base border border-hairline text-xs font-mono text-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Reporting Notation Preference
                      </label>
                      <select
                        value={settings.reportingNotationStyle}
                        onChange={(e) => setSettings({ ...settings, reportingNotationStyle: e.target.value as any })}
                        className="w-full px-3 py-2 bg-bg-base border border-hairline text-xs font-mono text-ink outline-none"
                      >
                        <option value="apa_7th">APA 7th Edition Style (e.g., t(198) = 2.45, p = .015)</option>
                        <option value="clinical">Clinical Trial Standard (Exact CI, Effect Sizes)</option>
                        <option value="compact_latex">Compact LaTeX Math Notation</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoRunPipelineOnIngest}
                          onChange={(e) => setSettings({ ...settings, autoRunPipelineOnIngest: e.target.checked })}
                          className="w-4 h-4 rounded-none border-hairline text-accent-action focus:ring-0"
                        />
                        <span className="text-xs font-sans text-ink">
                          Auto-execute full pipeline upon data ingestion
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
                    >
                      {saving ? 'Saving Settings...' : 'Save Methodological Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: RESEARCH HISTORY & USAGE ANALYTICS */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Lifetime Statistics Counters */}
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
                      Lifetime Empirical Analytics
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-bg-surface border border-hairline">
                        <div className="font-mono text-xl font-semibold text-ink tabular-nums">
                          {data?.analytics.studiesCount || 0}
                        </div>
                        <div className="text-[10px] uppercase text-ink-muted mt-0.5">Studies Registered</div>
                      </div>

                      <div className="p-3 bg-bg-surface border border-hairline">
                        <div className="font-mono text-xl font-semibold text-accent-significant tabular-nums">
                          {data?.analytics.totalCleanResponses?.toLocaleString() || 0}
                        </div>
                        <div className="text-[10px] uppercase text-ink-muted mt-0.5">Clean Respondents</div>
                      </div>

                      <div className="p-3 bg-bg-surface border border-hairline">
                        <div className="font-mono text-xl font-semibold text-ink tabular-nums">
                          {data?.analytics.totalHypothesesEvaluated || 0}
                        </div>
                        <div className="text-[10px] uppercase text-ink-muted mt-0.5">Hypotheses Tested</div>
                      </div>

                      <div className="p-3 bg-bg-surface border border-hairline">
                        <div className="font-mono text-xl font-semibold text-accent-significant tabular-nums">
                          {data?.analytics.totalSignificantFindings || 0}
                        </div>
                        <div className="text-[10px] uppercase text-ink-muted mt-0.5">Verified Findings</div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Audit Timeline */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                      Historical Action Log & Provenance Audit
                    </div>
                    <div className="border border-hairline divide-y divide-hairline">
                      {data?.recentActivity && data.recentActivity.length > 0 ? (
                        data.recentActivity.map((act) => (
                          <div key={act.id} className="p-3 bg-bg-base flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-bg-surface border border-hairline text-ink-muted mr-2">
                                {act.action.replace(/_/g, ' ')}
                              </span>
                              <span className="font-sans text-ink">{act.details}</span>
                            </div>
                            <span className="font-mono text-[11px] text-ink-muted shrink-0">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-xs font-mono text-ink-muted">
                          No previous activity logs recorded in session history.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SECURITY & DATA PORTABILITY */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-2xl">
                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3 p-4 bg-bg-surface border border-hairline">
                    <div className="flex items-center space-x-2 pb-2 border-b border-hairline">
                      <Key className="w-4 h-4 text-ink-muted" />
                      <h3 className="font-serif font-semibold text-sm text-ink">Change Account Password</h3>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-bg-base border border-hairline text-xs font-sans text-ink outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                          New Password (min. 8 chars)
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-1.5 bg-bg-base border border-hairline text-xs font-sans text-ink outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full px-3 py-1.5 bg-bg-base border border-hairline text-xs font-sans text-ink outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-3.5 py-1.5 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>

                  {/* Portfolio Backup Export */}
                  <div className="p-4 bg-bg-surface border border-hairline space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b border-hairline">
                      <Download className="w-4 h-4 text-ink-muted" />
                      <h3 className="font-serif font-semibold text-sm text-ink">Research Portfolio Backup & Data Portability</h3>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Download a structured JSON archive containing all registered questionnaires, raw respondent answers, cleaned datasets, hypothesis test results, and provenance audit logs.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleExportPortfolio}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-hairline bg-bg-base text-ink text-xs font-sans font-medium hover:border-ink transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Full Portfolio Archive (.json)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-bg-surface flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-hairline text-xs font-sans font-medium text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
