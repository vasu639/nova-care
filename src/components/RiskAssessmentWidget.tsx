import React from 'react';
import { SupportAgentResponse, TraceEntry } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Terminal, 
  Package, 
  Lock, 
  CreditCard, 
  DollarSign, 
  Activity, 
  ChevronRight,
  Info
} from 'lucide-react';

interface RiskAssessmentWidgetProps {
  lastResponse: SupportAgentResponse;
  isDark?: boolean;
}

interface RiskIndicatorItem {
  id: string;
  name: string;
  category: 'safety' | 'fraud' | 'carrier' | 'policy' | 'billing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ className?: string }>;
  detected: boolean;
  summary: string;
  traceEvidence?: string;
  traceStep?: string;
}

export const RiskAssessmentWidget: React.FC<RiskAssessmentWidgetProps> = ({ lastResponse, isDark = true }) => {
  const { reason_codes = [], trace = [], decision } = lastResponse;

  // Search trace details for specific indicators and details
  const findTraceIndicator = (key: string) => {
    for (const tr of trace) {
      if (typeof tr.details === 'object' && tr.details !== null) {
        const detailsObj = tr.details as Record<string, unknown>;
        if (detailsObj.indicator === key) {
          return { step: tr.step, details: detailsObj };
        }
      }
      if (typeof tr.details === 'string' && tr.details.toLowerCase().includes(key.toLowerCase())) {
        return { step: tr.step, details: { text: tr.details } };
      }
    }
    return null;
  };

  // 1. suspicious_refund_pattern
  const fraudTrace = findTraceIndicator('suspicious_refund_pattern');
  const hasSuspiciousRefund = 
    Boolean(fraudTrace) || 
    reason_codes.includes('SUSPICIOUS_REFUND_PATTERN') || 
    reason_codes.includes('FRAUD_RISK_FLAGGED');

  // 2. legal_threat_detected
  const legalTrace = findTraceIndicator('legal_threat_detected');
  const hasLegalThreat = 
    Boolean(legalTrace) || 
    reason_codes.includes('LEGAL_THREAT_DETECTED');

  // 3. prompt_injection_detected
  const promptInjectionTrace = findTraceIndicator('prompt_injection_detected');
  const hasPromptInjection = 
    Boolean(promptInjectionTrace) || 
    reason_codes.includes('PROMPT_INJECTION_DEFENDED');

  // 4. otp_delivery_contradiction
  const otpTrace = findTraceIndicator('otp_delivery_contradiction');
  const hasOtpContradiction = 
    Boolean(otpTrace) || 
    reason_codes.includes('OTP_DELIVERY_CONTRADICTION');

  // 5. cross_account_access_denied
  const crossAccountTrace = findTraceIndicator('cross_account_access_denied');
  const hasCrossAccount = 
    Boolean(crossAccountTrace) || 
    reason_codes.includes('CROSS_ACCOUNT_ACCESS_DENIED');

  // 6. payment_unconfirmed
  const paymentTrace = findTraceIndicator('payment_unconfirmed');
  const hasPaymentIssue = 
    Boolean(paymentTrace) || 
    reason_codes.includes('PAYMENT_UNCONFIRMED');

  // 7. approval_threshold_exceeded
  const thresholdTrace = findTraceIndicator('approval_threshold_exceeded');
  const hasThresholdBreach = 
    Boolean(thresholdTrace) || 
    reason_codes.includes('APPROVAL_THRESHOLD_EXCEEDED');

  // Calculate Composite Risk Score (0 - 100)
  let computedScore = 5; // Nominal base
  if (hasLegalThreat) computedScore += 45;
  if (hasSuspiciousRefund) computedScore += 40;
  if (hasOtpContradiction) computedScore += 35;
  if (hasPromptInjection) computedScore += 30;
  if (hasCrossAccount) computedScore += 25;
  if (hasPaymentIssue) computedScore += 20;
  if (hasThresholdBreach) computedScore += 18;
  if (decision === 'ESCALATE' && computedScore < 55) computedScore = 65;
  if (decision === 'ACT' && computedScore > 25) computedScore = Math.min(computedScore, 20);

  const riskScore = Math.min(100, Math.max(0, computedScore));

  let riskTier: { label: string; color: string; bg: string; border: string; glow: string };
  if (riskScore >= 75) {
    riskTier = {
      label: 'CRITICAL THREAT',
      color: isDark ? 'text-rose-400' : 'text-rose-700',
      bg: isDark ? 'bg-rose-950/40' : 'bg-rose-50/70',
      border: isDark ? 'border-rose-500/50' : 'border-rose-200',
      glow: 'shadow-rose-500/20',
    };
  } else if (riskScore >= 50) {
    riskTier = {
      label: 'ELEVATED RISK',
      color: isDark ? 'text-amber-400' : 'text-amber-700',
      bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50/70',
      border: isDark ? 'border-amber-500/50' : 'border-amber-200',
      glow: 'shadow-amber-500/20',
    };
  } else if (riskScore >= 25) {
    riskTier = {
      label: 'GUARDED / MODERATE',
      color: isDark ? 'text-blue-400' : 'text-blue-700',
      bg: isDark ? 'bg-blue-950/40' : 'bg-blue-50/70',
      border: isDark ? 'border-blue-500/50' : 'border-blue-200',
      glow: 'shadow-blue-500/20',
    };
  } else {
    riskTier = {
      label: 'NOMINAL / SAFE',
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      bg: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50/70',
      border: isDark ? 'border-emerald-500/50' : 'border-emerald-200',
      glow: 'shadow-emerald-500/20',
    };
  }

  // Definition of real-time indicators
  const indicators: RiskIndicatorItem[] = [
    {
      id: 'suspicious_refund_pattern',
      name: 'Suspicious Refund Pattern',
      category: 'fraud',
      severity: 'critical',
      icon: ShieldAlert,
      detected: hasSuspiciousRefund,
      summary: hasSuspiciousRefund 
        ? 'High dispute velocity or flagged fraud risk score (≥ 0.70)' 
        : 'Customer risk profile within nominal limits',
      traceStep: fraudTrace?.step || 'Fraud & Risk Check',
      traceEvidence: fraudTrace ? JSON.stringify(fraudTrace.details) : undefined,
    },
    {
      id: 'legal_threat_detected',
      name: 'Legal Threat / Litigation',
      category: 'safety',
      severity: 'critical',
      icon: Scale,
      detected: hasLegalThreat,
      summary: hasLegalThreat 
        ? 'Litigation, attorney, or court action cited in user input' 
        : 'No legal threats or contentious terms identified',
      traceStep: legalTrace?.step || 'Input Safety Analysis',
      traceEvidence: legalTrace ? JSON.stringify(legalTrace.details) : undefined,
    },
    {
      id: 'prompt_injection_detected',
      name: 'Prompt Injection Override',
      category: 'safety',
      severity: 'high',
      icon: Terminal,
      detected: hasPromptInjection,
      summary: hasPromptInjection 
        ? 'Adversarial system prompt bypass or command injection neutralized' 
        : 'Input passes semantic boundaries cleanly',
      traceStep: promptInjectionTrace?.step || 'Input Safety Analysis',
      traceEvidence: promptInjectionTrace ? JSON.stringify(promptInjectionTrace.details) : undefined,
    },
    {
      id: 'otp_delivery_contradiction',
      name: 'OTP Delivery Contradiction',
      category: 'carrier',
      severity: 'critical',
      icon: Package,
      detected: hasOtpContradiction,
      summary: hasOtpContradiction 
        ? 'Non-delivery claim directly contradicts carrier verified OTP delivery' 
        : 'No conflicting carrier signature or OTP records',
      traceStep: otpTrace?.step || 'Delivery Dispute Verification',
      traceEvidence: otpTrace ? JSON.stringify(otpTrace.details) : undefined,
    },
    {
      id: 'cross_account_violation',
      name: 'Cross-Account Order Access',
      category: 'fraud',
      severity: 'high',
      icon: Lock,
      detected: hasCrossAccount,
      summary: hasCrossAccount 
        ? 'Target order belongs to an external customer; safely masked' 
        : 'Order ownership verified to authenticated account',
      traceStep: crossAccountTrace?.step || 'Security Boundary Enforcement',
      traceEvidence: crossAccountTrace ? JSON.stringify(crossAccountTrace.details) : undefined,
    },
    {
      id: 'approval_threshold_breach',
      name: 'Approval Threshold Exceeded',
      category: 'policy',
      severity: 'medium',
      icon: DollarSign,
      detected: hasThresholdBreach,
      summary: hasThresholdBreach 
        ? 'Requested refund exceeds automated supervisor threshold' 
        : 'Payout amount within automated governance cap',
      traceStep: thresholdTrace?.step || 'Approval Threshold Guard',
    },
    {
      id: 'payment_unconfirmed',
      name: 'Payment Gateway Pending',
      category: 'billing',
      severity: 'medium',
      icon: CreditCard,
      detected: hasPaymentIssue,
      summary: hasPaymentIssue 
        ? 'Order transaction status is pending or failed' 
        : 'Authoritative payment settlement completed',
      traceStep: paymentTrace?.step || 'Payment Verification',
    },
  ];

  // SVG Gauge calculations (Semi-circle from -180 deg to 0 deg)
  const radius = 62;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className={`p-4 rounded-xl border ${riskTier.bg} ${riskTier.border} shadow-lg ${riskTier.glow} transition-all duration-300`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border text-indigo-500 dark:text-indigo-400 ${
            isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              Real-Time Risk Assessment
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping inline-block" />
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Deterministic threat & fraud monitoring evaluated against trace logs
            </p>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase border shadow-sm ${riskTier.color} ${
          isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {riskTier.label}
        </div>
      </div>

      {/* Main Gauge & Metrics Row */}
      <div className={`flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl border mb-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Semi-Circle Speedometer Gauge */}
        <div className="relative flex flex-col items-center justify-center shrink-0 w-36 h-24">
          <svg className="w-36 h-24 overflow-visible" viewBox="0 0 160 95">
            {/* Background Arc */}
            <path
              d="M 15 85 A 65 65 0 0 1 145 85"
              fill="none"
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Colored Segment Guide */}
            <path
              d="M 15 85 A 65 65 0 0 1 145 85"
              fill="none"
              stroke="url(#riskGradient)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="45%" stopColor="#3b82f6" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Percentage Value */}
          <div className="absolute top-10 flex flex-col items-center">
            <span className={`text-2xl font-black tracking-tight ${riskTier.color}`}>
              {riskScore}%
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 -mt-1 tracking-widest">
              Threat Score
            </span>
          </div>
        </div>

        {/* Gauge Overview Details */}
        <div className="flex-1 w-full text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">Evaluated Trace Steps:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{trace.length} checks</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">Triggered Threat Flags:</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {indicators.filter(i => i.detected).length} Active
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">Autonomous Execution:</span>
            <span className={`font-semibold ${
              riskScore >= 75
                ? 'text-rose-600 dark:text-rose-400'
                : riskScore >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {riskScore >= 75 
                ? 'Blocked (Human Escalation)' 
                : riskScore >= 50 
                  ? 'Guarded Review' 
                  : 'Authorized Safe'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Indicators Matrix */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          <span>Evaluated Indicators ({indicators.filter(i => i.detected).length} Active)</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Highlighted from live trace</span>
        </div>

        <div className="space-y-1.5">
          {indicators.map((ind) => {
            const Icon = ind.icon;

            return (
              <div
                key={ind.id}
                className={`p-2.5 rounded-lg border transition-all text-xs flex items-start justify-between gap-3 ${
                  ind.detected
                    ? isDark
                      ? 'bg-rose-950/40 border-rose-500/70 text-slate-100 shadow-sm ring-1 ring-rose-500/40'
                      : 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm ring-1 ring-rose-300/40'
                    : isDark
                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-400 opacity-60'
                      : 'bg-white/80 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1 rounded-md shrink-0 mt-0.5 ${
                    ind.detected 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs ${
                        ind.detected ? 'text-rose-300 font-bold' : 'text-slate-300'
                      }`}>
                        {ind.name}
                      </span>
                      {ind.detected && (
                        <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          FLAGGED
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] mt-0.5 leading-snug ${
                      ind.detected ? 'text-slate-200' : 'text-slate-500'
                    }`}>
                      {ind.summary}
                    </div>

                    {ind.detected && ind.traceStep && (
                      <div className="mt-1 text-[10px] font-mono text-rose-300/80 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>Source Step: {ind.traceStep}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                    ind.detected
                      ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                      : 'bg-slate-800 text-slate-500 border-slate-700/60'
                  }`}>
                    {ind.detected ? ind.severity.toUpperCase() : 'CLEAR'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
