import React from 'react';
import { EvidenceItem, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  FileText, 
  Image, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface EvidenceChecklistProps {
  items: EvidenceItem[];
  language: SupportedLanguage;
  isDark?: boolean;
}

export const EvidenceChecklist: React.FC<EvidenceChecklistProps> = ({
  items,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  if (!items || items.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return FileText;
      case 'photos':
        return Image;
      case 'otp':
        return ShieldCheck;
      case 'prior_messages':
        return MessageSquare;
      default:
        return FileText;
    }
  };

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
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            {t.evidenceTitle}
            <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
              {items.filter((i) => i.status === 'verified' || i.status === 'received').length}/{items.length} Ready
            </span>
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.evidenceSub}</p>
        </div>
      </div>

      {/* Evidence Items Grid */}
      <div className="space-y-2 text-xs">
        {items.map((item) => {
          const Icon = getTypeIcon(item.type);

          const isReady = item.status === 'verified' || item.status === 'received';

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                isDark
                  ? isReady
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                    : 'bg-amber-950/20 border-amber-800/50 text-amber-200'
                  : isReady
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isReady
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {item.label}
                    </span>
                    {item.acknowledgedPrior && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full font-bold text-[9px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                        <Sparkles className="h-2.5 w-2.5" />
                        {t.acknowledgedPriorBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {item.details}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    isDark
                      ? isReady
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : isReady
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {isReady ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
