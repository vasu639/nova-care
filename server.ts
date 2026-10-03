import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb, resetDatabase, queryAll } from './server/database.js';
import { processCustomerMessage } from './server/agent_core.js';
import { get_context } from './server/tools.js';
import { Customer, VersionedPolicy } from './server/types.js';

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
    const { customer_id, message, session_id } = req.body;

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
