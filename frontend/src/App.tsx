import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Header } from './components/Header';
import { SurveyList } from './components/SurveyList';
import { SurveyGeneratorModal } from './components/SurveyGeneratorModal';
import { DataIntegrationModal } from './components/DataIntegrationModal';
import { DashboardView } from './components/DashboardView';
import { MethodologyModal } from './components/MethodologyModal';
import { ProfileModal } from './components/ProfileModal';
import { api } from './api';
import { Survey } from './types';
import { RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isIngestOpen, setIsIngestOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeIngestSurvey, setActiveIngestSurvey] = useState<Survey | null>(null);

  const loadSurveys = async () => {
    try {
      const data = await api.getSurveys();
      setSurveys(data);

      if (selectedSurvey) {
        const refreshed = data.find((s) => s.id === selectedSurvey.id);
        if (refreshed) {
          const detail = await api.getSurvey(refreshed.id);
          setSelectedSurvey(detail);
        }
      }
    } catch (err) {
      console.error('Failed to load surveys:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user]);

  const handleSelectSurvey = async (survey: Survey) => {
    try {
      const detail = await api.getSurvey(survey.id);
      setSelectedSurvey(detail);
    } catch (err) {
      console.error(err);
      setSelectedSurvey(survey);
    }
  };

  const handleOpenIngest = (survey: Survey) => {
    setActiveIngestSurvey(survey);
    setIsIngestOpen(true);
  };

  const handleRunAnalysis = async (survey: Survey) => {
    await handleSelectSurvey(survey);
  };

  const handleDeleteSurvey = async (id: string) => {
    try {
      await api.deleteSurvey(id);
      if (selectedSurvey?.id === id) {
        setSelectedSurvey(null);
      }
      loadSurveys();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSurveyCreated = async (newSurvey: Survey) => {
    await loadSurveys();
    handleSelectSurvey(newSurvey);
    handleOpenIngest(newSurvey);
  };

  // Initial Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-base text-ink flex flex-col items-center justify-center space-y-3 font-mono text-xs text-ink-muted">
        <RefreshCw className="w-5 h-5 animate-spin text-accent-action" />
        <p>Validating session credentials...</p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authMode === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />;
  }

  // Authenticated App
  return (
    <div className="min-h-screen bg-bg-base text-ink flex flex-col font-sans">
      <Header
        onNewSurvey={() => setIsGeneratorOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        selectedSurveyTitle={selectedSurvey?.title}
        onBackToSurveys={() => setSelectedSurvey(null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedSurvey ? (
          <DashboardView
            survey={selectedSurvey}
            onBack={() => setSelectedSurvey(null)}
            onOpenIngest={() => handleOpenIngest(selectedSurvey)}
          />
        ) : (
          <SurveyList
            surveys={surveys}
            onSelectSurvey={handleSelectSurvey}
            onOpenIngest={handleOpenIngest}
            onRunAnalysis={handleRunAnalysis}
            onDeleteSurvey={handleDeleteSurvey}
            onNewSurvey={() => setIsGeneratorOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <SurveyGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSurveyCreated={handleSurveyCreated}
      />

      {activeIngestSurvey && (
        <DataIntegrationModal
          isOpen={isIngestOpen}
          onClose={() => {
            setIsIngestOpen(false);
            setActiveIngestSurvey(null);
          }}
          survey={activeIngestSurvey}
          onDataIngested={loadSurveys}
        />
      )}

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
