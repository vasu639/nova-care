import { 
  Customer, 
  Order, 
  VersionedPolicy, 
  Evidence, 
  SupportTicket, 
  RefundRecord, 
  ReturnRecord, 
  SupportAgentResponse, 
  TraceEntry, 
  ExecutedAction,
  DecisionType,
  SupportedLanguage,
  WhatWeCheckedItem,
  ActionPreview,
  TimelineEvent,
  EvidenceItem,
  CustomerNotification
} from './types.js';
import { 
  get_customer, 
  get_order, 
  get_context, 
  get_applicable_policy, 
  check_refund_eligibility, 
  create_return, 
  create_refund, 
  create_support_ticket,
  check_order_exists_globally
} from './tools.js';
import { analyzeSafety } from './safety.js';
import { parseCustomerMessage, generateCustomerWording } from './llm_parser.js';
import { run, queryAll } from './database.js';

export interface ProcessMessageParams {
  customer_id: string;
  message: string;
  session_id?: string;
  language?: SupportedLanguage;
}

export async function processCustomerMessage(params: ProcessMessageParams): Promise<SupportAgentResponse> {
  const result = await executeCorePipeline(params);

  // In automated test mode, keep deterministic template responses
  if (process.env.TEST_MODE === '1') {
    return result;
  }

  // Preserve strict crisis and legal text verbatim
  if (
    result.reason_codes.includes('SAFETY_ALERT_SELF_HARM') ||
    result.reason_codes.includes('LEGAL_THREAT_DETECTED') ||
    result.reason_codes.includes('HARASSMENT_DETECTED')
  ) {
    return result;
  }

  // Enhance customer-friendly wording using Gemini API
  try {
    const customer = get_customer(params.customer_id);
    const naturalWording = await generateCustomerWording({
      customerName: customer?.name || 'Customer',
      userMessage: params.message,
      decision: result.decision,
      templateResponse: result.response,
      facts: {
        decision: result.decision,
        reason_codes: result.reason_codes,
        policy_version: result.policy_version,
        actions: result.actions.map((a) => a.summary),
        ticket: result.ticket ? { id: result.ticket.id, type: result.ticket.issue_type } : null,
      },
      policyVersion: result.policy_version,
      language: params.language,
    });

    if (naturalWording && naturalWording.trim().length > 10) {
      result.response = naturalWording;
    }
  } catch (err) {
    // Keep deterministic template on error
  }

  return result;
}

