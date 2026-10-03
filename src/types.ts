export type DecisionType = 'ANSWER' | 'ASK' | 'ACT' | 'ESCALATE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  risk_score: number;
  created_at: string;
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

export interface ExecutedAction {
  type: 'REFUND_CREATED' | 'RETURN_CREATED' | 'TICKET_CREATED' | 'ADDRESS_UPDATED';
  id: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface TraceEntry {
  step: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  details: Record<string, unknown> | string;
}

export interface ClarificationOption {
  id: string;
  label: string;
  details?: string;
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
    options: ClarificationOption[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  responseMeta?: SupportAgentResponse;
}
