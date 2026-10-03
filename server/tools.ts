import { Customer, Order, OrderItem, VersionedPolicy, Evidence, SupportTicket, RefundRecord, ReturnRecord, ConversationMessage } from './types.js';
import { queryAll, queryOne, run } from './database.js';

export interface RefundEligibilityResult {
  eligible: boolean;
  order_id: string;
  order_total: number;
  requested_amount: number;
  restocking_percent: number;
  restocking_fee: number;
  max_refundable: number;
  approved_amount: number;
  is_capped: boolean;
  days_since_delivery: number | null;
  return_window_days: number;
  window_expired: boolean;
  requires_human_approval: boolean;
  approval_threshold: number;
  reasons: string[];
}

/**
 * 1. get_customer(customer_id)
 * Fetches authoritative customer profile
 */
export function get_customer(customer_id: string): Customer | null {
  const row = queryOne<Customer>(`SELECT * FROM customers WHERE id = ?`, [customer_id]);
  return row;
}

/**
 * 2. get_order(order_id, customer_id)
 * Scoped strictly to the customer. Prevents cross-account data leakage.
 */
export function get_order(order_id: string, customer_id: string): Order | null {
  const cleanOrderId = order_id.trim().toUpperCase();
  const order = queryOne<Order>(
    `SELECT * FROM orders WHERE id = ? AND customer_id = ?`,
    [cleanOrderId, customer_id]
  );

  if (!order) return null;

  // Populate items
  const items = queryAll<OrderItem>(
    `SELECT oi.*, p.name as product_name, p.category 
     FROM order_items oi 
     JOIN products p ON oi.product_id = p.id 
     WHERE oi.order_id = ?`,
    [order.id]
  );
  order.items = items;
  order.delivery_otp_verified = Boolean(order.delivery_otp_verified);

  return order;
}

/**
 * Checks if order exists anywhere in the database (strictly for internal audit/cross-account defense, never exposed to user)
 */
export function check_order_exists_globally(order_id: string): { exists: boolean; belongs_to_other: boolean; owner_id?: string } {
  const cleanOrderId = order_id.trim().toUpperCase();
  const row = queryOne<{ customer_id: string }>(`SELECT customer_id FROM orders WHERE id = ?`, [cleanOrderId]);
  if (!row) {
    return { exists: false, belongs_to_other: false };
  }
  return { exists: true, belongs_to_other: true, owner_id: row.customer_id };
}

/**
 * 3. get_context(customer_id)
 * Gathers complete server-side customer context
 */
