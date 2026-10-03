import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SupportAgentResponse, Order, SupportedLanguage, ActionPreview } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { RefundPreviewCard } from './RefundPreviewCard';
import { DecisionExplanationPanel } from './DecisionExplanationPanel';
import { 
  Send, 
  Bot, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  Ticket, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  ShieldCheck,
  Clock,
  UserCheck,
  Layers
} from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSelectOption?: (optionText: string) => void;
  orders?: Order[];
  language: SupportedLanguage;
  isDark?: boolean;
  onConfirmRefund?: (preview: ActionPreview) => Promise<void>;
  onWhyPolicy?: (version: string) => void;
  onOpenHandoff?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectOption,
  orders = [],
  language,
  isDark = true,
  onConfirmRefund,
  onWhyPolicy,
  onOpenHandoff,
}) => {
  const t = TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedChecksMessageId, setExpandedChecksMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  const renderDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    switch (decision) {
      case 'ACT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> {t.decisionAct}
          </span>
        );
      case 'ANSWER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
            <Info className="h-3 w-3" /> {t.decisionAnswer}
          </span>
        );
      case 'ASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <HelpCircle className="h-3 w-3" /> {t.decisionAsk}
          </span>
        );
      case 'ESCALATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
            <ShieldAlert className="h-3 w-3" /> {t.decisionEscalate}
          </span>
        );
      default:
        return null;
    }
  };

  // Find order if referenced in text or actions
  const getReferencedOrder = (text: string) => {
    const match = text.match(/\b(NM-\d{4})\b/i);
    if (!match) return null;
    const orderId = match[1].toUpperCase();
    return orders.find((o) => o.id === orderId) || null;
  };

  const quickPrompts = [
    { label: t.quickActionTrack, prompt: 'Where is my order NM-1001?' },
    { label: t.quickActionReturn, prompt: 'Refund NM-1001 for ₹10000' },
    { label: t.quickActionAgent, prompt: 'I want to talk to our support agent directly' },
    { label: t.quickActionPolicies, prompt: 'What should be the store return and refund policies?' },
  ];

  return (
    <div
      className={`flex flex-col h-[640px] rounded-2xl overflow-hidden shadow-xl border transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}
    >
      {/* AI Bot Persona Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800'
            : 'bg-gradient-to-r from-slate-50 via-slate-50 to-indigo-50/50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div
                className={`h-full w-full rounded-[10px] flex items-center justify-center ${
                  isDark ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <Bot className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nova
              </span>
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                AI Specialist
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-300">
                <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                Gemini 3.8 Flash
              </span>
              <span>•</span>
              <span className="text-emerald-500">Deterministic Safety Active</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {onOpenHandoff && (
            <button
              onClick={onOpenHandoff}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.talkToSpecialist}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isDark ? 'bg-slate-900/90' : 'bg-slate-50/50'
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const meta = msg.responseMeta;
          const refOrder = !isUser ? getReferencedOrder(msg.text) : null;
          const isChecksExpanded = expandedChecksMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-emerald-500/20 border border-indigo-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                    : isDark
                      ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-slate-200/50 rounded-tl-xs'
                }`}
              >
                {/* Agent Header Metadata */}
                {!isUser && meta && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      {renderDecisionBadge(meta.decision)}

                      {meta.policy_version && (
                        <span className="text-[10px] font-mono bg-indigo-50 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/50">
                          {meta.policy_version}
                        </span>
                      )}
                    </div>

                    {meta.ticket && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 shadow-xs">
                        <Ticket className="h-3 w-3" /> #{meta.ticket.id}
                      </span>
                    )}
                  </div>
                )}

                {/* Primary Message Text */}
                <p className="whitespace-pre-wrap leading-relaxed text-[13px]">
                  {msg.text}
                </p>

                {/* FEATURE 2: Refund & Return Preview Card with Explicit Confirmation */}
                {!isUser && meta?.action_preview && onConfirmRefund && (
                  <div className="mt-3.5">
                    <RefundPreviewCard
                      preview={meta.action_preview}
                      language={language}
                      isDark={isDark}
                      onConfirm={onConfirmRefund}
                      onWhyPolicy={onWhyPolicy}
                    />
                  </div>
                )}

                {/* FEATURE 1: Decision Explanation Panel ("What we checked") */}
                {!isUser && meta?.what_we_checked && meta.what_we_checked.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60">
                    <button
                      onClick={() => setExpandedChecksMessageId(isChecksExpanded ? null : msg.id)}
                      className={`flex items-center justify-between w-full p-2 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border-slate-700/50'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>{t.whatWeCheckedTitle}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          {meta.what_we_checked.filter((i) => i.status === 'verified').length}/{meta.what_we_checked.length}
                        </span>
                      </span>
                      {isChecksExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isChecksExpanded && (
                      <div className="mt-2.5">
                        <DecisionExplanationPanel
                          items={meta.what_we_checked}
                          policyVersion={meta.policy_version}
                          language={language}
                          isDark={isDark}
                          onWhyPolicy={onWhyPolicy}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Referenced Order Card */}
                {!isUser && refOrder && !meta?.action_preview && (
                  <div className={`mt-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-900/80 border-slate-700/70 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-indigo-600 dark:text-indigo-300">
                        <Package className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>Order {refOrder.id}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${
                        refOrder.status === 'delivered'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        {refOrder.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      {refOrder.items?.[0]?.product_name || 'NovaMart Item'} • ₹{refOrder.total_amount.toLocaleString('en-IN')}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                      <span>Courier: {refOrder.courier}</span>
                      <span>Snapshot: {refOrder.policy_snapshot_date}</span>
                    </div>
                  </div>
                )}

                {/* Interactive Clarification Option Buttons */}
                {!isUser && meta?.clarification_options && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/70 space-y-2">
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Suggested Quick Options:</span>
                    </p>

                    <div className="flex flex-col gap-1.5">
                      {meta.clarification_options.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (onSelectOption) {
                              onSelectOption(opt.label);
                            } else {
                              onSendMessage(opt.label);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] ${
                            isDark
                              ? 'bg-slate-900/80 hover:bg-indigo-950/70 border-slate-700/80 hover:border-indigo-600/70'
                              : 'bg-slate-50 hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs text-indigo-700 dark:text-indigo-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                              {opt.label}
                            </div>
                            {opt.details && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {opt.details}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Utilities */}
                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className={`hover:text-slate-200 transition flex items-center gap-1 cursor-pointer ${
                        isSpeaking === msg.id ? 'text-indigo-400 animate-pulse' : ''
                      }`}
                      title="Read aloud"
                    >
                      {isSpeaking === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                  </div>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600 shadow-sm'
            }`}>
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className={`p-3 rounded-2xl border flex items-center gap-2 ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Nova is evaluating policy & deterministic evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div
        className={`px-4 py-2 border-t flex items-center gap-1.5 overflow-x-auto text-xs ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">
          Quick Starters:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(qp.prompt)}
            disabled={isLoading}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs'
            }`}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className={`p-3 border-t flex items-end gap-2 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'hi'
                ? 'अपना संदेश यहाँ लिखें (उदा. NM-1001 रिफंड करें)...'
                : language === 'mr'
                  ? 'आपला संदेश येथे टाइप करा (उदा. NM-1001 परतावा करा)...'
                  : 'Type your message (e.g. Refund NM-1001 for ₹10000)...'
            }
            rows={2}
            className={`w-full p-2.5 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              isDark
                ? 'bg-slate-800/90 text-slate-100 placeholder-slate-500 border border-slate-700'
                : 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-300'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
