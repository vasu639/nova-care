import React, { useState } from 'react';
import { Customer, Order, SupportAgentResponse, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  UserCheck, 
  Send, 
  X, 
  CheckCircle2, 
  FileText, 
  ShieldAlert, 
  Layers, 
  Clock,
  Sparkles
} from 'lucide-react';

interface HumanHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  orders: Order[];
  lastResponse?: SupportAgentResponse | null;
  language: SupportedLanguage;
  isDark?: boolean;
  onConfirmHandoff: (summary: string) => Promise<void>;
}

export const HumanHandoffModal: React.FC<HumanHandoffModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  lastResponse,
  language,
  isDark = true,
  onConfirmHandoff,
}) => {
  const t = TRANSLATIONS[language];
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transferred, setTransferred] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirmHandoff(note);
      setTransferred(true);
      setTimeout(() => {
        setTransferred(false);
        onClose();
      }, 1800);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryOrder = orders[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl transition-all relative ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {t.talkToSpecialist}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.specialistTransferNote}</p>
          </div>
        </div>

        {transferred ? (
          <div className="p-6 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {t.transferSuccess}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned to Senior Care Lead Priya N.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            {/* Auto-Aggregated Packet Preview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                <span>Pre-Packaged Context (No Need to Repeat)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{customer?.name} ({customer?.email})</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Recent Order:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {primaryOrder ? `${primaryOrder.id} - ₹${primaryOrder.total_amount}` : 'None specified'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Verified Policy:</span>
                  <div className="font-mono text-indigo-700 dark:text-indigo-300">
                    {lastResponse?.policy_version || 'ELECTRONICS-2026.1'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Decision State:</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {lastResponse?.decision || 'ACTIVE_SESSION'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Note for Specialist:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any specific instruction or request..."
                rows={3}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="animate-spin inline-block h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Transfer Context Directly</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
