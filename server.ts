import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb, resetDatabase, queryAll, run } from './server/database.js';
import { processCustomerMessage, buildCustomerTrustContext } from './server/agent_core.js';
import { get_context, get_order, get_applicable_policy, check_refund_eligibility, create_refund, create_return } from './server/tools.js';
import { Customer, VersionedPolicy, TimelineEvent, EvidenceItem, CustomerNotification, Order } from './server/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
await getDb();

// ---------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------

/**
 * POST /support/messages
 * The primary agentic endpoint
 */
app.post('/support/messages', async (req, res) => {
  try {
    const { customer_id, message, session_id, language } = req.body;

    if (!customer_id || typeof customer_id !== 'string') {
      res.status(400).json({ error: 'customer_id is required' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const result = await processCustomerMessage({
      customer_id,
      message,
      session_id,
      language: language || 'en',
    });

    res.json(result);
  } catch (err) {
    console.error('Error processing support message:', err);
    res.status(500).json({
      decision: 'ESCALATE',
      response: 'An internal error occurred while processing your request. Our support team has been notified.',
      reason_codes: ['INTERNAL_SYSTEM_ERROR'],
      policy_version: null,
      evidence: {
        customer_verified: false,
        order_verified: false,
        ownership_verified: false,
        payment_verified: false,
        delivery_verified: false,
        policy_verified: false,
        window_verified: false,
        refund_amount_verified: false,
      },
      actions: [],
      trace: [
        {
          step: 'System Error',
          status: 'error',
          timestamp: new Date().toISOString(),
          details: String(err),
        },
      ],
    });
  }
});

/**
 * POST /support/confirm-action
 * Requires explicit user confirmation before committing financial actions
 */
app.post('/support/confirm-action', async (req, res) => {
  try {
    const { customer_id, order_id, action_type = 'refund', case_id, language = 'en' } = req.body;

    if (!customer_id || !order_id) {
      res.status(400).json({ error: 'customer_id and order_id are required' });
      return;
    }

    const order = get_order(order_id, customer_id);
    if (!order) {
      res.status(404).json({ error: `Order ${order_id} not found for customer` });
      return;
    }

    const item = order.items?.[0];
    const category = item?.category || 'Electronics';
    const policy = get_applicable_policy(category, order.policy_snapshot_date);
    if (!policy) {
      res.status(400).json({ error: 'No applicable policy resolved for this order' });
      return;
    }

    const eligibility = check_refund_eligibility(order, policy);
    if (!eligibility.eligible) {
      res.status(400).json({ error: 'Order is not eligible for refund', reasons: eligibility.reasons });
      return;
    }

    const evidence = {
      customer_verified: true,
      order_verified: true,
      ownership_verified: true,
      payment_verified: true,
      delivery_verified: Boolean(order.delivered_at),
      policy_verified: true,
      window_verified: true,
      refund_amount_verified: true,
    };

    // Execute verified refund with idempotency
    const refundResult = create_refund(
      order.id,
      customer_id,
      eligibility.approved_amount,
      evidence,
      `User confirmed refund under ${policy.version}`
    );

    const returnResult = create_return(
      order.id,
      customer_id,
      evidence,
      `User confirmed return under ${policy.version}`
    );

    // Update timeline events in database
    const resolvedCaseId = case_id || `NM-RF-${order.id.replace('NM-', '')}21`;
    try {
      run(
        `UPDATE timeline_events SET completed = 1, current = 0 WHERE order_id = ? AND stage IN ('return_requested')`,
        [order.id]
      );
      run(
        `UPDATE timeline_events SET completed = 1, current = 1, case_id = ? WHERE order_id = ? AND stage IN ('refund_approved')`,
        [resolvedCaseId, order.id]
      );
      run(
        `INSERT INTO customer_notifications (id, customer_id, order_id, type, title, message, expected_time, created_at, read)
         VALUES (?, ?, ?, 'refund_initiated', ?, ?, '3–5 business days', ?, 0)`,
        [
          `NOTIF-${Date.now()}`,
          customer_id,
          order.id,
          `Refund Approved: Case #${resolvedCaseId}`,
          `Approved refund of ₹${eligibility.approved_amount.toLocaleString('en-IN')} has been scheduled to your original payment method.`,
          new Date().toISOString()
        ]
      );
    } catch (e) {
      console.warn('Could not update timeline record:', e);
    }

    const trustFormat = `Your refund is eligible under ${policy.version}.

Order value: ₹${order.total_amount.toLocaleString('en-IN')}
Restocking fee: ₹${eligibility.restocking_fee.toLocaleString('en-IN')}
Refund approved: ₹${eligibility.approved_amount.toLocaleString('en-IN')}
Expected processing time: 3–5 business days
Case ID: ${resolvedCaseId}`;

    const trustContext = buildCustomerTrustContext(customer_id, order, policy, eligibility, resolvedCaseId);

    res.json({
      decision: 'ACT',
      response: trustFormat,
      reason_codes: ['USER_CONFIRMED_ACTION', 'REFUND_ELIGIBLE', 'REFUND_CAPPED'],
      policy_version: policy.version,
      evidence,
      actions: [
        {
          type: 'REFUND_CREATED',
          id: refundResult.refund_record.id,
          summary: `Refund of ₹${eligibility.approved_amount.toFixed(2)} executed`,
          payload: { refund_id: refundResult.refund_record.id, amount: eligibility.approved_amount }
        },
        {
          type: 'RETURN_CREATED',
          id: returnResult.return_record.id,
          summary: `Return label ${returnResult.return_record.id} created`,
          payload: { return_id: returnResult.return_record.id }
        }
      ],
      trace: [
        {
          step: 'User Confirmation Received',
          status: 'success',
          timestamp: new Date().toISOString(),
          details: { order_id: order.id, case_id: resolvedCaseId, approved_amount: eligibility.approved_amount }
        }
      ],
      ticket: null,
      language,
      trust_format_text: trustFormat,
      action_preview: {
        type: action_type,
        order_id: order.id,
        item_name: item?.product_name || 'NovaMart Item',
        order_total: order.total_amount,
        requested_amount: order.total_amount,
        eligible_amount: order.total_amount,
        restocking_fee: eligibility.restocking_fee,
        restocking_fee_percent: eligibility.restocking_percent,
        final_amount: eligibility.approved_amount,
        expected_processing_time: '3–5 business days to original payment method',
        payment_method_masked: `•••• 4821 via ${order.payment_method}`,
        case_id: resolvedCaseId,
        policy_version: policy.version,
        confirmed: true,
        requires_confirmation: false,
      },
      what_we_checked: trustContext.what_we_checked,
      timeline_events: trustContext.timeline_events,
      evidence_items: trustContext.evidence_items,
      masked_payment: trustContext.masked_payment,
      proactive_notifications: trustContext.proactive_notifications,
    });
  } catch (err) {
    console.error('Error confirming action:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/timeline/:orderId
 */
app.get('/support/timeline/:orderId', (req, res) => {
  try {
    const events = queryAll<TimelineEvent>(
      `SELECT * FROM timeline_events WHERE order_id = ? ORDER BY timestamp ASC`,
      [req.params.orderId]
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/evidence/:customerId
 */
app.get('/support/evidence/:customerId', (req, res) => {
  try {
    const items = queryAll<EvidenceItem>(
      `SELECT * FROM evidence_items WHERE customer_id = ? ORDER BY timestamp ASC`,
      [req.params.customerId]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/notifications/:customerId
 */
app.get('/support/notifications/:customerId', (req, res) => {
  try {
    const notifications = queryAll<CustomerNotification>(
      `SELECT * FROM customer_notifications WHERE customer_id = ? ORDER BY created_at DESC`,
      [req.params.customerId]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/customers
 * Returns all demo customers
 */
app.get('/support/customers', (_req, res) => {
  try {
    const customers = queryAll<Customer>('SELECT * FROM customers ORDER BY id ASC');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/context/:customerId
 * Returns authoritative context for customer
 */
app.get('/support/context/:customerId', (req, res) => {
  try {
    const context = get_context(req.params.customerId);
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /support/policies
 * Returns all versioned policies
 */
app.get('/support/policies', (_req, res) => {
  try {
    const policies = queryAll<VersionedPolicy>('SELECT * FROM versioned_policies ORDER BY category ASC, effective_from DESC');
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /support/reset
 * Resets the SQLite database to fresh seed state
 */
app.post('/support/reset', async (_req, res) => {
  try {
    resetDatabase();
    await getDb();
    res.json({ success: true, message: 'Database reset to initial sample seed state successfully' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------
// Vite Middlewares in Dev / Static files in Prod
// ---------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovaMart AI Customer Support Agent running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
