import React, { useState } from 'react';
import { ActionPreview, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Package, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface RefundPreviewCardProps {
  preview: ActionPreview;
  language: SupportedLanguage;
  isDark?: boolean;
  onConfirm: (preview: ActionPreview) => Promise<void>;
  onCancel?: () => void;
  onWhyPolicy?: (policyVersion: string) => void;
}

export const RefundPreviewCard: React.FC<RefundPreviewCardProps> = ({
  preview,
  language,
  isDark = true,
  onConfirm,
  onCancel,
  onWhyPolicy,
}) => {
  const t = TRANSLATIONS[language];
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(preview);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all shadow-md ${
        isDark
          ? preview.confirmed
            ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100 shadow-emerald-500/5'
            : 'bg-slate-900 border-indigo-500/40 text-slate-100 shadow-indigo-500/10'
          : preview.confirmed
            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
            : 'bg-white border-indigo-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {t.refundPreviewTitle}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.refundPreviewSub}</p>
          </div>
        </div>

        {preview.confirmed ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t.confirmedBadge}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 uppercase">
            <Clock className="h-3 w-3" />
            <span>Awaiting Your Confirmation</span>
          </div>
        )}
      </div>

      {/* Item & Order Info Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{preview.item_name}</span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {t.orderNumber}: <strong className="text-slate-800 dark:text-slate-300">{preview.order_id}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => onWhyPolicy && onWhyPolicy(preview.policy_version)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-[10px] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 transition-colors cursor-pointer"
          title="Explain this policy"
        >
          <HelpCircle className="h-3 w-3" />
          <span>{t.whyPolicyBtn}</span>
        </button>
      </div>

      {/* Financial Breakdown Table */}
      <div className="space-y-2 text-xs mb-4 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400">{t.orderTotal}:</span>
          <span className="font-mono font-medium">₹{preview.order_total.toLocaleString('en-IN')}</span>
        </div>

        {preview.requested_amount !== preview.order_total && (
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">{t.requestedAmount}:</span>
            <span className="font-mono font-medium text-slate-400 line-through">
              ₹{preview.requested_amount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400">{t.eligibleAmount}:</span>
          <span className="font-mono font-medium">₹{preview.eligible_amount.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {t.restockingFee} ({preview.restocking_fee_percent}%):
            <button
              onClick={() => onWhyPolicy && onWhyPolicy(preview.policy_version)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] cursor-pointer"
            >
              ({t.whyPolicyBtn})
            </button>
          </span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
            - ₹{preview.restocking_fee.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/70 flex items-center justify-between font-bold text-sm">
          <span className="text-slate-900 dark:text-slate-100">{t.finalRefundAmount}:</span>
          <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
            ₹{preview.final_amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Expected Processing Time & Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
          <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase">{t.expectedProcessingTime}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{preview.expected_processing_time}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
          <CreditCard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase">{t.paymentMethod}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{preview.payment_method_masked}</span>
          </div>
        </div>
      </div>

      {/* Action Confirmation Buttons */}
      {!preview.confirmed ? (
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{preview.type === 'return' ? t.confirmReturnBtn : t.confirmRefundBtn} (₹{preview.final_amount.toLocaleString('en-IN')})</span>
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {t.cancelBtn}
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {t.trustFormatApproved} <strong>Case #{preview.case_id}</strong>
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
            ₹{preview.final_amount.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
};
