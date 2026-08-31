import React from 'react';
import { BookOpen, Plus, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onNewSurvey: () => void;
  onOpenMethodology: () => void;
  onOpenProfile: () => void;
  selectedSurveyTitle?: string;
  onBackToSurveys?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewSurvey,
  onOpenMethodology,
  onOpenProfile,
  selectedSurveyTitle,
  onBackToSurveys,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div
            onClick={onBackToSurveys}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-bold text-xl text-ink tracking-tight">
                SearchSea
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                v1.0 / Empirical Engine
              </span>
            </div>
          </div>

          {selectedSurveyTitle && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-hairline text-xs">
              <span className="text-ink-muted font-mono uppercase tracking-wider text-[10px]">Study:</span>
              <span className="font-medium text-ink truncate max-w-sm">
                {selectedSurveyTitle}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenMethodology}
            className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium px-3 py-1.5 border border-hairline text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-ink-muted" />
            <span>Methodology</span>
          </button>

          <button
            onClick={onNewSurvey}
            className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium px-3.5 py-1.5 bg-accent-action text-white hover:bg-opacity-95 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Study</span>
          </button>

          {user && (
            <div className="flex items-center pl-2 sm:pl-3 border-l border-hairline space-x-2">
              <button
                onClick={onOpenProfile}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-bg-surface hover:bg-bg-base border border-hairline text-xs font-mono text-ink transition-colors"
                title="Investigator Profile & Methodological Settings"
              >
                <UserIcon className="w-3.5 h-3.5 text-accent-action shrink-0" />
                <span className="truncate max-w-[120px] font-sans font-medium">
                  {user.name || user.username || user.email.split('@')[0]}
                </span>
                <Settings className="w-3 h-3 text-ink-muted shrink-0" />
              </button>

              <button
                onClick={logout}
                className="p-1 text-ink-muted hover:text-accent-flagged transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
