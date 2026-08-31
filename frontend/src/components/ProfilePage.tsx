import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Settings,
  History,
  Shield,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Building,
  GraduationCap,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { api, UserProfileResponse, MethodologicalSettings } from '../api';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { refreshUser } = useAuth();
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
    loadProfileData();
  }, []);

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

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 font-mono text-xs text-ink-muted">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent-action" />
        <p>Loading investigator profile and lifetime metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1 text-xs font-mono text-ink-muted hover:text-ink transition-colors mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>STUDIES REGISTRY</span>
          </button>
          <div className="flex items-baseline space-x-3">
            <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Investigator Profile & Governance
            </h1>
            {data?.profile.username && (
              <span className="font-mono text-xs text-ink-muted">
                @{data.profile.username}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted font-sans max-w-2xl">
            Manage investigator credentials, academic affiliations, automated methodological defaults, and audit history.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start lg:self-auto">
          <button
            onClick={handleExportPortfolio}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-hairline bg-bg-base text-ink text-xs font-sans font-medium hover:border-ink transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>Export Portfolio Archive</span>
          </button>
        </div>
      </div>

      {/* Signature Element: Lifetime Analytics KPI Strip */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="pl-3 border-l-2 border-indigo-600">
          <div className="font-mono text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent tabular-nums tracking-tight">
            {data?.analytics.studiesCount || 0}
          </div>
          <div className="text-xs font-sans text-slate-500 font-medium uppercase tracking-wider mt-0.5">
            Studies Registered
          </div>
          <div className="text-[11px] font-mono text-indigo-600 font-medium mt-0.5">Active Protocols</div>
        </div>

        <div className="pl-3 border-l-2 border-emerald-600">
          <div className="font-mono text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent tabular-nums tracking-tight">
            {data?.analytics.totalCleanResponses?.toLocaleString() || 0}
          </div>
          <div className="text-xs font-sans text-slate-500 font-medium uppercase tracking-wider mt-0.5">
            Clean Respondents Analyzed
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium mt-0.5">Speeders Filtered</div>
        </div>

        <div className="pl-3 border-l-2 border-cyan-600">
          <div className="font-mono text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent tabular-nums tracking-tight">
            {data?.analytics.totalHypothesesEvaluated || 0}
          </div>
          <div className="text-xs font-sans text-slate-500 font-medium uppercase tracking-wider mt-0.5">
            Hypotheses Tested
          </div>
          <div className="text-[11px] font-mono text-cyan-600 font-medium mt-0.5">Automated Inference</div>
        </div>

        <div className="pl-3 border-l-2 border-amber-500">
          <div className="font-mono text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent tabular-nums tracking-tight">
            {data?.analytics.totalSignificantFindings || 0}
          </div>
          <div className="text-xs font-sans text-slate-500 font-medium uppercase tracking-wider mt-0.5">
            Verified Findings
          </div>
          <div className="text-[11px] font-mono text-amber-600 font-medium mt-0.5">Bonferroni Surviving</div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-mono pb-1">
        <button
          onClick={() => { setActiveTab('profile'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`py-2 px-3.5 rounded-lg whitespace-nowrap font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          1. Investigator Identity
        </button>

        <button
          onClick={() => { setActiveTab('settings'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`py-2 px-3.5 rounded-lg whitespace-nowrap font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          2. Methodological Defaults & Options
        </button>

        <button
          onClick={() => { setActiveTab('history'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`py-2 px-3.5 rounded-lg whitespace-nowrap font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          3. Research History & Audit Timeline ({data?.recentActivity?.length || 0})
        </button>

        <button
          onClick={() => { setActiveTab('security'); setSuccessMsg(null); setErrorMsg(null); }}
          className={`py-2 px-3.5 rounded-lg whitespace-nowrap font-medium transition-all ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          4. Security & Data Portability
        </button>
      </div>

      {/* TAB 1: INVESTIGATOR IDENTITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveProfile} className="space-y-4 border border-hairline p-6 bg-bg-base">
              <div className="space-y-1 pb-3 border-b border-hairline">
                <h2 className="text-base font-serif font-semibold text-ink">
                  Investigator Credentials & Institutional Affiliations
                </h2>
                <p className="text-xs text-ink-muted font-sans">
                  Official research identity metadata attached to study protocols and exportable datasets.
                </p>
              </div>

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
                    Username / Handle
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
                    Institutional Affiliation / Lab
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
                    ORCID Registry Identifier
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
                    Research Focus & Biographical Abstract
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Focuses on cognitive load reduction, empirical trust modeling in autonomous algorithmic systems, and large-scale behavioral survey methodologies."
                    className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none resize-y leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Profile Summary Card */}
          <div className="space-y-4">
            <div className="border border-hairline p-5 bg-bg-surface space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                Investigator Card
              </div>
              <div>
                <h3 className="font-serif font-semibold text-base text-ink">
                  {name || 'Unassigned Investigator'}
                </h3>
                <div className="font-mono text-xs text-accent-action mt-0.5">
                  {data?.profile.email}
                </div>
              </div>

              <div className="pt-2 border-t border-hairline space-y-1.5 text-xs text-ink font-sans">
                {institution && (
                  <div className="flex items-start space-x-2">
                    <Building className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                    <span>{institution}</span>
                  </div>
                )}
                {discipline && (
                  <div className="flex items-start space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                    <span>{discipline}</span>
                  </div>
                )}
                {orcidId && (
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <BadgeCheck className="w-3.5 h-3.5 text-accent-significant shrink-0" />
                    <span>ORCID: {orcidId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-hairline p-4 space-y-2 bg-bg-base text-xs font-mono text-ink-muted">
              <div>Account Created: <span className="text-ink">{data?.profile.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              <div>Security Status: <span className="text-accent-significant font-medium">JWT httpOnly Active</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: METHODOLOGICAL DEFAULTS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl border border-hairline p-6 bg-bg-base">
          <div className="space-y-1 pb-3 border-b border-hairline">
            <h2 className="text-base font-serif font-semibold text-ink">
              Statistical Decision Tree & Preprocessing Defaults
            </h2>
            <p className="text-xs text-ink-muted font-sans">
              Configure default hypotheses criteria, significance thresholds, and data cleaning limits applied across automated pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Default Significance Threshold (&alpha;)
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
                Multiple Testing Correction Strategy
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
                Statistical Reporting Notation Preference
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
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRunPipelineOnIngest}
                  onChange={(e) => setSettings({ ...settings, autoRunPipelineOnIngest: e.target.checked })}
                  className="w-4 h-4 rounded-none border-hairline text-accent-action focus:ring-0"
                />
                <span className="text-xs font-sans text-ink">
                  Auto-execute full statistical pipeline upon data ingestion
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving Settings...' : 'Save Methodological Defaults'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: RESEARCH HISTORY & ACTIVITY TIMELINE */}
      {activeTab === 'history' && (
        <div className="space-y-4 max-w-4xl">
          <div className="border border-hairline">
            <div className="px-4 py-3 bg-bg-surface border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted flex justify-between">
              <span>Historical Action Log & Provenance Audit Trail</span>
              <span>Total Recorded Events: {data?.recentActivity?.length || 0}</span>
            </div>

            <div className="divide-y divide-hairline">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((act) => (
                  <div key={act.id} className="p-3.5 bg-bg-base flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                    <div className="space-y-1">
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
                <div className="p-8 text-center text-xs font-mono text-ink-muted">
                  No activity history recorded for current session.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT SECURITY & DATA PORTABILITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-3 p-5 bg-bg-base border border-hairline">
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

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                New Password (min. 8 characters)
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
          <div className="p-5 bg-bg-surface border border-hairline space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 pb-2 border-b border-hairline">
                <Download className="w-4 h-4 text-ink-muted" />
                <h3 className="font-serif font-semibold text-sm text-ink">Full Research Portfolio Archive</h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Export an institutional JSON backup containing all registered questionnaires, raw respondent answers, cleaned datasets, statistical hypothesis tests, and provenance logs.
              </p>
            </div>

            <div className="pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={handleExportPortfolio}
                className="w-full inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 border border-hairline bg-bg-base text-ink text-xs font-sans font-medium hover:border-ink transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Portfolio Archive (.json)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
