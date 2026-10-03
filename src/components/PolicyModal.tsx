import React from 'react';
import { VersionedPolicy } from '../types';
import { X, BookOpen, Clock, ShieldCheck, DollarSign } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: VersionedPolicy[];
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, policies }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">NovaMart Versioned Policies</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reproducible business rules selected strictly by order policy snapshot date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {policies.map((p) => {
            const isHistorical = p.effective_to !== null;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border transition ${
                  isHistorical
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-85'
                    : 'bg-white dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.category}</span>
                    <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700">
                      {p.version}
                    </span>
                    {isHistorical ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Historical Snapshot
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Active Policy
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {p.effective_from} → {p.effective_to || 'Present'}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{p.description}</p>

                {/* Key parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Return Window</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.return_window_days} Days</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Restocking Fee</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.restocking_percent}%</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Approval Threshold</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{p.approval_threshold.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Opened Items</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.allow_opened_items ? 'Allowed' : 'Unopened Only'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