export function get_context(customer_id: string): {
  customer: Customer | null;
  orders: Order[];
  tickets: SupportTicket[];
  recent_conversations: ConversationMessage[];
  active_policies: VersionedPolicy[];
} {
  const customer = get_customer(customer_id);
  const orders = queryAll<Order>(
    `SELECT * FROM orders WHERE customer_id = ? ORDER BY placed_at DESC`,
    [customer_id]
  );

  for (const o of orders) {
    o.delivery_otp_verified = Boolean(o.delivery_otp_verified);
    o.items = queryAll<OrderItem>(
      `SELECT oi.*, p.name as product_name, p.category 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [o.id]
    );
  }

  const tickets = queryAll<SupportTicket>(
    `SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC`,
    [customer_id]
  );

  const recent_conversations = queryAll<ConversationMessage>(
    `SELECT * FROM conversations WHERE customer_id = ? ORDER BY timestamp DESC LIMIT 20`,
    [customer_id]
  );

  const active_policies = queryAll<VersionedPolicy>(
    `SELECT * FROM versioned_policies ORDER BY category ASC, effective_from DESC`
  );

  return { customer, orders, tickets, recent_conversations, active_policies };
}

/**
 * 4. get_applicable_policy(category, policy_date)
 * Selects versioned policy matching category and the order's policy snapshot date.
 */
export function get_applicable_policy(category: string, policy_date: string): VersionedPolicy | null {
  // Normalize date string (e.g. '2026-09-26' or '2026-09-26T10:00:00Z')
  const dateStr = policy_date.substring(0, 10);

  const policy = queryOne<VersionedPolicy>(
    `SELECT * FROM versioned_policies 
     WHERE category = ? 
       AND effective_from <= ? 
       AND (effective_to IS NULL OR effective_to >= ?)
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [category, dateStr, dateStr]
  );

  if (policy) {
    policy.allow_opened_items = Boolean(policy.allow_opened_items);
    return policy;
  }

  // Fallback to latest category policy if snapshot date was outside bounds
  const fallback = queryOne<VersionedPolicy>(
    `SELECT * FROM versioned_policies WHERE category = ? ORDER BY effective_from DESC LIMIT 1`,
    [category]
  );
  if (fallback) fallback.allow_opened_items = Boolean(fallback.allow_opened_items);
  return fallback;
}

/**
 * 5. check_refund_eligibility(order, policy, requested_amount)
 * Computes deterministic decimal arithmetic:
 * approved_refund = min(requested_amount, order_total - restocking_fee)
 */
export function check_refund_eligibility(
  order: Order,
  policy: VersionedPolicy,
  requested_amount?: number
): RefundEligibilityResult {
  const reasons: string[] = [];
  const now = new Date('2026-10-03T08:00:00Z'); // Fixed authoritative reference time matching environment

  let daysSinceDelivery: number | null = null;
  let windowExpired = false;

  if (order.delivered_at) {
    const deliveryDate = new Date(order.delivered_at);
    const diffMs = now.getTime() - deliveryDate.getTime();
    daysSinceDelivery = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (daysSinceDelivery > policy.return_window_days) {
      windowExpired = true;
      reasons.push(
        `RETURN_WINDOW_EXPIRED: Order was delivered ${daysSinceDelivery} days ago (allowed window: ${policy.return_window_days} days under policy ${policy.version})`
      );
    }
  } else if (order.status !== 'cancelled' && order.status !== 'in_transit') {
    reasons.push(`DELIVERY_UNCONFIRMED: Order has not been marked delivered`);
  }

  if (order.payment_status !== 'completed') {
    reasons.push(`PAYMENT_NOT_COMPLETED: Order payment status is ${order.payment_status}`);
  }

  // Decimal calculations
  const orderTotal = Math.round(order.total_amount * 100) / 100;
  const restockingPercent = policy.restocking_percent;
  const restockingFee = Math.round(((orderTotal * restockingPercent) / 100) * 100) / 100;
  const maxRefundable = Math.max(0, Math.round((orderTotal - restockingFee) * 100) / 100);

  // If user requested a specific amount, cap it; otherwise default to max refundable
  const reqAmount = requested_amount && requested_amount > 0 ? Math.round(requested_amount * 100) / 100 : orderTotal;
  const approvedAmount = Math.min(reqAmount, maxRefundable);
  const isCapped = reqAmount > maxRefundable;

  if (isCapped) {
    reasons.push(
      `REFUND_CAPPED: Requested ₹${reqAmount.toFixed(2)} exceeds net order limit ₹${maxRefundable.toFixed(2)} after ₹${restockingFee.toFixed(2)} (${restockingPercent}%) restocking fee.`
    );
  }

  const requiresHumanApproval = approvedAmount > policy.approval_threshold;
  if (requiresHumanApproval) {
    reasons.push(
      `APPROVAL_THRESHOLD_EXCEEDED: Refund ₹${approvedAmount.toFixed(2)} exceeds automated approval limit of ₹${policy.approval_threshold.toFixed(2)}`
    );
  }

  const eligible = !windowExpired && order.payment_status === 'completed' && !requiresHumanApproval;

  return {
    eligible,
    order_id: order.id,
    order_total: orderTotal,
    requested_amount: reqAmount,
    restocking_percent: restockingPercent,
    restocking_fee: restockingFee,
    max_refundable: maxRefundable,
    approved_amount: approvedAmount,
    is_capped: isCapped,
    days_since_delivery: daysSinceDelivery,
    return_window_days: policy.return_window_days,
    window_expired: windowExpired,
    requires_human_approval: requiresHumanApproval,
    approval_threshold: policy.approval_threshold,
    reasons,
  };
}

/**
 * 6. create_return(order_id, customer_id, evidence)
 * Idempotent: checks existing return, re-validates DB before mutation
 */
export function create_return(
  order_id: string,
  customer_id: string,
  evidence: Evidence,
  reason: string = 'Customer return request'
): { return_record: ReturnRecord; is_idempotent: boolean } {
  // Re-fetch authoritative order immediately before mutation
  const order = get_order(order_id, customer_id);
  if (!order) {
    throw new Error(`Cannot create return: Order ${order_id} not found for customer ${customer_id}`);
  }

  const idempotencyKey = `RET-${customer_id}-${order_id}`;
  const existing = queryOne<ReturnRecord>(
    `SELECT * FROM returns WHERE idempotency_key = ?`,
    [idempotencyKey]
  );

  if (existing) {
    return { return_record: existing, is_idempotent: true };
  }

  const id = `RET-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const evidenceSnapshot = JSON.stringify(evidence);

  run(
    `INSERT INTO returns (id, order_id, customer_id, status, reason, evidence_snapshot, idempotency_key, created_at)
     VALUES (?, ?, ?, 'approved', ?, ?, ?, ?)`,
    [id, order_id, customer_id, reason, evidenceSnapshot, idempotencyKey, now]
  );

  const created = queryOne<ReturnRecord>(`SELECT * FROM returns WHERE id = ?`, [id])!;
  return { return_record: created, is_idempotent: false };
}

/**
 * 7. create_refund(order_id, customer_id, amount, evidence)
 * Idempotent: checks existing refund, re-validates DB before mutation
 */
export function create_refund(
  order_id: string,
  customer_id: string,
  amount: number,
  evidence: Evidence,
  reason: string = 'Customer refund authorized'
): { refund_record: RefundRecord; is_idempotent: boolean } {
  // Re-fetch authoritative order immediately before mutation
  const order = get_order(order_id, customer_id);
  if (!order) {
    throw new Error(`Cannot create refund: Order ${order_id} not found for customer ${customer_id}`);
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const idempotencyKey = `REF-${customer_id}-${order_id}-${roundedAmount}`;
  const existing = queryOne<RefundRecord>(
    `SELECT * FROM refunds WHERE idempotency_key = ?`,
    [idempotencyKey]
  );

  if (existing) {
    return { refund_record: existing, is_idempotent: true };
  }

  const id = `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const evidenceSnapshot = JSON.stringify(evidence);

  run(
    `INSERT INTO refunds (id, order_id, customer_id, amount, status, reason, evidence_snapshot, idempotency_key, created_at)
     VALUES (?, ?, ?, ?, 'initiated', ?, ?, ?, ?)`,
    [id, order_id, customer_id, roundedAmount, reason, evidenceSnapshot, idempotencyKey, now]
  );

  const created = queryOne<RefundRecord>(`SELECT * FROM refunds WHERE id = ?`, [id])!;
  return { refund_record: created, is_idempotent: false };
}

/**
 * 8. create_support_ticket(customer_id, issue_type, reason, priority, order_id)
 */
export function create_support_ticket(
  customer_id: string,
  issue_type: string,
  reason: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  order_id: string | null = null
): SupportTicket {
  const id = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO support_tickets (id, customer_id, order_id, issue_type, reason, status, priority, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
    [id, customer_id, order_id, issue_type, reason, priority, now]
  );

  const ticket = queryOne<SupportTicket>(`SELECT * FROM support_tickets WHERE id = ?`, [id])!;
  return ticket;
}
