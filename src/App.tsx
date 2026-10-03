import React, { useState, useEffect } from 'react';
import { Customer, Order, SupportTicket, VersionedPolicy, ChatMessage, SupportAgentResponse } from './types';
import { Header } from './components/Header';
import { CustomerSelector } from './components/CustomerSelector';
import { ScenarioPicker, Scenario } from './components/ScenarioPicker';
import { ChatPanel } from './components/ChatPanel';
import { DecisionInspector } from './components/DecisionInspector';
import { ContextDrawer } from './components/ContextDrawer';
import { PolicyModal } from './components/PolicyModal';

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

  // Initial Data Load
  useEffect(() => {
    fetchCustomers();
    fetchPolicies();
  }, []);

  // Refresh context when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerContext(selectedCustomerId);
    }
  }, [selectedCustomerId]);

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

  const fetchCustomerContext = async (customerId: string) => {
    try {
      const res = await fetch(`/support/context/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTickets(data.tickets || []);

        // Seed initial greeting for the active customer
        if (messages.length === 0) {
          setMessages([
            {
              id: 'init-msg',
              sender: 'agent',
              text: `Hello ${data.customer?.name || 'Customer'}! I am NovaMart's AI Support Agent. I can provide order tracking, process refunds and returns under versioned policies, update eligible addresses, or transfer your case to human support when needed.`,
              timestamp: new Date().toISOString(),
              responseMeta: {
                decision: 'ANSWER',
                response: 'Greeting',
                reason_codes: ['AUTHENTICATED_SESSION_READY'],
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
        }),
      });

      const data: SupportAgentResponse = await res.json();
      setLastResponse(data);

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
        setMessages([
          {
            id: `reset-${Date.now()}`,
            sender: 'agent',
            text: 'System database has been reset to pristine seed state. All orders, tickets, and versioned policies restored.',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        onReset={handleResetDatabase}
        onOpenPolicies={() => setIsPolicyModalOpen(true)}
        isResetting={isResetting}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-4">
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
                text: `Switched active customer context to ${id}. Orders and policy history loaded.`,
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
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <DecisionInspector lastResponse={lastResponse} />
          </div>
        </div>

        {/* Authoritative Customer Data Drawer */}
        <div className="mt-4">
          <ContextDrawer
            customer={customers.find((c) => c.id === selectedCustomerId) || null}
            orders={orders}
            tickets={tickets}
          />
        </div>
      </main>

      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policies={policies}
      />

      <footer className="border-t border-slate-800 bg-slate-900/60 py-3 text-center text-xs text-slate-500">
        NovaMart AI Customer Support Agent • Safety-First Deterministic Engine • Port 3000
      </footer>
    </div>
  );
}
