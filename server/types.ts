export type DecisionType = 'ANSWER' | 'ASK' | 'ACT' | 'ESCALATE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  risk_score: number; // 0.0 - 1.0 (>= 0.70 is flagged high risk)
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  returnable: boolean;
  warranty_months: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'placed' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'pending_payment';
  tracking_number: string;
  courier: string;
  placed_at: string;
  delivered_at: string | null;
  policy_snapshot_date: string;
  total_amount: number;
  currency: string;
  delivery_otp_verified: boolean;
  shipping_address: string;
  payment_status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  items?: OrderItem[];
}

export interface VersionedPolicy {
  id: string;
  category: string;
  version: string;
  effective_from: string;
  effective_to: string | null;
  return_window_days: number;
  restocking_percent: number;
  approval_threshold: number;
  allow_opened_items: boolean;
  description: string;
}

export interface Evidence {
  customer_verified: boolean;
  order_verified: boolean;
  ownership_verified: boolean;
  payment_verified: boolean;
  delivery_verified: boolean;
  policy_verified: boolean;
  window_verified: boolean;
  refund_amount_verified: boolean;
  notes?: string[];
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  order_id: string | null;
  issue_type: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  status: 'initiated' | 'completed' | 'rejected';
  reason: string;
  evidence_snapshot: string;
  idempotency_key: string;
  created_at: string;
}

export interface ReturnRecord {
  id: string;
  order_id: string;
  customer_id: string;
  status: 'approved' | 'rejected' | 'in_transit';
  reason: string;
  evidence_snapshot: string;
  idempotency_key: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  customer_id: string;
  session_id: string;
  message: string;
  sender: 'customer' | 'agent' | 'system';
  timestamp: string;
}

export interface ExtractedIntent {
  intent:
    | 'order_status'
    | 'delivery_issue'
    | 'refund_request'
    | 'return_request'
    | 'damaged_item'
    | 'payment_issue'
    | 'address_change'
    | 'warranty_question'
    | 'unknown';
  order_id?: string;
  product_name?: string;
  requested_amount?: number;
  new_address?: string;
  reason?: string;
  confidence?: number;
}

export interface TraceEntry {
  step: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  details: Record<string, unknown> | string;
}

export interface ExecutedAction {
  type: 'REFUND_CREATED' | 'RETURN_CREATED' | 'TICKET_CREATED' | 'ADDRESS_UPDATED';
  id: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface SupportAgentResponse {
  decision: DecisionType;
  response: string;
  reason_codes: string[];
  policy_version: string | null;
  evidence: Evidence;
  actions: ExecutedAction[];
  trace: TraceEntry[];
  ticket?: SupportTicket | null;
  clarification_options?: {
    type: 'orders' | 'intents' | 'actions';
    options: Array<{ id: string; label: string; details?: string }>;
  };
}
