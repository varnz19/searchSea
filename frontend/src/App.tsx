import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { SurveyList } from './components/SurveyList';
import { SurveyGeneratorModal } from './components/SurveyGeneratorModal';
import { DataIntegrationModal } from './components/DataIntegrationModal';
import { DashboardView } from './components/DashboardView';
import { MethodologyModal } from './components/MethodologyModal';
import { ProfilePage } from './components/ProfilePage';
import { api } from './api';
import { Survey } from './types';
import { RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isProfileView, setIsProfileView] = useState<boolean>(false);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isIngestOpen, setIsIngestOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
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
    setIsProfileView(false);
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
    setIsProfileView(false);
    await loadSurveys();
    handleSelectSurvey(newSurvey);
    handleOpenIngest(newSurvey);
  };

  const handleOpenProfile = () => {
    setSelectedSurvey(null);
    setIsProfileView(true);
  };

  const handleBackToSurveys = () => {
    setSelectedSurvey(null);
    setIsProfileView(false);
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

  // Unauthenticated Flow: Scrollable Landing Page with Hero, Pipeline Breakdown, and Auth
  if (!user) {
    return <LandingPage onOpenMethodology={() => setIsMethodologyOpen(true)} />;
  }

  // Authenticated App: Fully Scrollable Dashboard Layout
  return (
    <div className="min-h-screen bg-bg-base text-ink flex flex-col font-sans">
      <Header
        onNewSurvey={() => { setIsProfileView(false); setIsGeneratorOpen(true); }}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenProfile={handleOpenProfile}
        selectedSurveyTitle={selectedSurvey?.title}
        onBackToSurveys={handleBackToSurveys}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isProfileView ? (
          <ProfilePage onBack={handleBackToSurveys} />
        ) : selectedSurvey ? (
          <DashboardView
            survey={selectedSurvey}
            onBack={handleBackToSurveys}
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

      {/* Footer */}
      <footer className="w-full border-t border-hairline bg-bg-surface py-6 text-xs font-sans text-ink-muted mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-baseline space-x-2">
            <span className="font-serif font-bold text-sm text-ink">SearchSea</span>
            <span className="font-mono text-[10px]">Empirical Quantitative Platform &bull; v1.0</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <a href="http://localhost:5555" target="_blank" rel="noreferrer" className="hover:text-ink">
              Prisma Studio DB
            </a>
            <span>&bull;</span>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-ink">
              Python ML Docs
            </a>
            <span>&bull;</span>
            <button onClick={() => setIsMethodologyOpen(true)} className="hover:text-ink">
              Methodology
            </button>
          </div>
        </div>
      </footer>

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
