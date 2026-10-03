import React from 'react';
import { Customer } from '../types';
import { User, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  orderCount?: number;
  ticketCount?: number;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  orderCount = 0,
  ticketCount = 0,
}) => {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Authenticated Customer Context
            </h2>
            <p className="text-[11px] text-slate-400">
              Server-enforced session identity (untrusted user input cannot override)
            </p>
          </div>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {selectedCustomer.id}
            </span>
            {selectedCustomer.risk_score >= 0.7 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-3 w-3" />
                Risk Score: {selectedCustomer.risk_score.toFixed(2)} (High Fraud Flag)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                Risk Score: {selectedCustomer.risk_score.toFixed(2)} (Verified)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Customer Switcher Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {customers.map((c) => {
          const isSelected = c.id === selectedCustomerId;
          const isHighRisk = c.risk_score >= 0.7;

          return (
            <button
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              className={`text-left p-2.5 rounded-lg border transition-all text-xs relative ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold truncate">{c.name}</span>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">{c.id}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mb-1.5">{c.email}</div>
              <div className="flex items-center justify-between text-[10px]">
                <span className={`px-1.5 py-0.2 rounded font-mono ${
                  isHighRisk ? 'text-rose-400 bg-rose-950/60' : 'text-slate-400 bg-slate-900/60'
                }`}>
                  Risk: {c.risk_score.toFixed(2)}
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-indigo-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