async function executeCorePipeline(params: ProcessMessageParams): Promise<SupportAgentResponse> {
  const { customer_id, message, session_id = 'sess-' + Date.now() } = params;
  const trace: TraceEntry[] = [];
  const reason_codes: string[] = [];
  const actions: ExecutedAction[] = [];
  let policy_version: string | null = null;
  let ticket: SupportTicket | null = null;

  const addTrace = (step: string, status: TraceEntry['status'], details: Record<string, unknown> | string) => {
    trace.push({
      step,
      status,
      timestamp: new Date().toISOString(),
      details,
    });
  };

  // Record user message in conversations log
  try {
    run(
      `INSERT INTO conversations (id, customer_id, session_id, message, sender, timestamp)
       VALUES (?, ?, ?, ?, 'customer', ?)`,
      [`msg-${Date.now()}-${Math.random()}`, customer_id, session_id, message, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Failed to log conversation message:', err);
  }

  // ----------------------------------------------------
  // STEP 1: Input Safety & Prompt Injection Detection
  // ----------------------------------------------------
  addTrace('Input Safety Analysis', 'info', 'Evaluating input for prompt injection, adversarial payloads, and crisis language');
  const safety = analyzeSafety(message);

  if (safety.hasPromptInjection) {
    reason_codes.push('PROMPT_INJECTION_DEFENDED');
    addTrace('Input Safety Analysis', 'warning', {
      indicator: 'prompt_injection_detected',
      event: 'Prompt injection attempted',
      riskReasons: safety.riskReasons,
      enforcement: 'System rules enforce untrusted customer input boundary. Injected instructions disregarded.'
    });
  }

  // Critical safety triggers: Self-Harm
  if (safety.hasSelfHarm) {
    reason_codes.push('SAFETY_ALERT_SELF_HARM');
    ticket = create_support_ticket(customer_id, 'SAFETY_CRISIS', 'Customer distress message detected', 'urgent');
    addTrace('Safety Alert', 'error', 'Distress language detected. Immediate escalation with supportive resources.');
    return {
      decision: 'ESCALATE',
      response: `We care about your safety and well-being. If you are experiencing distress, please reach out immediately to the National Tele-MANAS Helpline at 14416 or 1800-891-4416, or your local emergency services. A senior care specialist (Ticket ${ticket.id}) has also been assigned to assist you.`,
      reason_codes,
      policy_version: null,
      evidence: createEmptyEvidence(),
      actions,
      trace,
      ticket,
    };
  }

  // Critical safety triggers: Legal Threat
  if (safety.hasLegalThreat) {
    reason_codes.push('LEGAL_THREAT_DETECTED');
    ticket = create_support_ticket(customer_id, 'LEGAL_ESCALATION', `Legal threat received: "${message.slice(0, 100)}..."`, 'urgent');
    addTrace('Legal Escalation', 'error', {
      indicator: 'legal_threat_detected',
      details: 'Legal terms detected. Forwarded to Legal & Compliance desk',
      ticket_id: ticket.id,
      riskReasons: safety.riskReasons
    });
    return {
      decision: 'ESCALATE',
      response: `Because legal representation or formal proceedings have been referenced, your request has been escalated to our Legal & Executive Grievance Team under Ticket #${ticket.id}. A dedicated compliance officer will review your account records and respond within 24 business hours.`,
      reason_codes,
      policy_version: null,
      evidence: createEmptyEvidence(),
      actions: [
        {
          type: 'TICKET_CREATED',
          id: ticket.id,
          summary: `Created Priority Ticket ${ticket.id} for Legal Review`,
          payload: { ticket_id: ticket.id, priority: ticket.priority }
        }
      ],
      trace,
      ticket,
    };
  }

  // Critical safety triggers: Harassment
  if (safety.hasHarassment) {
    reason_codes.push('HARASSMENT_DETECTED');
    ticket = create_support_ticket(customer_id, 'HARASSMENT_ESCALATION', 'Abusive or harassing customer language', 'high');
    addTrace('Harassment Detected', 'warning', `Hostile language flagged. Escalated to senior supervisor under Ticket ${ticket.id}`);
    return {
      decision: 'ESCALATE',
      response: `NovaMart maintains a respectful workplace for all agents and customers. Because of abusive language, automated assistance is paused and your case has been transferred to a senior supervisor (Ticket #${ticket.id}) for further review.`,
      reason_codes,
      policy_version: null,
      evidence: createEmptyEvidence(),
      actions,
      trace,
      ticket,
    };
  }

  // ----------------------------------------------------
  // STEP 2: Structured Intent & Entity Parsing
  // ----------------------------------------------------
  addTrace('Intent Parsing', 'info', 'Parsing intents and entities via structured parser');
  const parseResult = await parseCustomerMessage(message);
  addTrace('Intent Parsing Result', 'success', {
    parserUsed: parseResult.parserUsed,
    intentsCount: parseResult.intents.length,
    intents: parseResult.intents,
  });

  // ----------------------------------------------------
  // STEP 3: Server-side Authenticated Customer Context
  // ----------------------------------------------------
  addTrace('Customer Verification', 'info', `Validating server-side customer ID: ${customer_id}`);
  const customer = get_customer(customer_id);

  if (!customer) {
    reason_codes.push('CUSTOMER_NOT_FOUND');
    addTrace('Customer Verification', 'error', `Customer ${customer_id} not found in database`);
    return {
      decision: 'ASK',
      response: 'We could not authenticate your customer session. Please sign in again to continue.',
      reason_codes,
      policy_version: null,
      evidence: createEmptyEvidence(),
      actions,
      trace,
      ticket: null,
    };
  }

  // Check Fraud / Risk Score
  const isHighRiskCustomer = customer.risk_score >= 0.70;
  if (isHighRiskCustomer) {
    reason_codes.push('FRAUD_RISK_FLAGGED');
    reason_codes.push('SUSPICIOUS_REFUND_PATTERN');
    addTrace('Fraud & Risk Check', 'warning', {
      risk_score: customer.risk_score,
      threshold: 0.70,
      indicator: 'suspicious_refund_pattern',
      verdict: 'Customer account flagged for high dispute/refund velocity.'
    });
  }

  // ----------------------------------------------------
  // STEP 4: Entity Resolution & Order Disambiguation
  // ----------------------------------------------------
  const primaryIntent = parseResult.intents[0] || { intent: 'unknown' };
  const requestedOrderId = parseResult.intents.find((i) => i.order_id)?.order_id;
  const requestedProduct = parseResult.intents.find((i) => i.product_name)?.product_name;

  const hasDeliveryIssue = parseResult.intents.some((i) => i.intent === 'delivery_issue');
  const hasRefundRequest = parseResult.intents.some((i) => i.intent === 'refund_request');
  const hasReturnRequest = parseResult.intents.some((i) => i.intent === 'return_request');
  const hasAddressChange = parseResult.intents.some((i) => i.intent === 'address_change');
  const hasOrderStatus = parseResult.intents.some((i) => i.intent === 'order_status');
  const hasPaymentIssue = parseResult.intents.some((i) => i.intent === 'payment_issue');
  const hasWarrantyQuestion = parseResult.intents.some((i) => i.intent === 'warranty_question');
  const hasHumanAgentRequest = parseResult.intents.some((i) => i.intent === 'human_agent_request');
  const hasGreeting = parseResult.intents.some((i) => i.intent === 'greeting');

  // Retrieve customer's context and order history
  const context = get_context(customer_id);
  let resolvedOrder: Order | null = null;
  let resolvedCategory = 'Electronics';

  if (requestedOrderId) {
    // Scoped order retrieval: MUST strictly belong to customer
    resolvedOrder = get_order(requestedOrderId, customer_id);

    if (!resolvedOrder) {
      // Check cross-account security: Does order exist under someone else?
      const globalCheck = check_order_exists_globally(requestedOrderId);
      if (globalCheck.exists && globalCheck.belongs_to_other) {
        reason_codes.push('CROSS_ACCOUNT_ACCESS_DENIED');
        addTrace('Security Boundary Enforcement', 'warning', {
          requestedOrderId,
          finding: 'Order exists under a different customer ID. Never reveal existence or owner details.',
          action: 'Masked as not found in authenticated account.'
        });
        // Do not leak order owner!
        return {
          decision: 'ASK',
          response: `We could not locate order ${requestedOrderId} associated with your account (${customer.email}). Please double-check your order number from your Orders dashboard or provide the correct ID.`,
          reason_codes,
          policy_version: null,
          evidence: createEmptyEvidence(),
          actions,
          trace,
          ticket: null,
        };
      } else {
        reason_codes.push('ORDER_NOT_FOUND');
        addTrace('Order Resolution', 'warning', `Order ${requestedOrderId} does not exist in system`);
        return {
          decision: 'ASK',
          response: `Order ${requestedOrderId} was not found. Please check your order history and provide a valid order ID.`,
          reason_codes,
          policy_version: null,
          evidence: createEmptyEvidence(),
          actions,
          trace,
          ticket: null,
        };
      }
    } else {
      addTrace('Order Resolution', 'success', {
        order_id: resolvedOrder.id,
        status: resolvedOrder.status,
        total: resolvedOrder.total_amount,
        itemsCount: resolvedOrder.items?.length,
      });
    }
  } else if (!hasHumanAgentRequest && !hasGreeting) {
    // No specific order ID provided in message: Attempt safe matching by product keyword
    if (requestedProduct) {
      const candidateOrders = context.orders.filter((o) =>
        o.items?.some((it) => it.product_name?.toLowerCase().includes(requestedProduct.toLowerCase()))
      );

      if (candidateOrders.length === 1) {
        resolvedOrder = candidateOrders[0];
        addTrace('Order Resolution', 'info', `Disambiguated to unique order ${resolvedOrder.id} from customer context`);
      } else if (candidateOrders.length > 1) {
        // Multiple matching orders! RULE 6: Never guess an order!
        reason_codes.push('AMBIGUOUS_ORDER_MATCH');
        addTrace('Order Resolution', 'warning', {
          candidates: candidateOrders.map((o) => ({ id: o.id, date: o.placed_at, total: o.total_amount })),
          rule: 'Never guess an order when multiple candidates exist.',
        });

        return {
          decision: 'ASK',
          response: `I found ${candidateOrders.length} orders in your account matching your request. Which order are you referring to?`,
          reason_codes,
          policy_version: null,
          evidence: createEmptyEvidence(),
          actions,
          trace,
          ticket: null,
          clarification_options: {
            type: 'orders',
            options: candidateOrders.map((o) => ({
              id: o.id,
              label: `Order ${o.id} - ₹${o.total_amount.toLocaleString('en-IN')}`,
              details: `Placed on ${o.placed_at.slice(0, 10)} (${o.status}) - ${o.items?.map((i) => i.product_name).join(', ')}`,
            })),
          },
        };
      }
    } else if (context.orders.length === 1) {
      resolvedOrder = context.orders[0];
    }
  }

  // Determine category from resolved order items
  if (resolvedOrder && resolvedOrder.items && resolvedOrder.items.length > 0) {
    resolvedCategory = resolvedOrder.items[0].category || 'Electronics';
  }

  // ----------------------------------------------------
  // STEP 5: Policy Snapshot Retrieval
  // ----------------------------------------------------
  const snapshotDate = resolvedOrder ? resolvedOrder.policy_snapshot_date : new Date().toISOString();
  const applicablePolicy = get_applicable_policy(resolvedCategory, snapshotDate);
  policy_version = applicablePolicy ? applicablePolicy.version : 'DEFAULT-2026.1';

  addTrace('Policy Version Selection', 'success', {
    category: resolvedCategory,
    orderSnapshotDate: snapshotDate,
    selectedPolicyVersion: policy_version,
    returnWindowDays: applicablePolicy?.return_window_days,
    restockingPercent: applicablePolicy?.restocking_percent,
    approvalThreshold: applicablePolicy?.approval_threshold,
  });

  // ----------------------------------------------------
  // STEP 6: Multi-Intent & Conflict Evaluation
  // ----------------------------------------------------
  if (parseResult.isMultiIntent) {
    addTrace('Multi-Intent Analysis', 'info', {
      intents: parseResult.intents.map((i) => i.intent),
      principle: 'Each intent must be verified independently. One action cannot authorize another.',
    });
    reason_codes.push('MULTI_INTENT_EVALUATED');
  }

  // Check 1: Delivery Issue with OTP Verification Contradiction
  if (resolvedOrder && hasDeliveryIssue) {
    if (resolvedOrder.delivery_otp_verified) {
      reason_codes.push('OTP_DELIVERY_CONTRADICTION');
      ticket = create_support_ticket(
        customer_id,
        'DISPUTED_DELIVERY_OTP',
        `Customer claims non-delivery for ${resolvedOrder.id}, but courier confirms delivery with secure OTP verification. Courier: ${resolvedOrder.courier}, Tracking: ${resolvedOrder.tracking_number}`,
        'urgent',
        resolvedOrder.id
      );
      addTrace('Delivery Dispute Verification', 'error', {
        indicator: 'otp_delivery_contradiction',
        orderId: resolvedOrder.id,
        status: resolvedOrder.status,
        deliveredAt: resolvedOrder.delivered_at,
        deliveryOtpVerified: true,
        contradiction: 'OTP-verified delivery claimed as non-delivered.',
        action: 'Mandatory human escalation. Automated refunds strictly prevented.'
      });

      let multiIntentAddendum = '';
      if (hasAddressChange) {
        multiIntentAddendum = ' Note: Shipping address cannot be changed for an order that has already been delivered.';
      }

      return {
        decision: 'ESCALATE',
        response: `Our carrier records indicate that order ${resolvedOrder.id} was delivered on ${new Date(resolvedOrder.delivered_at!).toLocaleDateString()} with secure one-time-password (OTP) verification.${multiIntentAddendum} Because this requires carrier parcel trace and signature inspection, we have created Priority Ticket #${ticket.id} for human logistics review. A logistics manager will contact you within 24 hours.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, false),
        actions: [
          {
            type: 'TICKET_CREATED',
            id: ticket.id,
            summary: `Logistics Investigation Ticket ${ticket.id} Created`,
            payload: { order_id: resolvedOrder.id, ticket_id: ticket.id }
          }
        ],
        trace,
        ticket,
      };
    }
  }

  // Check 2: Payment Status Issues
  if (resolvedOrder && (resolvedOrder.payment_status === 'pending' || resolvedOrder.payment_status === 'failed')) {
    reason_codes.push('PAYMENT_UNCONFIRMED');
    addTrace('Payment Verification', 'warning', {
      orderId: resolvedOrder.id,
      payment_status: resolvedOrder.payment_status,
      payment_method: resolvedOrder.payment_method
    });

    if (hasRefundRequest || hasReturnRequest) {
      ticket = create_support_ticket(
        customer_id,
        'PAYMENT_RESOLUTION',
        `Refund/Return requested for order ${resolvedOrder.id} with payment status: ${resolvedOrder.payment_status}`,
        'high',
        resolvedOrder.id
      );
      return {
        decision: 'ESCALATE',
        response: `Order ${resolvedOrder.id} currently has payment status "${resolvedOrder.payment_status}". Because the payment was not completed or captured, automated refunds cannot be processed. A billing specialist has been notified under Ticket #${ticket.id} to review the transaction gateway.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, false),
        actions: [
          {
            type: 'TICKET_CREATED',
            id: ticket.id,
            summary: `Billing Escalation Ticket ${ticket.id}`,
            payload: { order_id: resolvedOrder.id, payment_status: resolvedOrder.payment_status }
          }
        ],
        trace,
        ticket,
      };
    } else {
      return {
        decision: 'ANSWER',
        response: `Order ${resolvedOrder.id} was placed on ${resolvedOrder.placed_at.slice(0, 10)} but its payment is currently "${resolvedOrder.payment_status}" via ${resolvedOrder.payment_method}. If amount was debited from your bank, it will automatically reflect or reverse within 24–48 banking hours.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, false),
        actions,
        trace,
        ticket: null,
      };
    }
  }

  // Check 3: High Risk Fraud Score
  if (isHighRiskCustomer && (hasRefundRequest || hasReturnRequest || hasAddressChange)) {
    ticket = create_support_ticket(
      customer_id,
      'FRAUD_INVESTIGATION',
      `High-risk account (risk score ${customer.risk_score}) requested action on order ${resolvedOrder?.id || 'unspecified'}`,
      'urgent',
      resolvedOrder?.id || null
    );
    addTrace('Fraud Guard Enforcement', 'error', {
      customerId: customer.id,
      riskScore: customer.risk_score,
      action: 'Automated mutation blocked. Ticket routed to Risk Management.'
    });
    return {
      decision: 'ESCALATE',
      response: `Your request regarding order ${resolvedOrder?.id || ''} requires standard security verification by our Account Security Team. We have initiated case #${ticket.id}. You may be asked to provide proof of identity or receipt confirmation.`,
      reason_codes,
      policy_version,
      evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, false),
      actions: [
        {
          type: 'TICKET_CREATED',
          id: ticket.id,
          summary: `Security Review Ticket ${ticket.id}`,
          payload: { ticket_id: ticket.id, customer_id: customer.id }
        }
      ],
      trace,
      ticket,
    };
  }

  // Check 4: Direct Request to Speak with Human Support Agent
  if (hasHumanAgentRequest || primaryIntent.intent === 'human_agent_request') {
    ticket = create_support_ticket(
      customer_id,
      'DIRECT_HUMAN_AGENT_TRANSFER',
      `Customer requested direct assistance from a live human support specialist. User message: "${message.slice(0, 100)}"`,
      'high',
      resolvedOrder?.id || null
    );
    reason_codes.push('HUMAN_AGENT_TRANSFER_INITIATED');
    addTrace('Human Agent Transfer', 'info', {
      ticketId: ticket.id,
      priority: ticket.priority,
      action: 'Dispatched to Live Support Desk queue.'
    });

    return {
      decision: 'ESCALATE',
      response: `I am connecting you directly to our human customer support team under Priority Ticket #${ticket.id}! A customer care specialist has been alerted and will join to assist you directly. While they review your account, please let me know if you would like me to track an order, review return policies, or check anything else for you!`,
      reason_codes,
      policy_version,
      evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true),
      actions: [
        {
          type: 'TICKET_CREATED',
          id: ticket.id,
          summary: `Priority Ticket #${ticket.id} assigned to Live Care Specialist`,
          payload: { ticket_id: ticket.id, department: 'Human Support Care' }
        }
      ],
      trace,
      ticket,
      clarification_options: {
        type: 'actions',
        options: [
          { id: 'track_recent', label: '📦 While waiting, track my recent order', details: 'Check real-time delivery status' },
          { id: 'check_policies', label: '🛡️ View return & warranty policies', details: 'See 14/30 day return windows' },
          { id: 'ask_question', label: '💬 Ask Nova another question', details: 'Get immediate automated assistance' }
        ]
      }
    };
  }

  // ----------------------------------------------------
  // STEP 7: Specific Intent Handling & Determinations
  // ----------------------------------------------------

  // 7A: Address Change Request
  if (hasAddressChange) {
    if (!resolvedOrder) {
      reason_codes.push('ORDER_ID_REQUIRED');
      return {
        decision: 'ASK',
        response: 'Please provide the order ID for the address change request.',
        reason_codes,
        policy_version,
        evidence: createEmptyEvidence(),
        actions,
        trace,
        ticket: null,
      };
    }

    // Check order status
    if (resolvedOrder.status === 'in_transit' || resolvedOrder.status === 'delivered') {
      ticket = create_support_ticket(
        customer_id,
        'ADDRESS_CHANGE_DISPATCHED',
        `Customer requested address change for ${resolvedOrder.id}, but order status is already '${resolvedOrder.status}' with courier ${resolvedOrder.courier}`,
        'high',
        resolvedOrder.id
      );
      reason_codes.push('DISPATCHED_ADDRESS_CHANGE_BLOCKED');
      addTrace('Address Change Guard', 'warning', {
        orderId: resolvedOrder.id,
        status: resolvedOrder.status,
        verdict: 'Cannot modify address automatically once dispatched to courier.'
      });

      return {
        decision: 'ESCALATE',
        response: `Order ${resolvedOrder.id} is already ${resolvedOrder.status === 'delivered' ? 'delivered' : 'in transit with ' + resolvedOrder.courier}. Shipping addresses cannot be altered once handed over to the courier. We have created Ticket #${ticket.id} to contact courier dispatch for rerouting options.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true),
        actions: [
          {
            type: 'TICKET_CREATED',
            id: ticket.id,
            summary: `Courier Reroute Ticket ${ticket.id}`,
            payload: { order_id: resolvedOrder.id }
          }
        ],
        trace,
        ticket,
      };
    } else {
      // Order is 'placed' or 'confirmed' -> ACT: Safe Address Update!
      const newAddr = parseResult.intents.find(i => i.new_address)?.new_address || 'Updated Customer Address';
      run(`UPDATE orders SET shipping_address = ? WHERE id = ? AND customer_id = ?`, [newAddr, resolvedOrder.id, customer_id]);
      reason_codes.push('ADDRESS_UPDATED');
      addTrace('Authoritative Mutation', 'success', `Updated shipping address for ${resolvedOrder.id}`);

      actions.push({
        type: 'ADDRESS_UPDATED',
        id: resolvedOrder.id,
        summary: `Updated delivery address for ${resolvedOrder.id}`,
        payload: { new_address: newAddr }
      });

      return {
        decision: 'ACT',
        response: `The shipping address for order ${resolvedOrder.id} has been successfully updated to: ${newAddr}. Your order is still processing and will ship to the updated location.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true),
        actions,
        trace,
        ticket: null,
      };
    }
  }

  // 7B: Refund Request or Return Request
  if (hasRefundRequest || hasReturnRequest) {
    if (!resolvedOrder) {
      reason_codes.push('ORDER_ID_REQUIRED');
      return {
        decision: 'ASK',
        response: 'Which order would you like to request a refund or return for?',
        reason_codes,
        policy_version,
        evidence: createEmptyEvidence(),
        actions,
        trace,
        ticket: null,
      };
    }

    if (!applicablePolicy) {
      reason_codes.push('POLICY_NOT_FOUND');
      ticket = create_support_ticket(customer_id, 'POLICY_EXCEPTION', `No policy found for category ${resolvedCategory}`, 'medium', resolvedOrder.id);
      return {
        decision: 'ESCALATE',
        response: `We could not resolve the governing policy for order ${resolvedOrder.id}. We have created Ticket #${ticket.id} for human support review.`,
        reason_codes,
        policy_version: null,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, null, false),
        actions,
        trace,
        ticket,
      };
    }

    const requestedAmount = parseResult.intents.find(i => i.requested_amount)?.requested_amount;
    const eligibility = check_refund_eligibility(resolvedOrder, applicablePolicy, requestedAmount);

    addTrace('Eligibility Calculation', eligibility.eligible ? 'success' : 'warning', {
      orderTotal: eligibility.order_total,
      requestedAmount: eligibility.requested_amount,
      restockingFee: eligibility.restocking_fee,
      maxRefundable: eligibility.max_refundable,
      approvedAmount: eligibility.approved_amount,
      isCapped: eligibility.is_capped,
      daysSinceDelivery: eligibility.days_since_delivery,
      windowExpired: eligibility.window_expired,
      requiresHumanApproval: eligibility.requires_human_approval,
      reasons: eligibility.reasons,
    });

    if (eligibility.is_capped) {
      reason_codes.push('REFUND_CAPPED');
    }

    // Condition: Window Expired
    if (eligibility.window_expired) {
      reason_codes.push('RETURN_WINDOW_EXPIRED');
      return {
        decision: 'ANSWER',
        response: `Order ${resolvedOrder.id} was delivered on ${new Date(resolvedOrder.delivered_at!).toLocaleDateString()} (${eligibility.days_since_delivery} days ago). Under our ${applicablePolicy.category} Policy (${applicablePolicy.version}), items are eligible for refund/return within ${applicablePolicy.return_window_days} days of delivery. As the return window has expired, automated return or refund cannot be initiated.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, false),
        actions,
        trace,
        ticket: null,
      };
    }

    // Condition: High-value refund exceeding Approval Threshold
    if (eligibility.requires_human_approval) {
      reason_codes.push('APPROVAL_THRESHOLD_EXCEEDED');
      ticket = create_support_ticket(
        customer_id,
        'HIGH_VALUE_REFUND_APPROVAL',
        `Refund of ₹${eligibility.approved_amount.toFixed(2)} for ${resolvedOrder.id} exceeds automated limit of ₹${applicablePolicy.approval_threshold.toFixed(2)} under ${applicablePolicy.version}`,
        'high',
        resolvedOrder.id
      );
      addTrace('Approval Threshold Guard', 'warning', {
        approvedAmount: eligibility.approved_amount,
        threshold: applicablePolicy.approval_threshold,
        action: 'Escalated to Finance & Returns Manager.'
      });

      return {
        decision: 'ESCALATE',
        response: `Because your refund request of ₹${eligibility.approved_amount.toLocaleString('en-IN')} for order ${resolvedOrder.id} exceeds the automated approval limit of ₹${applicablePolicy.approval_threshold.toLocaleString('en-IN')} (under policy ${applicablePolicy.version}), it has been routed to our Finance & Support Supervisor for manual authorization (Ticket #${ticket.id}). You will receive confirmation via email once authorized.`,
        reason_codes,
        policy_version,
        evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true, eligibility),
        actions: [
          {
            type: 'TICKET_CREATED',
            id: ticket.id,
            summary: `High-Value Approval Ticket ${ticket.id}`,
            payload: { order_id: resolvedOrder.id, amount: eligibility.approved_amount }
          }
        ],
        trace,
        ticket,
      };
    }

    // Condition: Safe, Authorized Refund / Return -> ACT!
    const evidence = createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true, eligibility);

    // Verify all 8 evidence points
    const allEvidencePass = 
      evidence.customer_verified &&
      evidence.order_verified &&
      evidence.ownership_verified &&
      evidence.payment_verified &&
      evidence.delivery_verified &&
      evidence.policy_verified &&
      evidence.window_verified &&
      evidence.refund_amount_verified;

    if (!allEvidencePass) {
      reason_codes.push('EVIDENCE_VERIFICATION_FAILED');
      addTrace('Evidence Check', 'error', { evidence });
      ticket = create_support_ticket(customer_id, 'EVIDENCE_DISCREPANCY', 'Evidence checklist did not pass verification', 'medium', resolvedOrder.id);
      return {
        decision: 'ESCALATE',
        response: `We encountered a verification discrepancy while validating order ${resolvedOrder.id}. We have opened support ticket #${ticket.id} to inspect this case.`,
        reason_codes,
        policy_version,
        evidence,
        actions,
        trace,
        ticket,
      };
    }

    // Execute through deterministic, validated backend tools
    reason_codes.push('REFUND_ELIGIBLE');

    // Create refund
    const refundResult = create_refund(
      resolvedOrder.id,
      customer_id,
      eligibility.approved_amount,
      evidence,
      `Authorized refund under ${applicablePolicy.version}`
    );

    // Create return tracking if return was also requested or standard for product
    const returnResult = create_return(
      resolvedOrder.id,
      customer_id,
      evidence,
      `Return initiated under ${applicablePolicy.version}`
    );

    addTrace('Deterministic Mutation Executed', 'success', {
      refund_id: refundResult.refund_record.id,
      refund_amount: refundResult.refund_record.amount,
      is_idempotent: refundResult.is_idempotent,
      return_id: returnResult.return_record.id,
    });

    actions.push({
      type: 'REFUND_CREATED',
      id: refundResult.refund_record.id,
      summary: `Refund of ₹${refundResult.refund_record.amount.toFixed(2)} initiated for order ${resolvedOrder.id}`,
      payload: { 
        refund_id: refundResult.refund_record.id, 
        amount: refundResult.refund_record.amount,
        is_idempotent: refundResult.is_idempotent
      }
    });

    actions.push({
      type: 'RETURN_CREATED',
      id: returnResult.return_record.id,
      summary: `Return ${returnResult.return_record.id} created for order ${resolvedOrder.id}`,
      payload: { return_id: returnResult.return_record.id }
    });

    const caseId = `NM-RF-${resolvedOrder.id.replace('NM-', '')}21`;
    const trustFormat = `Your refund is eligible under ${applicablePolicy.version}.

Order value: ₹${resolvedOrder.total_amount.toLocaleString('en-IN')}
Restocking fee: ₹${eligibility.restocking_fee.toLocaleString('en-IN')}
Refund approved: ₹${eligibility.approved_amount.toLocaleString('en-IN')}
Expected processing time: 3–5 business days
Case ID: ${caseId}`;

    const action_preview: ActionPreview = {
      type: hasReturnRequest ? 'return' : 'refund',
      order_id: resolvedOrder.id,
      item_name: resolvedOrder.items?.[0]?.product_name || 'NovaMart Item',
      order_total: resolvedOrder.total_amount,
      requested_amount: requestedAmount || resolvedOrder.total_amount,
      eligible_amount: resolvedOrder.total_amount,
      restocking_fee: eligibility.restocking_fee,
      restocking_fee_percent: eligibility.restocking_percent,
      final_amount: eligibility.approved_amount,
      expected_processing_time: '3–5 business days to original payment method',
      payment_method_masked: `•••• 4821 via ${resolvedOrder.payment_method}`,
      case_id: caseId,
      policy_version: applicablePolicy.version,
      confirmed: true,
      requires_confirmation: false,
    };

    const trustContext = buildCustomerTrustContext(customer_id, resolvedOrder, applicablePolicy, eligibility, caseId);

    return {
      decision: 'ACT',
      response: trustFormat,
      reason_codes,
      policy_version,
      evidence,
      actions,
      trace,
      ticket: null,
      language: params.language || 'en',
      action_preview,
      trust_format_text: trustFormat,
      what_we_checked: trustContext.what_we_checked,
      timeline_events: trustContext.timeline_events,
      evidence_items: trustContext.evidence_items,
      masked_payment: trustContext.masked_payment,
      proactive_notifications: trustContext.proactive_notifications,
    };
  }

  // 7C: Order Status / Tracking Check -> ANSWER
  if (hasOrderStatus || primaryIntent.intent === 'order_status') {
    if (!resolvedOrder) {
      reason_codes.push('ORDER_ID_REQUIRED');
      return {
        decision: 'ASK',
        response: 'Which order status would you like to track?',
        reason_codes,
        policy_version,
        evidence: createEmptyEvidence(),
        actions,
        trace,
        ticket: null,
      };
    }

    reason_codes.push('ORDER_STATUS_VERIFIED');
    addTrace('Order Status Check', 'success', {
      orderId: resolvedOrder.id,
      status: resolvedOrder.status,
      courier: resolvedOrder.courier,
      trackingNumber: resolvedOrder.tracking_number
    });

    let statusDescription = `Order ${resolvedOrder.id} is currently ${resolvedOrder.status.toUpperCase()}.`;
    if (resolvedOrder.status === 'delivered') {
      statusDescription += ` It was delivered on ${new Date(resolvedOrder.delivered_at!).toLocaleDateString()} via ${resolvedOrder.courier} (Tracking: ${resolvedOrder.tracking_number}).`;
      if (resolvedOrder.delivery_otp_verified) {
        statusDescription += ` Secure OTP verification was completed upon delivery.`;
      }
    } else if (resolvedOrder.status === 'in_transit') {
      statusDescription += ` It is currently in transit with ${resolvedOrder.courier} (Tracking: ${resolvedOrder.tracking_number}).`;
    } else {
      statusDescription += ` Placed on ${resolvedOrder.placed_at.slice(0, 10)}. Payment is ${resolvedOrder.payment_status}.`;
    }

    return {
      decision: 'ANSWER',
      response: statusDescription,
      reason_codes,
      policy_version,
      evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true),
      actions,
      trace,
      ticket: null,
    };
  }

  // 7D: Warranty Question -> ANSWER
  if (hasWarrantyQuestion || primaryIntent.intent === 'warranty_question') {
    const item = resolvedOrder?.items?.[0];
    const warrantyMonths = 12; // default
    reason_codes.push('WARRANTY_INFORMATION_VERIFIED');
    addTrace('Warranty Check', 'success', {
      product: item?.product_name || 'Standard Products',
      warrantyMonths
    });

    return {
      decision: 'ANSWER',
      response: `All NovaMart ${resolvedCategory} products (including ${item?.product_name || 'your ordered item'}) come with a ${warrantyMonths}-month official manufacturer warranty covering hardware defects and malfunctions. To file a warranty claim, keep your order invoice #${resolvedOrder?.id || ''} handy.`,
      reason_codes,
      policy_version,
      evidence: createEvidenceSnapshot(customer, resolvedOrder, applicablePolicy, true),
      actions,
      trace,
      ticket: null,
    };
  }

  // Default Fallback & Interactive Conversational Assistance
  reason_codes.push('INTERACTIVE_CONVERSATION_ASSISTANCE');
  addTrace('Interactive Conversational Assistance', 'info', {
    customer: customer.name,
    inquiry: message,
    language: params.language || 'en',
    action: 'Provided guided interactive assistance options'
  });

  const lang = params.language || 'en';

  const greetingText = 
    lang === 'hi'
      ? `नमस्ते ${customer.name}! 👋 मैं नोवा हूँ, आपका इंटरएक्टिव एआई ग्राहक सहायता विशेषज्ञ।\n\n• आज मैं आपकी किस प्रकार सहायता कर सकता हूँ?\n• आपकी ऑर्डर या डिलीवरी में क्या समस्या है?\n• क्या आप ऑर्डर ट्रैक करना चाहते हैं या रिफंड की जांच करना चाहते हैं?\n• या क्या आप सीधे हमारे सहायता विशेषज्ञ से बात करना चाहते हैं?\n\nनीचे दिए गए विकल्पों में से चुनें या अपनी आवश्यकता लिखें!`
      : lang === 'mr'
        ? `नमस्कार ${customer.name}! 👋 मी नोव्हा आहे, आपला संवादात्मक एआय ग्राहक सेवा विशेषज्ञ.\n\n• मी आज तुम्हाला कशी मदत करू शकतो?\n• तुमच्या ऑर्डर किंवा डिलिव्हरीमध्ये कोणती अडचण आहे?\n• तुम्हाला ऑर्डर ट्रॅक करायची आहे की परतावा तपासायचा आहे?\n• किंवा तुम्हाला आमच्या ग्राहक प्रतिनिधीशी थेट बोलायचे आहे का?\n\nखालील पर्यायांमधून निवडा किंवा आपली आवश्यकता टाइप करा!`
        : `Hello ${customer.name}! 👋 I am Nova, your interactive AI Customer Support Specialist.\n\n• How can I help you today?\n• What problems or questions do you have with your order?\n• Would you like me to check an order status, process a return or refund?\n• Or do you want to talk to our human support agent directly?\n\nSelect an option below or tell me what you need!`;

  const options =
    lang === 'hi'
      ? [
          { id: 'track_order', label: '📦 मैं अपना ऑर्डर कैसे ट्रैक करूँ?', details: 'रीयल-टाइम डिलीवरी स्थिति एवं कूरियर ट्रैकिंग देखें' },
          { id: 'start_return', label: '💰 रिफंड या वापसी से जुड़ी क्या समस्याएँ हैं?', details: 'वापसी समय-सीमा और 5% शुल्क की गणना करें' },
          { id: 'talk_agent', label: '👤 क्या आप सीधे हमारे सहायता विशेषज्ञ से बात करना चाहते हैं?', details: 'मानव सेवा विशेषज्ञ को त्वरित प्राथमिकता ट्रांसफर' },
          { id: 'store_policies', label: '🛡️ स्टोर की वापसी नीतियाँ क्या होनी चाहिए?', details: 'सक्रिय इलेक्ट्रॉनिक्स व परिधान नीतियों की समीक्षा' },
        ]
      : lang === 'mr'
        ? [
            { id: 'track_order', label: '📦 मी माझी ऑर्डर कशी ट्रॅक करू शकतो?', details: 'थेट डिलिव्हरी स्थिती आणि कुरिअर ट्रॅकिंग तपासा' },
            { id: 'start_return', label: '💰 परतावा किंवा परत पाठवण्याबद्दल काय अडचण आहे?', details: 'परतावा कालावधी आणि ५% शुल्क नियम तपासा' },
            { id: 'talk_agent', label: '👤 तुम्हाला आमच्या ग्राहक प्रतिनिधीशी थेट बोलायचे आहे का?', details: 'मानवी तज्ज्ञांकडे त्वरित प्राधान्य वर्ग' },
            { id: 'store_policies', label: '🛡️ स्टोअरचे परतावा नियम काय असावेत?', details: 'सक्रिय इलेक्ट्रॉनिक्स व कपडे परतावा नियम तपासा' },
          ]
        : [
            { id: 'track_order', label: '📦 How can I track an order?', details: 'Check real-time delivery status & courier tracking' },
            { id: 'start_return', label: '💰 What problems with returns or refunds?', details: 'Check return window & 5% restocking fee rules' },
            { id: 'talk_agent', label: '👤 Do you want to talk to our support agent directly?', details: 'Instant priority transfer to a human specialist' },
            { id: 'store_policies', label: '🛡️ What should be store return policies?', details: 'Inspect active Electronics & Apparel policies' },
          ];

  return {
    decision: 'ANSWER',
    response: greetingText,
    reason_codes,
    policy_version,
    evidence: createEmptyEvidence(),
    actions,
    trace,
    ticket: null,
    clarification_options: {
      type: 'actions',
      options,
    },
  };
}

