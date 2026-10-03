import React from 'react';
import { SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  Shield, 
  Bot, 
  RotateCcw, 
  BookOpen, 
  Database, 
  Globe, 
  Sun, 
  Moon, 
  UserCheck 
} from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenPolicies: () => void;
  onOpenHandoff: () => void;
  onOpenLanguageModal?: () => void;
  isResetting: boolean;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenPolicies,
  onOpenHandoff,
  onOpenLanguageModal,
  isResetting,
  language,
  onLanguageChange,
  isDark,
  onToggleTheme,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header
      className={`border-b px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-md transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
                NovaMart
                <span className="text-emerald-500 dark:text-emerald-400 font-medium text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 uppercase tracking-wider">
                  AI Agent
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Shield className="h-3 w-3 text-emerald-500" />
                Verified Trust & Transparency
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Language Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/90 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={onOpenLanguageModal}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition cursor-pointer"
              title="Select Language / भाषा चुनें / भाषा निवडा"
            >
              <Globe className="h-3.5 w-3.5" />
            </button>
            {(['en', 'hi', 'mr'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={isDark ? t.lightMode : t.darkMode}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          {/* Talk to Specialist Button */}
          <button
            onClick={onOpenHandoff}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition cursor-pointer active:scale-95"
            title={t.talkToSpecialist}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.talkToSpecialist}</span>
          </button>

          {/* Versioned Policies */}
          <button
            onClick={onOpenPolicies}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-sm active:scale-95 cursor-pointer"
            title="View Store Versioned Policies"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden md:inline">Policies</span>
          </button>

          {/* Reset DB */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Reset Database to Pristine Seed State"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin text-rose-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
