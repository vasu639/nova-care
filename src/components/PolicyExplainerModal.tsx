import React from 'react';
import { VersionedPolicy, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { HelpCircle, X, ShieldCheck, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

interface PolicyExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyVersion?: string | null;
  policies: VersionedPolicy[];
  language: SupportedLanguage;
  isDark?: boolean;
}

export const PolicyExplainerModal: React.FC<PolicyExplainerModalProps> = ({
  isOpen,
  onClose,
  policyVersion,
  policies,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const activePolicy = policies.find((p) => p.version === policyVersion) || policies[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-all relative ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {t.policyExplainerTitle}
            </h3>
            <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
              {activePolicy?.version || policyVersion || 'ELECTRONICS-2026.1'}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {activePolicy?.description || 'Standard customer return and refund policy.'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold">Return Window</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activePolicy?.return_window_days || 14} Days
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Calculated from doorstep delivery</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-semibold">Restocking Fee</span>
              </div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {activePolicy?.restocking_percent || 5.0}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Covers testing and warehouse repackaging</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">Why does this policy govern your order?</strong>
              NovaMart uses deterministic version snapshots. The policy in effect at the exact moment of order placement applies for the entire life of your purchase, protecting you from mid-return policy changes.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
