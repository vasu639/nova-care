import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { Customer, Order, OrderItem, Product, SupportTicket, VersionedPolicy, RefundRecord, ReturnRecord } from './types.js';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'novamart.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      return dbInstance;
    } catch {
      // If corrupted, re-seed
    }
  }

  dbInstance = new SQL.Database();
  initSchemaAndSeed(dbInstance);
  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

export function resetDatabase(): void {
  if (!dbInstance) return;
  dbInstance.close();
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  dbInstance = null;
}

function initSchemaAndSeed(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      risk_score REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      returnable INTEGER NOT NULL DEFAULT 1,
      warranty_months INTEGER NOT NULL DEFAULT 12
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      courier TEXT NOT NULL,
      placed_at TEXT NOT NULL,
      delivered_at TEXT,
      policy_snapshot_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      delivery_otp_verified INTEGER NOT NULL DEFAULT 0,
      shipping_address TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS versioned_policies (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      version TEXT NOT NULL,
      effective_from TEXT NOT NULL,
      effective_to TEXT,
      return_window_days INTEGER NOT NULL,
      restocking_percent REAL NOT NULL,
      approval_threshold REAL NOT NULL,
      allow_opened_items INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      issue_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL,
      current_owner TEXT DEFAULT 'Senior Care Specialist (Priya N.)',
      expected_next_update TEXT DEFAULT 'Within 24 business hours',
      case_summary TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      current INTEGER NOT NULL DEFAULT 0,
      case_id TEXT,
      owner TEXT,
      expected_update TEXT
    );

    CREATE TABLE IF NOT EXISTS evidence_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT NOT NULL,
      acknowledged_prior INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_notifications (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      expected_time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_snapshot TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_snapshot TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      message TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Seed Policies:
  // Electronics v2025.2: Generous 30 days window, 0% restocking fee, threshold 25000 (Effective 2025-06-01 to 2025-12-31)
  // Electronics v2026.1: Current policy: 14 days window, 5% restocking fee, threshold 15000 (Effective 2026-01-01 onwards)
  // Apparel v2026.1: 30 days window, 0% restocking fee, threshold 8000
  // Home & Kitchen v2026.1: 10 days window, 10% restocking fee, threshold 12000
  db.run(`
    INSERT INTO versioned_policies VALUES
      ('POL-ELEC-2025', 'Electronics', 'ELECTRONICS-2025.2', '2025-06-01', '2025-12-31', 30, 0.0, 25000.0, 1, 'Legacy Electronics Policy: 30-day window, zero restocking fee, threshold ₹25,000'),
      ('POL-ELEC-2026', 'Electronics', 'ELECTRONICS-2026.1', '2026-01-01', NULL, 14, 5.0, 15000.0, 1, 'Standard Electronics Policy: 14-day window, 5% restocking fee, approval threshold ₹15,000'),
      ('POL-APP-2026', 'Apparel', 'APPAREL-2026.1', '2026-01-01', NULL, 30, 0.0, 8000.0, 1, 'Standard Apparel Policy: 30-day return window, no restocking fee, approval threshold ₹8,000'),
      ('POL-HOME-2026', 'Home', 'HOME-2026.1', '2026-01-01', NULL, 10, 10.0, 12000.0, 0, 'Home & Kitchen Policy: 10-day return window, 10% restocking fee, unopened items only');
  `);

  // Seed Customers:
  // C-100: Ananya Sharma (Standard verified user, low risk 0.05)
  // C-200: Rajesh Patel (Normal user with ambiguous orders & OTP delivery, low risk 0.12)
  // C-300: Vikram Mehta (High risk flagged user, risk 0.85 -> triggers fraud escalation)
  // C-400: Pooja Rao (Legacy boundary customer, low risk 0.08)
  db.run(`
    INSERT INTO customers VALUES
      ('C-100', 'Ananya Sharma', 'ananya.sharma@example.com', '+91 98765 43210', 0.05, '2025-02-10T10:00:00Z'),
      ('C-200', 'Rajesh Patel', 'rajesh.patel@example.com', '+91 98111 22334', 0.12, '2025-03-15T14:30:00Z'),
      ('C-300', 'Vikram Mehta', 'vikram.mehta@example.com', '+91 99999 88888', 0.85, '2025-08-01T09:15:00Z'),
      ('C-400', 'Pooja Rao', 'pooja.rao@example.com', '+91 97777 66666', 0.08, '2025-01-20T11:20:00Z');
  `);

  // Seed Products:
  db.run(`
    INSERT INTO products VALUES
      ('PROD-101', 'NovaPulse ANC Wireless Headphones', 'Electronics', 2400.0, 1, 12),
      ('PROD-102', 'TitanPro 16 Ultra Laptop', 'Electronics', 78000.0, 1, 24),
      ('PROD-103', 'ErgoBreeze Desk Fan', 'Home', 1500.0, 1, 6),
      ('PROD-201', 'NovaPhone 14 5G 128GB', 'Electronics', 35000.0, 1, 12),
      ('PROD-202', 'Vintage Denim Jacket', 'Apparel', 3200.0, 1, 3),
      ('PROD-203', 'NovaSound Pocket Speaker (Black)', 'Electronics', 1800.0, 1, 12),
      ('PROD-204', 'NovaSound Pocket Speaker (Teal)', 'Electronics', 1800.0, 1, 12),
      ('PROD-401', 'NovaTab 10 Pro Tablet', 'Electronics', 18500.0, 1, 12);
  `);

  // Current reference simulated time in 2026-10:
  // NM-1001: Delivered 4 days ago (2026-09-29), Eligible refund, Total 2400
  // NM-1002: Delivered 2 days ago (2026-10-01), Laptop, Total 78000 (> 15000 approval threshold)
  // NM-1003: Placed 1 day ago (2026-10-02), Pending payment, Total 1500
  // NM-2001: Delivered 3 days ago (2026-09-30) with OTP verification = 1 (Customer claims never arrived -> OTP Contradiction)
  // NM-2002: Delivered 45 days ago (2026-08-15) -> Expired return window
  // NM-2003: Delivered 5 days ago (2026-09-28) -> Pocket Speaker Black (Ambiguous with NM-2004)
  // NM-2004: Delivered 5 days ago (2026-09-28) -> Pocket Speaker Teal (Ambiguous with NM-2003)
  // NM-3001: Delivered 2 days ago (2026-10-01) -> Owned by high-risk Vikram Mehta (Risk 0.85)
  // NM-4001: Delivered in Dec 2025 during Policy v2025.2 snapshot
  db.run(`
    INSERT INTO orders VALUES
      ('NM-1001', 'C-100', 'delivered', 'TRK-BLUEDART-8821', 'BlueDart', '2026-09-26T10:00:00Z', '2026-09-29T14:30:00Z', '2026-09-26', 2400.0, 'INR', 0, 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru, 560038', 'completed', 'UPI'),
      ('NM-1002', 'C-100', 'delivered', 'TRK-DELHIVERY-9932', 'Delhivery Express', '2026-09-28T11:00:00Z', '2026-10-01T16:00:00Z', '2026-09-28', 78000.0, 'INR', 1, 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru, 560038', 'completed', 'Credit Card'),
      ('NM-1003', 'C-100', 'pending_payment', 'TRK-PENDING-001', 'Standard Courier', '2026-10-02T08:00:00Z', NULL, '2026-10-02', 1500.0, 'INR', 0, 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru, 560038', 'pending', 'NetBanking'),
      ('NM-2001', 'C-200', 'delivered', 'TRK-BLUEDART-7742', 'BlueDart Secure', '2026-09-27T09:00:00Z', '2026-09-30T13:45:00Z', '2026-09-27', 35000.0, 'INR', 1, 'Plot 12, Sunrise Residency, Juhu, Mumbai, 400049', 'completed', 'Credit Card'),
      ('NM-2002', 'C-200', 'delivered', 'TRK-EKART-4411', 'Ekart Logistics', '2026-08-10T12:00:00Z', '2026-08-15T15:20:00Z', '2026-08-10', 3200.0, 'INR', 0, 'Plot 12, Sunrise Residency, Juhu, Mumbai, 400049', 'completed', 'Debit Card'),
      ('NM-2003', 'C-200', 'delivered', 'TRK-DELHIVERY-5521', 'Delhivery', '2026-09-25T14:00:00Z', '2026-09-28T11:00:00Z', '2026-09-25', 1800.0, 'INR', 0, 'Plot 12, Sunrise Residency, Juhu, Mumbai, 400049', 'completed', 'UPI'),
      ('NM-2004', 'C-200', 'delivered', 'TRK-DELHIVERY-5522', 'Delhivery', '2026-09-25T15:00:00Z', '2026-09-28T12:00:00Z', '2026-09-25', 1800.0, 'INR', 0, 'Plot 12, Sunrise Residency, Juhu, Mumbai, 400049', 'completed', 'UPI'),
      ('NM-3001', 'C-300', 'delivered', 'TRK-SHADOW-1123', 'Shadowfax', '2026-09-28T16:00:00Z', '2026-10-01T10:00:00Z', '2026-09-28', 2400.0, 'INR', 0, 'House 88, Civil Lines, Jaipur, 302006', 'completed', 'Cash on Delivery'),
      ('NM-4001', 'C-400', 'delivered', 'TRK-BLUEDART-3312', 'BlueDart', '2025-12-15T10:00:00Z', '2025-12-18T14:00:00Z', '2025-12-15', 18500.0, 'INR', 1, 'Sector 14, Hiranandani Estate, Thane, 400607', 'completed', 'Credit Card');
  `);

  // Seed Order Items:
  db.run(`
    INSERT INTO order_items VALUES
      ('ITEM-1001-1', 'NM-1001', 'PROD-101', 1, 2400.0, 2400.0),
      ('ITEM-1002-1', 'NM-1002', 'PROD-102', 1, 78000.0, 78000.0),
      ('ITEM-1003-1', 'NM-1003', 'PROD-103', 1, 1500.0, 1500.0),
      ('ITEM-2001-1', 'NM-2001', 'PROD-201', 1, 35000.0, 35000.0),
      ('ITEM-2002-1', 'NM-2002', 'PROD-202', 1, 3200.0, 3200.0),
      ('ITEM-2003-1', 'NM-2003', 'PROD-203', 1, 1800.0, 1800.0),
      ('ITEM-2004-1', 'NM-2004', 'PROD-204', 1, 1800.0, 1800.0),
      ('ITEM-3001-1', 'NM-3001', 'PROD-101', 1, 2400.0, 2400.0),
      ('ITEM-4001-1', 'NM-4001', 'PROD-401', 1, 18500.0, 18500.0);
  `);

  // Seed Visual Timeline Events for Order NM-1001 (Customer Ananya Sharma)
  db.run(`
    INSERT INTO timeline_events VALUES
      ('TLE-1001-1', 'NM-1001', 'C-100', 'placed', 'Order Placed & Confirmed', 'Payment of ₹2,400 completed via UPI. Items packed at Bengaluru Central Warehouse.', '2026-09-26T10:00:00Z', 1, 0, NULL, 'Automated Order Fulfillment', 'Completed'),
      ('TLE-1001-2', 'NM-1001', 'C-100', 'shipped', 'Shipped via BlueDart', 'Tracking #TRK-BLUEDART-8821 generated. Dispatched from Indiranagar sorting hub.', '2026-09-27T14:00:00Z', 1, 0, NULL, 'BlueDart Logistics', 'Delivered'),
      ('TLE-1001-3', 'NM-1001', 'C-100', 'delivered', 'Delivered to Doorstep', 'Handed over at Indiranagar address on Sep 29, 2026.', '2026-09-29T14:30:00Z', 1, 1, NULL, 'Carrier Agent #412', 'Active Window (14 Days)'),
      ('TLE-1001-4', 'NM-1001', 'C-100', 'return_requested', 'Return / Refund Request', 'Customer inquiries under Electronics Policy v2026.1.', '2026-10-03T09:00:00Z', 0, 0, 'NM-RF-4821', 'Nova AI Support Specialist', 'Awaiting User Confirmation'),
      ('TLE-1001-5', 'NM-1001', 'C-100', 'refund_approved', 'Refund Approved with Restocking Fee', '₹2,280 approved after 5% restocking fee deduction (₹120).', '2026-10-03T09:05:00Z', 0, 0, 'NM-RF-4821', 'Automated Governance Desk', 'Next: Bank Processing'),
      ('TLE-1001-6', 'NM-1001', 'C-100', 'refund_processed', 'Refund Processed to Original Payment', 'Funds credited to source UPI account ending in •••• 4821.', '2026-10-05T12:00:00Z', 0, 0, 'NM-RF-4821', 'Payment Gateway (HDFC UPI)', 'Estimated 3–5 Business Days');
  `);

  // Seed Customer-facing Evidence Items
  db.run(`
    INSERT INTO evidence_items VALUES
      ('EVD-1001-1', 'NM-1001', 'C-100', 'invoice', 'Tax Invoice Verified', 'verified', 'Official tax invoice #INV-2026-1001 verified against seller records.', 0, '2026-09-26T10:05:00Z'),
      ('EVD-1001-2', 'NM-1001', 'C-100', 'otp', 'Carrier Delivery Verification', 'verified', 'Carrier BlueDart marked doorstep delivery completed.', 0, '2026-09-29T14:30:00Z'),
      ('EVD-1001-3', 'NM-1001', 'C-100', 'photos', 'Item Condition & Box Photo', 'received', 'Customer previously uploaded unboxing photo in ticket #TKT-88120.', 1, '2026-09-30T16:00:00Z'),
      ('EVD-1001-4', 'NM-1001', 'C-100', 'prior_messages', 'Prior Chat Context', 'verified', 'Prior conversation logs reviewed; customer reported slight static noise.', 1, '2026-09-30T16:10:00Z');
  `);

  // Seed Proactive Customer Notifications
  db.run(`
    INSERT INTO customer_notifications VALUES
      ('NOTIF-101', 'C-100', 'NM-1001', 'refund_initiated', 'Refund Pre-Approved: Case #NM-RF-4821', 'Your refund of ₹2,280 is pre-approved under Electronics Policy v2026.1 (₹120 restocking fee). Awaiting your confirmation.', 'Ready for Confirmation', '2026-10-03T09:00:00Z', 0),
      ('NOTIF-102', 'C-100', 'NM-1001', 'return_pickup_scheduled', 'Return Courier Pickup Scheduled', 'BlueDart courier pickup scheduled for Oct 5, 2026 between 10:00 AM – 1:00 PM once confirmed.', 'Oct 5, 10:00 AM - 1:00 PM', '2026-10-03T09:10:00Z', 0),
      ('NOTIF-103', 'C-100', NULL, 'escalation_assigned', 'Senior Care Specialist Available', 'Senior Specialist Priya N. is on standby for live assistance at any time.', 'Instant Transfer on Demand', '2026-10-03T09:15:00Z', 0);
  `);
}

// Helpers for querying
export function queryAll<T>(sql: string, params: SqlValue[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T>(sql: string, params: SqlValue[] = []): T | null {
  const all = queryAll<T>(sql, params);
  return all.length > 0 ? all[0] : null;
}

export function run(sql: string, params: SqlValue[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  persistDb();
}
