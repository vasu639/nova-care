import React from 'react';
import { TimelineEvent, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  RotateCcw, 
  DollarSign, 
  CreditCard, 
  Clock, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface TimelineViewerProps {
  events: TimelineEvent[];
  language: SupportedLanguage;
  isDark?: boolean;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({
  events,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  if (!events || events.length === 0) {
    return null;
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'placed':
        return Package;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle2;
      case 'return_requested':
        return RotateCcw;
      case 'refund_approved':
        return DollarSign;
      case 'refund_processed':
        return CreditCard;
      default:
        return Clock;
    }
  };

  const activeCaseEvent = events.find((e) => e.case_id);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-sm ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t.timelineTitle}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.timelineSub}</p>
        </div>

        {activeCaseEvent?.case_id && (
          <div className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
            #{activeCaseEvent.case_id}
          </div>
        )}
      </div>

      {/* Case Overview Card if applicable */}
      {activeCaseEvent && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase block font-semibold">
              {t.caseId}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {activeCaseEvent.case_id}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase block font-semibold flex items-center gap-1">
              <User className="h-3 w-3" />
              {t.caseOwner}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {activeCaseEvent.owner || 'Senior Specialist (Priya N.)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase block font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t.expectedNextUpdate}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {activeCaseEvent.expected_update || 'Within 24 business hours'}
            </span>
          </div>
        </div>
      )}

      {/* Visual Timeline Steps */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700/60">
        {events.map((evt, idx) => {
          const Icon = getStageIcon(evt.stage);

          let circleColor = isDark
            ? 'bg-slate-800 border-slate-600 text-slate-400'
            : 'bg-slate-100 border-slate-300 text-slate-500';
          let textColor = isDark ? 'text-slate-400' : 'text-slate-600';
          let titleColor = isDark ? 'text-slate-300' : 'text-slate-800 font-semibold';

          if (evt.completed) {
            circleColor = 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20';
            textColor = isDark ? 'text-slate-300' : 'text-slate-600';
            titleColor = isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold';
          } else if (evt.current) {
            circleColor = 'bg-indigo-600 border-indigo-400 text-white animate-pulse ring-4 ring-indigo-500/20';
            textColor = isDark ? 'text-indigo-200' : 'text-indigo-700';
            titleColor = isDark ? 'text-indigo-300 font-bold' : 'text-indigo-900 font-bold';
          }

          return (
            <div key={evt.id || idx} className="relative text-xs">
              {/* Dot Icon */}
              <div
                className={`absolute -left-[29px] top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${circleColor}`}
              >
                <Icon className="h-3 w-3" />
              </div>

              {/* Event Content */}
              <div
                className={`p-2.5 rounded-xl border transition-colors ${
                  isDark
                    ? evt.current
                      ? 'bg-indigo-950/40 border-indigo-700/60 shadow-sm'
                      : evt.completed
                        ? 'bg-slate-800/40 border-slate-700/60'
                        : 'bg-slate-800/20 border-slate-800/60 opacity-60'
                    : evt.current
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                      : evt.completed
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] ${titleColor}`}>{evt.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : 'Upcoming'}
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 leading-snug ${textColor}`}>
                  {evt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
