import React, { useState } from 'react';
import { Customer, Order, SupportTicket } from '../types';
import { Package, Ticket, Clock, ShieldCheck, CheckCircle2, AlertCircle, MapPin, Truck } from 'lucide-react';

interface ContextDrawerProps {
  customer: Customer | null;
  orders: Order[];
  tickets: SupportTicket[];
}

export const ContextDrawer: React.FC<ContextDrawerProps> = ({ customer, orders, tickets }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets'>('orders');

  if (!customer) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-2.5 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'tickets'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="h-3.5 w-3.5" />
          <span>Support Tickets ({tickets.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3 overflow-y-auto space-y-2.5 flex-1 max-h-[500px] text-xs">
        {activeTab === 'orders' && (
          <div className="space-y-2.5">
            {orders.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No orders found.</div>
            ) : (
              orders.map((o) => {
                let statusBadge = 'bg-blue-950/60 text-blue-300 border-blue-800';
                if (o.status === 'delivered') statusBadge = 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
                if (o.status === 'pending_payment') statusBadge = 'bg-amber-950/60 text-amber-300 border-amber-800';

                return (
                  <div
                    key={o.id}
                    className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100">{o.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${statusBadge}`}>
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-200">
                        ₹{o.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Items */}
                    {o.items && o.items.length > 0 && (
                      <div className="mb-2 space-y-0.5">
                        {o.items.map((it) => (
                          <div key={it.id} className="text-slate-300 font-medium text-[11px]">
                            {it.quantity}x {it.product_name || 'Product'} (₹{it.unit_price})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata tags */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-700/50">
                      <div>Placed: {o.placed_at.slice(0, 10)}</div>
                      <div>Snapshot: <span className="font-mono text-indigo-300">{o.policy_snapshot_date}</span></div>
                      <div>Payment: <span className="capitalize">{o.payment_status}</span> ({o.payment_method})</div>
                      <div>
                        OTP Verified:{' '}
                        {o.delivery_otp_verified ? (
                          <span className="text-emerald-400 font-semibold">Yes (Secure)</span>
                        ) : (
                          <span>No</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-start gap-1">
                      <Truck className="h-3 w-3 shrink-0 text-slate-500 mt-0.5" />
                      <span className="truncate">{o.courier} ({o.tracking_number})</span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500 flex items-start gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-500 mt-0.5" />
                      <span className="truncate">{o.shipping_address}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No active support tickets for this customer.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/70"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-amber-300">{t.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
                      {t.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200 text-xs mb-1">{t.issue_type}</div>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{t.reason}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-700/50 pt-1.5">
                    <span>Status: {t.status}</span>
                    <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
