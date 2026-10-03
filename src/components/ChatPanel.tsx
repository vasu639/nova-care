import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SupportAgentResponse, Order } from '../types';
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
  Clock
} from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSelectOption?: (optionText: string) => void;
  orders?: Order[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectOption,
  orders = [],
}) => {
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
            <CheckCircle2 className="h-3 w-3" /> ACT
          </span>
        );
      case 'ANSWER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
            <Info className="h-3 w-3" /> ANSWER
          </span>
        );
      case 'ASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <HelpCircle className="h-3 w-3" /> ASK
          </span>
        );
      case 'ESCALATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
            <ShieldAlert className="h-3 w-3" /> ESCALATE
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
    { label: '📦 Track My Order', prompt: 'Where is my order NM-1001?' },
    { label: '💰 Refund Request', prompt: 'Refund NM-1001 for ₹10000' },
    { label: '🔄 Return Items', prompt: 'What is the return window for my orders?' },
    { label: '🛡️ Policy Questions', prompt: 'What is your electronics return and restocking policy?' },
  ];

  return (
    <div className="flex flex-col h-[640px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* AI Bot Persona Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">Nova</span>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                AI Support Agent
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                Gemini 3.8 Flash
              </span>
              <span>•</span>
              <span className="text-emerald-400">Deterministic Safety Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendMessage('What orders do I have in my account?')}
            className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Package className="h-3 w-3 text-indigo-400" />
            <span>My Orders</span>
          </button>
        </div>
      </div>

      {/* Quick Action Chips Bar */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 mr-1">Suggested:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(qp.prompt)}
            disabled={isLoading}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-indigo-950 hover:text-indigo-200 text-slate-300 border border-slate-700/80 hover:border-indigo-700/60 transition disabled:opacity-50 shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const meta = msg.responseMeta;
          const refOrder = !isUser ? getReferencedOrder(msg.text) : null;
          const refundAction = meta?.actions?.find((a) => a.type === 'REFUND_CREATED');

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-emerald-500/20 border border-indigo-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                }`}
              >
                {/* Agent Header Metadata */}
                {!isUser && meta && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      {renderDecisionBadge(meta.decision)}

                      {meta.policy_version && (
                        <span className="text-[10px] font-mono text-indigo-300 bg-slate-900/90 px-2 py-0.5 rounded-md border border-indigo-900/50">
                          {meta.policy_version}
                        </span>
                      )}
                    </div>

                    {meta.ticket && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-800/60 shadow-xs">
                        <Ticket className="h-3 w-3" /> #{meta.ticket.id}
                      </span>
                    )}
                  </div>
                )}

                {/* Primary Message Text */}
                <p className="whitespace-pre-wrap leading-relaxed text-[13px] text-slate-100">
                  {msg.text}
                </p>

                {/* Inline Referenced Order Card */}
                {!isUser && refOrder && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-indigo-300">
                        <Package className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Order {refOrder.id}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${
                        refOrder.status === 'delivered'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : 'bg-blue-950/80 text-blue-300 border-blue-800'
                      }`}>
                        {refOrder.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-medium">
                      {refOrder.items?.[0]?.product_name || 'NovaMart Item'} • ₹{refOrder.total_amount.toLocaleString('en-IN')}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                      <span>Courier: {refOrder.courier}</span>
                      <span>Snapshot: {refOrder.policy_snapshot_date}</span>
                    </div>
                  </div>
                )}

                {/* Inline Refund Receipt Card */}
                {!isUser && refundAction && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Refund Receipt Authorized
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                        ₹{(refundAction.payload as { amount?: number })?.amount?.toFixed(2) || '2,280.00'}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-300/80 leading-tight">
                      Credit destination: Original payment method • Estimated in 3–5 business days.
                    </div>
                  </div>
                )}

                {/* Inline Escalation Card */}
                {!isUser && meta?.ticket && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                        <Ticket className="h-4 w-4 text-amber-400" />
                        Human Support Case Assigned
                      </span>
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-300 bg-amber-900/60 px-1.5 py-0.2 rounded">
                        {meta.ticket.priority} Priority
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300/80">
                      Case #{meta.ticket.id} dispatched to <strong>{meta.ticket.issue_type}</strong>. A specialist will follow up shortly.
                    </div>
                  </div>
                )}

                {/* Interactive Clarification Option Buttons */}
                {!isUser && meta?.clarification_options && (
                  <div className="mt-3.5 pt-3 border-t border-slate-700/70 space-y-2">
                    <p className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                      Please select an order to continue:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {meta.clarification_options.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => onSelectOption && onSelectOption(`Order ${opt.id}`)}
                          className="flex items-center justify-between text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white transition group shadow-sm active:scale-[0.99]"
                        >
                          <div>
                            <div className="font-bold text-xs text-indigo-300 group-hover:text-indigo-200">
                              {opt.label}
                            </div>
                            {opt.details && (
                              <div className="text-[11px] text-slate-400 mt-0.5">{opt.details}</div>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason Codes Pills */}
                {!isUser && meta?.reason_codes && meta.reason_codes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-slate-700/40">
                    {meta.reason_codes.map((rc) => (
                      <span
                        key={rc}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/90 text-indigo-300 border border-slate-700/60"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bubble Footer & Actions */}
                <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/30">
                  <div className="flex items-center gap-2">
                    {!isUser && (
                      <>
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className="hover:text-indigo-300 flex items-center gap-1 transition"
                          title="Read out loud"
                        >
                          {isSpeaking === msg.id ? (
                            <>
                              <VolumeX className="h-3 w-3 text-amber-400" />
                              <span className="text-amber-400">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-indigo-300 flex items-center gap-1 transition"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-300 text-xs">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 animate-spin text-emerald-400" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-slate-200 font-medium text-xs">
                Nova is evaluating orders & versioned policies...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Send & Quick Actions */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/95 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova anything (e.g. 'Refund NM-1001 for ₹10000' or 'Track my speaker')..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-slate-700/90 text-slate-100 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none disabled:opacity-50 placeholder:text-slate-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:hover:from-indigo-600 disabled:hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/30"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
