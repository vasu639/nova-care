import React, { useState, useEffect } from 'react';
import { 
  Customer, 
  Order, 
  SupportTicket, 
  VersionedPolicy, 
  ChatMessage, 
  SupportAgentResponse, 
  SupportedLanguage,
  ActionPreview,
  CustomerNotification
} from './types';
import { TRANSLATIONS } from './i18n/translations';
import { Header } from './components/Header';
import { CustomerSelector } from './components/CustomerSelector';
import { ScenarioPicker, Scenario } from './components/ScenarioPicker';
import { ChatPanel } from './components/ChatPanel';
import { DecisionInspector } from './components/DecisionInspector';
import { ContextDrawer } from './components/ContextDrawer';
import { PolicyModal } from './components/PolicyModal';
import { SecurityBadge } from './components/SecurityBadge';
import { NotificationsBanner } from './components/NotificationsBanner';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { PolicyExplainerModal } from './components/PolicyExplainerModal';
import { HumanHandoffModal } from './components/HumanHandoffModal';

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('C-100');
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [policies, setPolicies] = useState<VersionedPolicy[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<SupportAgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [explainingPolicyVersion, setExplainingPolicyVersion] = useState<string | null>(null);
  const [isHandoffOpen, setIsHandoffOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  // Multilingual State (English, Hindi, Marathi)
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('novamart_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    return 'en';
  });
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(() => {
    return !localStorage.getItem('novamart_language');
  });

  // Dark/Light Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('novamart_theme');
    if (saved === 'light') return false;
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('novamart_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Initial Data Load
  useEffect(() => {
    fetchCustomers();
    fetchPolicies();
  }, []);

  // Refresh context when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerContext(selectedCustomerId);
      fetchCustomerNotifications(selectedCustomerId);
    }
  }, [selectedCustomerId, language]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/support/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/support/policies');
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  };

  const fetchCustomerNotifications = async (customerId: string) => {
    try {
      const res = await fetch(`/support/notifications/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const fetchCustomerContext = async (customerId: string) => {
    try {
      const res = await fetch(`/support/context/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTickets(data.tickets || []);

        const t = TRANSLATIONS[language];
        const custName = data.customer?.name || 'Customer';

        // Seed initial greeting in selected language
        if (messages.length === 0) {
          const initialGreetingText = 
            language === 'hi'
              ? `नमस्ते ${custName}! 👋 मैं नोवा हूँ, आपका इंटरएक्टिव एआई ग्राहक सहायता विशेषज्ञ (Powered by Gemini 3.8 Flash)।\n\n• ${t.initialQuestion1}\n• ${t.initialQuestion2}\n• ${t.initialQuestion3}\n• ${t.initialQuestion4}\n\nनीचे दिए गए त्वरित विकल्पों में से चुनें या अपनी आवश्यकता लिखें!`
              : language === 'mr'
                ? `नमस्कार ${custName}! 👋 मी नोव्हा आहे, आपला संवादात्मक एआय ग्राहक सेवा विशेषज्ञ (Powered by Gemini 3.8 Flash).\n\n• ${t.initialQuestion1}\n• ${t.initialQuestion2}\n• ${t.initialQuestion3}\n• ${t.initialQuestion4}\n\nखालील पर्यायांमधून निवडा किंवा आपली आवश्यकता टाइप करा!`
                : `Hello ${custName}! 👋 I am Nova, your interactive AI Customer Support Specialist (powered by Gemini 3.8 Flash).\n\n• ${t.initialQuestion1}\n• ${t.initialQuestion2}\n• ${t.initialQuestion3}\n• ${t.initialQuestion4}\n\nSelect a quick option below or type what you need!`;

          setMessages([
            {
              id: 'init-msg',
              sender: 'agent',
              text: initialGreetingText,
              timestamp: new Date().toISOString(),
              responseMeta: {
                decision: 'ANSWER',
                response: 'Greeting',
                reason_codes: ['AUTHENTICATED_SESSION_READY', 'INTERACTIVE_GREETING_ACTIVE'],
                policy_version: 'ELECTRONICS-2026.1',
                evidence: {
                  customer_verified: true,
                  order_verified: false,
                  ownership_verified: false,
                  payment_verified: false,
                  delivery_verified: false,
                  policy_verified: true,
                  window_verified: false,
                  refund_amount_verified: false,
                },
                actions: [],
                clarification_options: {
                  type: 'actions',
                  options: [
                    { id: 'track_order', label: t.quickActionTrack, details: 'Check real-time delivery status & tracking' },
                    { id: 'start_return', label: t.quickActionReturn, details: 'Compute 5% restocking fee & return window' },
                    { id: 'talk_agent', label: t.quickActionAgent, details: 'Instant priority transfer to human care specialist' },
                    { id: 'store_policies', label: t.quickActionPolicies, details: 'Review active Electronics & Apparel rules' },
                  ],
                },
                trace: [
                  {
                    step: 'Session Initialized',
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    details: { customerId, email: data.customer?.email, riskScore: data.customer?.risk_score },
                  },
                ],
              },
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch context:', err);
    }
  };

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('novamart_language', lang);
    setShowLanguageModal(false);

    // Add confirmation message
    const t = TRANSLATIONS[lang];
    const greetingText = 
      lang === 'hi'
        ? `भाषा बदलकर हिंदी कर दी गई है। ${t.initialQuestion1}`
        : lang === 'mr'
          ? `भाषा बदलून मराठी केली आहे. ${t.initialQuestion1}`
          : `Language switched to English. ${t.initialQuestion1}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `lang-switch-${Date.now()}`,
        sender: 'agent',
        text: greetingText,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          message: text,
          language,
        }),
      });

      const data: SupportAgentResponse = await res.json();
      setLastResponse(data);

      if (data.proactive_notifications) {
        setNotifications(data.proactive_notifications);
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.response,
        timestamp: new Date().toISOString(),
        responseMeta: data,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Refresh context after any mutation
      fetchCustomerContext(selectedCustomerId);
    } catch (err) {
      console.error('Failed to communicate with agent:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: 'Sorry, a network or system error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // FEATURE 2: Explicit Confirmation for Refund and Return
  const handleConfirmRefund = async (preview: ActionPreview) => {
    setIsLoading(true);
    try {
      const res = await fetch('/support/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          order_id: preview.order_id,
          action_type: preview.type,
          case_id: preview.case_id,
          language,
        }),
      });

      if (res.ok) {
        const data: SupportAgentResponse = await res.json();
        setLastResponse(data);

        const confirmMsg: ChatMessage = {
          id: `confirmed-${Date.now()}`,
          sender: 'agent',
          text: data.response,
          timestamp: new Date().toISOString(),
          responseMeta: data,
        };

        setMessages((prev) => [...prev, confirmMsg]);
        fetchCustomerContext(selectedCustomerId);
        fetchCustomerNotifications(selectedCustomerId);
      }
    } catch (err) {
      console.error('Failed to confirm refund:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // FEATURE 5: Direct Human Handoff with Full Context
  const handleConfirmHandoff = async (note: string) => {
    const handoffMessage = `I want to talk to our support agent directly.${note ? ' Note: ' + note : ''}`;
    await handleSendMessage(handoffMessage);
  };

  const handleSelectScenario = (scenario: Scenario) => {
    if (scenario.suggestedCustomerId !== selectedCustomerId) {
      setSelectedCustomerId(scenario.suggestedCustomerId);
    }
    handleSendMessage(scenario.message);
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/support/reset', { method: 'POST' });
      if (res.ok) {
        await fetchCustomers();
        await fetchCustomerContext(selectedCustomerId);
        await fetchPolicies();
        await fetchCustomerNotifications(selectedCustomerId);
        setMessages([
          {
            id: `reset-${Date.now()}`,
            sender: 'agent',
            text: 'System database has been reset to pristine seed state. All orders, tickets, evidence, and versioned policies restored.',
            timestamp: new Date().toISOString(),
          },
        ]);
        setLastResponse(null);
      }
    } catch (err) {
      console.error('Failed to reset DB:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Global Header */}
      <Header
        onReset={handleResetDatabase}
        onOpenPolicies={() => setIsPolicyModalOpen(true)}
        onOpenHandoff={() => setIsHandoffOpen(true)}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        isResetting={isResetting}
        language={language}
        onLanguageChange={handleLanguageSelect}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* FEATURE 8: Security & Privacy Status Banner */}
        <SecurityBadge
          customer={activeCustomer}
          maskedPayment={lastResponse?.masked_payment || '•••• 4821 via UPI'}
          language={language}
          isDark={isDark}
        />

        {/* FEATURE 7: Proactive Status Updates Banner */}
        {notifications.length > 0 && (
          <NotificationsBanner
            notifications={notifications}
            language={language}
            isDark={isDark}
          />
        )}

        {/* Customer Context Selector */}
        <CustomerSelector
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setMessages((prev) => [
              ...prev,
              {
                id: `switch-${Date.now()}`,
                sender: 'agent',
                text: `Switched active customer context to ${id}. Orders, verified evidence, and policy snapshots loaded.`,
                timestamp: new Date().toISOString(),
              },
            ]);
          }}
          orderCount={orders.length}
          ticketCount={tickets.length}
        />

        {/* Suggested Scenarios */}
        <ScenarioPicker
          onSelectScenario={handleSelectScenario}
          currentCustomerId={selectedCustomerId}
        />

        {/* Main Agent Workspace: Chat + Decision Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSelectOption={(optionText) => handleSendMessage(optionText)}
              orders={orders}
              language={language}
              isDark={isDark}
              onConfirmRefund={handleConfirmRefund}
              onWhyPolicy={(version) => setExplainingPolicyVersion(version)}
              onOpenHandoff={() => setIsHandoffOpen(true)}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <DecisionInspector
              lastResponse={lastResponse}
              language={language}
              isDark={isDark}
              onWhyPolicy={(version) => setExplainingPolicyVersion(version)}
            />
          </div>
        </div>

        {/* Authoritative Customer Data Drawer */}
        <div className="mt-4">
          <ContextDrawer
            customer={activeCustomer}
            orders={orders}
            tickets={tickets}
          />
        </div>
      </main>

      {/* Language Selector Modal on first turn or language switch */}
      <LanguageSelectorModal
        isOpen={showLanguageModal}
        onSelect={handleLanguageSelect}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={language}
        isDark={isDark}
      />

      {/* FEATURE 6: Policy Explainer Modal ("Why?") */}
      <PolicyExplainerModal
        isOpen={Boolean(explainingPolicyVersion)}
        onClose={() => setExplainingPolicyVersion(null)}
        policyVersion={explainingPolicyVersion}
        policies={policies}
        language={language}
        isDark={isDark}
      />

      {/* FEATURE 5: Human Handoff Modal ("Talk to a specialist") */}
      <HumanHandoffModal
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        customer={activeCustomer}
        orders={orders}
        lastResponse={lastResponse}
        language={language}
        isDark={isDark}
        onConfirmHandoff={handleConfirmHandoff}
      />

      {/* All Store Policies Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policies={policies}
      />

      <footer
        className={`border-t py-3.5 text-center text-xs transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/60 text-slate-500'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        NovaMart AI Customer Support Desk • Safety-First Deterministic Engine • Port 3000 • Multilingual (EN, HI, MR)
      </footer>
    </div>
  );
}