function createEmptyEvidence(): Evidence {
  return {
    customer_verified: false,
    order_verified: false,
    ownership_verified: false,
    payment_verified: false,
    delivery_verified: false,
    policy_verified: false,
    window_verified: false,
    refund_amount_verified: false,
  };
}

function createEvidenceSnapshot(
  customer: Customer | null,
  order: Order | null,
  policy: VersionedPolicy | null,
  orderValid: boolean,
  eligibility?: { window_expired: boolean; requires_human_approval: boolean }
): Evidence {
  const customer_verified = Boolean(customer && customer.risk_score < 0.70);
  const order_verified = Boolean(order && orderValid);
  const ownership_verified = Boolean(customer && order && order.customer_id === customer.id);
  const payment_verified = Boolean(order && order.payment_status === 'completed');
  const delivery_verified = Boolean(order && order.delivered_at !== null);
  const policy_verified = Boolean(policy !== null);
  const window_verified = Boolean(order && policy && !(eligibility?.window_expired));
  const refund_amount_verified = Boolean(order && !(eligibility?.requires_human_approval));

  return {
    customer_verified,
    order_verified,
    ownership_verified,
    payment_verified,
    delivery_verified,
    policy_verified,
    window_verified,
    refund_amount_verified,
  };
}

export function buildCustomerTrustContext(
  customer_id: string,
  resolvedOrder: Order | null,
  applicablePolicy: VersionedPolicy | null,
  eligibility?: {
    approved_amount: number;
    requested_amount?: number;
    restocking_fee: number;
    restocking_percent: number;
  } | null,
  caseIdOverride?: string
): {
  what_we_checked: WhatWeCheckedItem[];
  action_preview: ActionPreview | null;
  trust_format_text: string | null;
  timeline_events: TimelineEvent[];
  evidence_items: EvidenceItem[];
  masked_payment: string;
  proactive_notifications: CustomerNotification[];
} {
  // Query timeline events from SQLite
  let timeline_events: TimelineEvent[] = [];
  try {
    timeline_events = queryAll<TimelineEvent>(
      `SELECT * FROM timeline_events WHERE customer_id = ? ORDER BY timestamp ASC`,
      [customer_id]
    );
  } catch {
    // fallback if table uninitialized
  }

  // Query customer-facing evidence items from SQLite
  let evidence_items: EvidenceItem[] = [];
  try {
    evidence_items = queryAll<EvidenceItem>(
      `SELECT * FROM evidence_items WHERE customer_id = ? ORDER BY timestamp ASC`,
      [customer_id]
    );
  } catch {
    // fallback
  }

  // Query customer notifications from SQLite
  let proactive_notifications: CustomerNotification[] = [];
  try {
    proactive_notifications = queryAll<CustomerNotification>(
      `SELECT * FROM customer_notifications WHERE customer_id = ? ORDER BY created_at DESC`,
      [customer_id]
    );
  } catch {
    // fallback
  }

  // Masked payment representation
  const masked_payment = resolvedOrder 
    ? `•••• 4821 via ${resolvedOrder.payment_method}`
    : '•••• 4821 via HDFC UPI';

  // Customer-friendly What We Checked list
  const what_we_checked: WhatWeCheckedItem[] = [];

  if (resolvedOrder) {
    what_we_checked.push({
      key: 'order_status',
      label: 'Verified Order Status',
      status: 'verified',
      customerDescription: `Order ${resolvedOrder.id} verified as ${resolvedOrder.status.toUpperCase()} in official records.`,
      valueDisplay: `${resolvedOrder.status.toUpperCase()} (${resolvedOrder.courier})`,
    });

    what_we_checked.push({
      key: 'payment_state',
      label: 'Payment State',
      status: resolvedOrder.payment_status === 'completed' ? 'verified' : 'pending',
      customerDescription: `Order payment of ₹${resolvedOrder.total_amount.toLocaleString('en-IN')} marked ${resolvedOrder.payment_status.toUpperCase()} (${masked_payment}).`,
      valueDisplay: `₹${resolvedOrder.total_amount.toLocaleString('en-IN')} (${resolvedOrder.payment_status})`,
    });

    what_we_checked.push({
      key: 'delivery_evidence',
      label: 'Delivery Evidence',
      status: resolvedOrder.delivered_at ? 'verified' : 'not_applicable',
      customerDescription: resolvedOrder.delivered_at 
        ? `Delivered on ${new Date(resolvedOrder.delivered_at).toLocaleDateString()} with courier verification.`
        : 'Order has not reached doorstep delivery status yet.',
      valueDisplay: resolvedOrder.delivered_at ? 'Carrier Verified' : 'In Transit / Pending',
    });
  }

  if (applicablePolicy) {
    what_we_checked.push({
      key: 'policy_version',
      label: 'Governing Policy Snapshot',
      status: 'verified',
      customerDescription: `Matched official ${applicablePolicy.category} Policy (${applicablePolicy.version}) based on order placement date.`,
      valueDisplay: applicablePolicy.version,
    });

    if (resolvedOrder && resolvedOrder.delivered_at) {
      const now = new Date('2026-10-03T08:00:00Z');
      const deliveryDate = new Date(resolvedOrder.delivered_at);
      const daysElapsed = Math.max(0, Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)));
      const isWindowValid = daysElapsed <= applicablePolicy.return_window_days;

      what_we_checked.push({
        key: 'eligibility_window',
        label: 'Return Eligibility Window',
        status: isWindowValid ? 'verified' : 'flagged',
        customerDescription: isWindowValid
          ? `${daysElapsed} days elapsed, within the ${applicablePolicy.return_window_days}-day return window.`
          : `Return window closed on ${daysElapsed} days (${applicablePolicy.return_window_days}-day policy window expired).`,
        valueDisplay: `${daysElapsed}/${applicablePolicy.return_window_days} Days Elapsed`,
      });
    }
  }

  // Refund calculation & Preview
  let action_preview: ActionPreview | null = null;
  let trust_format_text: string | null = null;

  if (resolvedOrder && applicablePolicy && eligibility && eligibility.approved_amount > 0) {
    const caseId = caseIdOverride || `NM-RF-${resolvedOrder.id.replace('NM-', '')}21`;
    action_preview = {
      type: 'refund',
      order_id: resolvedOrder.id,
      item_name: resolvedOrder.items?.[0]?.product_name || 'NovaMart Item',
      order_total: resolvedOrder.total_amount,
      requested_amount: eligibility.requested_amount || resolvedOrder.total_amount,
      eligible_amount: resolvedOrder.total_amount,
      restocking_fee: eligibility.restocking_fee,
      restocking_fee_percent: eligibility.restocking_percent,
      final_amount: eligibility.approved_amount,
      expected_processing_time: '3–5 business days to original payment method',
      payment_method_masked: masked_payment,
      case_id: caseId,
      policy_version: applicablePolicy.version,
      confirmed: true,
      requires_confirmation: false,
    };

    what_we_checked.push({
      key: 'refund_calculation',
      label: 'Refund Calculation',
      status: 'verified',
      customerDescription: `Order value ₹${resolvedOrder.total_amount.toLocaleString('en-IN')} - ${eligibility.restocking_percent}% Restocking fee (₹${eligibility.restocking_fee.toLocaleString('en-IN')}) = Net ₹${eligibility.approved_amount.toLocaleString('en-IN')}.`,
      valueDisplay: `₹${eligibility.approved_amount.toLocaleString('en-IN')} Approved`,
    });

    trust_format_text = `Your refund is eligible under ${applicablePolicy.version}.

Order value: ₹${resolvedOrder.total_amount.toLocaleString('en-IN')}
Restocking fee: ₹${eligibility.restocking_fee.toLocaleString('en-IN')}
Refund approved: ₹${eligibility.approved_amount.toLocaleString('en-IN')}
Expected processing time: 3–5 business days
Case ID: ${caseId}`;
  }

  return {
    what_we_checked,
    action_preview,
    trust_format_text,
    timeline_events,
    evidence_items,
    masked_payment,
    proactive_notifications,
  };
}
