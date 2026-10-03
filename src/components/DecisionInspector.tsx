import React, { useState } from 'react';
import { SupportAgentResponse } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  HelpCircle, 
  Layers, 
  Activity, 
  Ticket, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

interface DecisionInspectorProps {
  lastResponse?: SupportAgentResponse | null;
}

export const DecisionInspector: React.FC<DecisionInspectorProps> = ({ lastResponse }) => {
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  if (!lastResponse) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Cpu className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300">Agent Brain & Decision Inspector</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Send a customer message or select a test scenario to inspect real-time policy evaluation, evidence checklist, and audit trace.
        </p>
      </div>
    );
  }

  const { decision, reason_codes, policy_version, evidence, actions, trace, ticket } = lastResponse;

  const getDecisionTheme = () => {
    switch (decision) {
      case 'ACT':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
          subtitle: 'Deterministic backend action authorized and safely executed.',
        };
      case 'ANSWER':
        return {
          bg: 'bg-blue-950/40',
          border: 'border-blue-500/40',
          text: 'text-blue-400',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Info,
          subtitle: 'Authoritative data verified and customer guidance provided.',
        };
      case 'ASK':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: HelpCircle,
          subtitle: 'Required data missing or ambiguous; safe choices requested.',
        };
      case 'ESCALATE':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert,
          subtitle: 'Dispatched to human specialist due to safety, fraud, or policy threshold.',
        };
    }
  };

  const theme = getDecisionTheme();
  const IconComponent = theme.icon;

  const evidenceChecklist = [
    { key: 'customer_verified', label: 'Customer Verified', desc: 'Authenticated session & risk score < 0.70' },
    { key: 'order_verified', label: 'Order Verified', desc: 'Resolved to authoritative database record' },
    { key: 'ownership_verified', label: 'Ownership Verified', desc: 'Strictly matches authenticated customer ID' },
    { key: 'payment_verified', label: 'Payment Verified', desc: 'Payment transaction marked completed' },
    { key: 'delivery_verified', label: 'Delivery Verified', desc: 'Order delivery confirmed with timestamp' },
    { key: 'policy_verified', label: 'Policy Verified', desc: 'Governing version matched via snapshot date' },
    { key: 'window_verified', label: 'Return Window Verified', desc: 'Elapsed days within policy window' },
    { key: 'refund_amount_verified', label: 'Amount Verified', desc: 'Within net order cap & below approval limit' },
  ] as const;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Inspector Header & Hero Outcome */}
      <div className={`p-4 border-b ${theme.bg} ${theme.border} transition-colors`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Agent Decision:</span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-sm border shadow-sm ${theme.badgeBg}`}>
              <IconComponent className="h-4 w-4" />
              <span>{decision}</span>
            </div>
          </div>

          {policy_version && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Policy Snapshot</span>
              <span className="font-mono text-xs text-indigo-300 font-semibold bg-slate-900/80 px-2 py-0.5 rounded border border-indigo-900/60">
                {policy_version}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-300">{theme.subtitle}</p>

        {ticket && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-amber-400" />
              <span>Escalated to <strong>{ticket.issue_type}</strong></span>
            </div>
            <span className="font-mono font-bold text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded">
              #{ticket.id} ({ticket.priority.toUpperCase()})
            </span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
        {/* Reason Codes */}
        <div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>Reason Codes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reason_codes.map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-slate-800 text-indigo-300 border border-slate-700 shadow-sm"
              >
                {code}
              </span>
            ))}
          </div>
        </div>

        {/* 8-Point Evidence Verification Checklist */}
        <div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Deterministic Evidence Checklist</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {Object.values(evidence).filter((v) => v === true).length}/8 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {evidenceChecklist.map(({ key, label, desc }) => {
              const isVerified = Boolean(evidence[key]);

              return (
                <div
                  key={key}
                  className={`p-2 rounded-lg border flex items-start gap-2 ${
                    isVerified
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 opacity-75'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <div className={`font-semibold text-[11px] ${isVerified ? 'text-slate-100' : 'text-slate-400'}`}>
                      {label}
                    </div>
                    <div className="text-[10px] text-slate-400">{desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Executed */}
        {actions.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mutations Executed ({actions.length})</span>
            </div>
            <div className="space-y-1.5">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-emerald-300">{act.summary}</span>
                    <div className="font-mono text-[10px] text-slate-400">{act.id}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool & Audit Trace */}
        <div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              <span>Deterministic Execution Trace ({trace.length} Steps)</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {trace.map((tr, idx) => {
              const isExpanded = expandedTraceIndex === idx;

              let statusColor = 'text-blue-400 bg-blue-950/40 border-blue-800';
              if (tr.status === 'success') statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
              if (tr.status === 'warning') statusColor = 'text-amber-400 bg-amber-950/40 border-amber-800';
              if (tr.status === 'error') statusColor = 'text-rose-400 bg-rose-950/40 border-rose-800';

              return (
                <div key={idx} className="rounded-lg bg-slate-800/60 border border-slate-700/70 p-2">
                  <div
                    onClick={() => setExpandedTraceIndex(isExpanded ? null : idx)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusColor}`}>
                        {tr.status.toUpperCase()}
                      </span>
                      <span className="font-medium text-slate-200">{tr.step}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60">
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2 rounded overflow-x-auto">
                        {typeof tr.details === 'string'
                          ? tr.details
                          : JSON.stringify(tr.details, null, 2)}
                      </pre>
                      <div className="text-[9px] text-slate-500 mt-1 font-mono">{tr.timestamp}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
