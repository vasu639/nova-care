import React from 'react';
import { Customer, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

interface SecurityBadgeProps {
  customer: Customer | null;
  maskedPayment?: string;
  language: SupportedLanguage;
  isDark?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  customer,
  maskedPayment = '•••• 4821 via UPI',
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div
      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {customer?.name || 'Verified Customer'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider">
              {t.verifiedAccount}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <CreditCard className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>{maskedPayment}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
        <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="leading-tight">{t.privacyGuarantee}</span>
      </div>
    </div>
  );
};
