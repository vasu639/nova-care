import React, { useState } from 'react';
import { SupportAgentResponse, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { RiskAssessmentWidget } from './RiskAssessmentWidget';
import { DecisionExplanationPanel } from './DecisionExplanationPanel';
import { TimelineViewer } from './TimelineViewer';
import { EvidenceChecklist } from './EvidenceChecklist';
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
  Cpu,
  Clock,
  FileCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface DecisionInspectorProps {
  lastResponse?: SupportAgentResponse | null;
  language: SupportedLanguage;
  isDark?: boolean;
  onWhyPolicy?: (version: string) => void;
}

export const DecisionInspector: React.FC<DecisionInspectorProps> = ({
  lastResponse,
  language,
  isDark = true,
  onWhyPolicy,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'transparency' | 'audit'>('transparency');
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  if (!lastResponse) {
    return (
      <div
        className={`rounded-2xl border p-6 text-center flex flex-col items-center justify-center h-full min-h-[400px] transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-slate-200/50'
        }`}
      >
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 animate-pulse">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200 dark:text-slate-200">
          Decision Explanation & Timeline Inspector
        </h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Interact with Nova or pick a test scenario to inspect verified order status, decision explanations, timelines, and risk telemetry.
        </p>
      </div>
    );
  }

  const { decision, reason_codes = [], policy_version, evidence, actions = [], trace = [], ticket } = lastResponse;

  const getDecisionTheme = () => {
    switch (decision) {
      case 'ACT':
        return {
          bg: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
          border: isDark ? 'border-emerald-500/40' : 'border-emerald-200',
          text: 'text-emerald-500',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
          subtitle: 'Deterministic action verified and authorized.',
        };
      case 'ANSWER':
        return {
          bg: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
          border: isDark ? 'border-blue-500/40' : 'border-blue-200',
          text: 'text-blue-500',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Info,
          subtitle: 'Authoritative data verified and customer guidance provided.',
        };
      case 'ASK':
        return {
          bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
          border: isDark ? 'border-amber-500/40' : 'border-amber-200',
          text: 'text-amber-500',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: HelpCircle,
          subtitle: 'Required data missing or confirmation needed; safe choices offered.',
        };
      case 'ESCALATE':
        return {
          bg: isDark ? 'bg-rose-950/40' : 'bg-rose-50',
          border: isDark ? 'border-rose-500/40' : 'border-rose-200',
          text: 'text-rose-500',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert,
          subtitle: 'Dispatched to human specialist for safety, fraud, or policy threshold.',
        };
    }
  };

  const theme = getDecisionTheme();
  const IconComponent = theme.icon;

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col h-full transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}
    >
      {/* Inspector Header & Hero Outcome */}
      <div className={`p-4 border-b ${theme.bg} ${theme.border} transition-colors`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Agent Decision:
            </span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-sm border shadow-sm ${theme.badgeBg}`}>
              <IconComponent className="h-4 w-4" />
              <span>{decision}</span>
            </div>
          </div>

          {policy_version && (
            <div className="text-right flex items-center gap-2">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Policy</span>
                <span className="font-mono text-xs font-semibold bg-indigo-50 dark:bg-slate-900/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/60">
                  {policy_version}
                </span>
              </div>
              {onWhyPolicy && (
                <button
                  onClick={() => onWhyPolicy(policy_version)}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition shadow-xs"
                >
                  {t.whyPolicyBtn}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300">{theme.subtitle}</p>

        {ticket && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Case Assigned to <strong>{ticket.issue_type}</strong></span>
            </div>
            <span className="font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
              #{ticket.id} ({ticket.priority.toUpperCase()})
            </span>
          </div>
        )}
      </div>

      {/* Inspector Tabs Bar */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 px-3 pt-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('transparency')}
          className={`px-3 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'transparency'
              ? isDark
                ? 'bg-slate-900 text-indigo-400 border-t border-x border-slate-700/80'
                : 'bg-white text-indigo-700 border-t border-x border-slate-200 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Customer Trust & Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit'
              ? isDark
                ? 'bg-slate-900 text-indigo-400 border-t border-x border-slate-700/80'
                : 'bg-white text-indigo-700 border-t border-x border-slate-200 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Threat Gauge & Audit Trace</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
        {activeTab === 'transparency' ? (
          <>
            {/* FEATURE 1: What We Checked Panel */}
            {lastResponse.what_we_checked && lastResponse.what_we_checked.length > 0 && (
              <DecisionExplanationPanel
                items={lastResponse.what_we_checked}
                policyVersion={policy_version}
                language={language}
                isDark={isDark}
                onWhyPolicy={onWhyPolicy}
              />
            )}

            {/* FEATURE 3: Order & Case Timeline */}
            {lastResponse.timeline_events && lastResponse.timeline_events.length > 0 && (
              <TimelineViewer
                events={lastResponse.timeline_events}
                language={language}
                isDark={isDark}
              />
            )}

            {/* FEATURE 4: Evidence & Document Checklist */}
            {lastResponse.evidence_items && lastResponse.evidence_items.length > 0 && (
              <EvidenceChecklist
                items={lastResponse.evidence_items}
                language={language}
                isDark={isDark}
              />
            )}
          </>
        ) : (
          <>
            {/* Real-Time Risk Assessment Gauge Widget */}
            <RiskAssessmentWidget lastResponse={lastResponse} isDark={isDark} />

            {/* Reason Codes */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Deterministic Reason Codes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reason_codes.map((code) => (
                  <span
                    key={code}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border shadow-xs ${
                      isDark
                        ? 'bg-slate-800 text-indigo-300 border-slate-700'
                        : 'bg-slate-100 text-indigo-700 border-slate-200'
                    }`}
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>

            {/* Mutations Executed */}
            {actions.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Mutations Executed ({actions.length})</span>
                </div>
                <div className="space-y-1.5">
                  {actions.map((act) => (
                    <div
                      key={act.id}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                        isDark
                          ? 'bg-emerald-950/20 border-emerald-800/50'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">{act.summary}</span>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{act.id}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {act.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tool & Audit Trace */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Deterministic Execution Trace ({trace.length} Steps)</span>
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {trace.map((tr, idx) => {
                  const isExpanded = expandedTraceIndex === idx;

                  let statusColor = isDark
                    ? 'text-blue-400 bg-blue-950/40 border-blue-800'
                    : 'text-blue-700 bg-blue-50 border-blue-200';
                  if (tr.status === 'success') {
                    statusColor = isDark
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  } else if (tr.status === 'warning') {
                    statusColor = isDark
                      ? 'text-amber-400 bg-amber-950/40 border-amber-800'
                      : 'text-amber-700 bg-amber-50 border-amber-200';
                  } else if (tr.status === 'error') {
                    statusColor = isDark
                      ? 'text-rose-400 bg-rose-950/40 border-rose-800'
                      : 'text-rose-700 bg-rose-50 border-rose-200';
                  }

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-2 ${
                        isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedTraceIndex(isExpanded ? null : idx)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusColor}`}>
                            {tr.status.toUpperCase()}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{tr.step}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                          <pre className={`text-[10px] font-mono p-2 rounded overflow-x-auto ${
                            isDark ? 'text-slate-300 bg-slate-900/90' : 'text-slate-800 bg-white border border-slate-200'
                          }`}>
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
          </>
        )}
      </div>
    </div>
  );
};
