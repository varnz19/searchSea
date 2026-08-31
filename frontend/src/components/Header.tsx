import React from 'react';
import { BookOpen, Plus, LogOut, User as UserIcon, Settings, Database } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            onClick={onBackToSurveys}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-serif font-bold text-base shadow-sm group-hover:bg-slate-800 transition-colors">
              S
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-bold text-xl tracking-tight text-slate-950">
                SearchSea
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold border-l border-slate-200 pl-2">
                v1.0
              </span>
            </div>
          </div>

          {selectedSurveyTitle && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200 text-xs">
              <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px] font-semibold">Study:</span>
              <span className="font-medium text-slate-800 truncate max-w-sm">
                {selectedSurveyTitle}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href="http://localhost:5555"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-mono text-slate-600 hover:text-slate-950 px-3 py-1.5 rounded border border-slate-200 bg-white hover:border-slate-300 transition-all"
            title="Open Prisma Studio Database Tables GUI (http://localhost:5555)"
          >
            <Database className="w-3.5 h-3.5 text-slate-700" />
            <span>DB Studio</span>
          </a>

          <button
            onClick={onOpenMethodology}
            className="inline-flex items-center space-x-1.5 text-xs font-sans font-medium px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Methodology</span>
          </button>

          <button
            onClick={onNewSurvey}
            className="inline-flex items-center space-x-1.5 text-xs font-sans font-semibold px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Study</span>
          </button>

          {user && (
            <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 space-x-2">
              <button
                onClick={onOpenProfile}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-800 transition-all group"
                title="Investigator Profile & Methodological Settings"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  {(user.name || user.username || user.email)[0].toUpperCase()}
                </div>
                <span className="truncate max-w-[120px] font-sans font-semibold text-slate-900 group-hover:text-slate-950">
                  {user.name || user.username || user.email.split('@')[0]}
                </span>
                <Settings className="w-3 h-3 text-slate-500 group-hover:text-slate-800" />
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
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
