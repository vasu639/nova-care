export interface SafetyAnalysis {
  isSafe: boolean;
  hasPromptInjection: boolean;
  hasLegalThreat: boolean;
  hasSelfHarm: boolean;
  hasHarassment: boolean;
  hasAdversarialOverride: boolean;
  riskReasons: string[];
  sanitizedInput: string;
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|commands)/i,
  /disregard\s+(all\s+)?(previous|prior|system|policy)\s+(rules|prompts|instructions)/i,
  /forget\s+(all\s+)?(instructions|rules|boundaries|guidelines)/i,
  /you\s+are\s+now\s+(an?\s+)?(admin|root|system|developer|override|unrestricted|god\s+mode)/i,
  /system\s*:\s*override/i,
  /bypass\s+(all\s+)?(policy|policies|checks|verification|rules|approval)/i,
  /approve\s+([₹$€£]|inr\s*|rs\.?\s*)?\s*(\d{4,9})/i,
  /grant\s+(me\s+)?(admin|refund|access|superuser)/i,
  /jailbreak/i,
  /do\s+anything\s+now|dan\s+mode/i,
  /switch\s+to\s+developer\s+mode/i,
  /hidden\s+instruction|system\s+prompt/i,
  /output\s+(the\s+)?(system\s+prompt|secret\s+key|internal\s+instructions)/i,
  /<\/?system>/i,
  /<\/?instruction>/i,
  /```\s*system/i,
];

const LEGAL_THREAT_PATTERNS = [
  /\b(sue|suing|lawyer|attorney|lawsuit|litigation|court|consumer\s+forum|consumer\s+court|legal\s+notice|legal\s+action|fir|police\s+complaint|advocate)\b/i,
];

const SELF_HARM_PATTERNS = [
  /\b(kill\s+myself|commit\s+suicide|end\s+my\s+life|hang\s+myself|harm\s+myself|suicidal)\b/i,
];

const HARASSMENT_PATTERNS = [
  /\b(idiot|moron|bastard|scammer|thief|fraudster|piece\s+of\s+shit|go\s+to\s+hell|f\*\*\*|fuck\s+you|bitch)\b/i,
];

export function analyzeSafety(rawMessage: string): SafetyAnalysis {
  const trimmed = (rawMessage || '').trim();
  const riskReasons: string[] = [];

  let hasPromptInjection = false;
  let hasLegalThreat = false;
  let hasSelfHarm = false;
  let hasHarassment = false;
  let hasAdversarialOverride = false;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      hasPromptInjection = true;
      hasAdversarialOverride = true;
      riskReasons.push(`PROMPT_INJECTION_DETECTED: Matched pattern ${pattern}`);
      break;
    }
  }

  for (const pattern of LEGAL_THREAT_PATTERNS) {
    if (pattern.test(trimmed)) {
      hasLegalThreat = true;
      riskReasons.push(`LEGAL_THREAT_DETECTED: Message contains legal escalation terms`);
      break;
    }
  }

  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(trimmed)) {
      hasSelfHarm = true;
      riskReasons.push(`SAFETY_ALERT_SELF_HARM: Message contains distress/harm terminology`);
      break;
    }
  }

  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      hasHarassment = true;
      riskReasons.push(`HARASSMENT_DETECTED: Abusive or hostile phrasing`);
      break;
    }
  }

  // Sanitize text by stripping control characters and dangerous markup
  const sanitized = trimmed
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .substring(0, 1000);

  const isSafe = !hasPromptInjection && !hasLegalThreat && !hasSelfHarm && !hasHarassment;

  return {
    isSafe,
    hasPromptInjection,
    hasLegalThreat,
    hasSelfHarm,
    hasHarassment,
    hasAdversarialOverride,
    riskReasons,
    sanitizedInput: sanitized,
  };
}
