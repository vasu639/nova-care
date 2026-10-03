import React from 'react';
import { Shield, Bot, RotateCcw, BookOpen, Database, Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenPolicies: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenPolicies, isResetting }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-6 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                NovaMart <span className="text-emerald-400 font-medium text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 uppercase tracking-wider">AI Agent</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                <Shield className="h-3 w-3 text-emerald-400" />
                Deterministic Guardrails
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Safety-First Autonomous Support • Versioned Policies • Evidence Verification
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-slate-400">Database:</span>
            <span className="font-mono text-emerald-400 font-semibold">SQLite (Authoritative)</span>
          </div>

          <button
            onClick={onOpenPolicies}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm active:scale-95"
            title="View Store Versioned Policies"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Versioned</span> Policies
          </button>

          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Reset Database to Pristine Seed State"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-slate-400 ${isResetting ? 'animate-spin text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Reset Seed Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
