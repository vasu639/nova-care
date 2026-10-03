import React from 'react';
import { WhatWeCheckedItem, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Info
} from 'lucide-react';

interface DecisionExplanationPanelProps {
  items: WhatWeCheckedItem[];
  policyVersion?: string | null;
  language: SupportedLanguage;
  isDark?: boolean;
  onWhyPolicy?: (version: string) => void;
}

export const DecisionExplanationPanel: React.FC<DecisionExplanationPanelProps> = ({
  items,
  policyVersion,
  language,
  isDark = true,
  onWhyPolicy,
}) => {
  const t = TRANSLATIONS[language];

  if (!items || items.length === 0) {
    return null;
  }

  const verifiedCount = items.filter((i) => i.status === 'verified').length;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-sm ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              {t.whatWeCheckedTitle}
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40">
                {verifiedCount}/{items.length} Checked
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.whatWeCheckedSub}</p>
          </div>
        </div>

        {policyVersion && onWhyPolicy && (
          <button
            onClick={() => onWhyPolicy(policyVersion)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t.whyPolicyBtn}</span>
          </button>
        )}
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {items.map((item) => {
          let statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
          let StatusIcon = CheckCircle2;

          if (item.status === 'pending') {
            statusColor = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
            StatusIcon = Clock;
          } else if (item.status === 'flagged') {
            statusColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
            StatusIcon = AlertCircle;
          } else if (item.status === 'not_applicable') {
            statusColor = 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';
            StatusIcon = Info;
          }

          return (
            <div
              key={item.key}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg shrink-0 mt-0.5 border ${statusColor}`}>
                <StatusIcon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                    {item.label}
                  </span>
                  {item.valueDisplay && (
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      {item.valueDisplay}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {item.customerDescription}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
