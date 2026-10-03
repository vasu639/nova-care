import React from 'react';
import { CustomerNotification, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { Bell, Truck, DollarSign, UserCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface NotificationsBannerProps {
  notifications: CustomerNotification[];
  language: SupportedLanguage;
  isDark?: boolean;
}

export const NotificationsBanner: React.FC<NotificationsBannerProps> = ({
  notifications,
  language,
  isDark = true,
}) => {
  const t = TRANSLATIONS[language];

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'refund_initiated':
      case 'refund_completed':
        return DollarSign;
      case 'return_pickup_scheduled':
        return Truck;
      case 'escalation_assigned':
        return UserCheck;
      case 'refund_delayed':
        return AlertTriangle;
      default:
        return Bell;
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
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t.proactiveUpdatesTitle}
          </h4>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          {notifications.length} Active
        </span>
      </div>

      <div className="space-y-2">
        {notifications.slice(0, 3).map((notif) => {
          const Icon = getNotifIcon(notif.type);

          return (
            <div
              key={notif.id}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
                isDark
                  ? notif.type === 'refund_delayed'
                    ? 'bg-amber-950/25 border-amber-800/60 text-amber-200'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                  : notif.type === 'refund_delayed'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-500/30">
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] truncate">
                    {notif.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {notif.message}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Expectation: {notif.expected_time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
