"""
NovaMart AI Customer Support Agent - FastAPI Database Layer
Compatible with SQLite (MVP default) and drop-in replaceable with PostgreSQL.
"""
import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "novamart.sqlite")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
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
        created_at TEXT NOT NULL
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
    """)

    # Seed data
    cursor.execute("SELECT COUNT(*) FROM versioned_policies")
    if cursor.fetchone()[0] == 0:
        cursor.executescript("""
        INSERT INTO versioned_policies VALUES
          ('POL-ELEC-2025', 'Electronics', 'ELECTRONICS-2025.2', '2025-06-01', '2025-12-31', 30, 0.0, 25000.0, 1, 'Legacy Electronics Policy: 30-day window, zero restocking fee, threshold ₹25,000'),
          ('POL-ELEC-2026', 'Electronics', 'ELECTRONICS-2026.1', '2026-01-01', NULL, 14, 5.0, 15000.0, 1, 'Standard Electronics Policy: 14-day window, 5% restocking fee, approval threshold ₹15,000'),
          ('POL-APP-2026', 'Apparel', 'APPAREL-2026.1', '2026-01-01', NULL, 30, 0.0, 8000.0, 1, 'Standard Apparel Policy: 30-day return window, no restocking fee, approval threshold ₹8,000');

        INSERT INTO customers VALUES
          ('C-100', 'Ananya Sharma', 'ananya.sharma@example.com', '+91 98765 43210', 0.05, '2025-02-10T10:00:00Z'),
          ('C-200', 'Rajesh Patel', 'rajesh.patel@example.com', '+91 98111 22334', 0.12, '2025-03-15T14:30:00Z'),
          ('C-300', 'Vikram Mehta', 'vikram.mehta@example.com', '+91 99999 88888', 0.85, '2025-08-01T09:15:00Z');

        INSERT INTO products VALUES
          ('PROD-101', 'NovaPulse ANC Wireless Headphones', 'Electronics', 2400.0, 1, 12),
          ('PROD-102', 'TitanPro 16 Ultra Laptop', 'Electronics', 78000.0, 1, 24),
          ('PROD-201', 'NovaPhone 14 5G 128GB', 'Electronics', 35000.0, 1, 12);

        INSERT INTO orders VALUES
          ('NM-1001', 'C-100', 'delivered', 'TRK-BLUEDART-8821', 'BlueDart', '2026-09-26T10:00:00Z', '2026-09-29T14:30:00Z', '2026-09-26', 2400.0, 'INR', 0, 'Indiranagar, Bengaluru, 560038', 'completed', 'UPI'),
          ('NM-1002', 'C-100', 'delivered', 'TRK-DELHIVERY-9932', 'Delhivery Express', '2026-09-28T11:00:00Z', '2026-10-01T16:00:00Z', '2026-09-28', 78000.0, 'INR', 1, 'Indiranagar, Bengaluru, 560038', 'completed', 'Credit Card'),
          ('NM-2001', 'C-200', 'delivered', 'TRK-BLUEDART-7742', 'BlueDart Secure', '2026-09-27T09:00:00Z', '2026-09-30T13:45:00Z', '2026-09-27', 35000.0, 'INR', 1, 'Juhu, Mumbai, 400049', 'completed', 'Credit Card');

        INSERT INTO order_items VALUES
          ('ITEM-1001-1', 'NM-1001', 'PROD-101', 1, 2400.0, 2400.0),
          ('ITEM-1002-1', 'NM-1002', 'PROD-102', 1, 78000.0, 78000.0),
          ('ITEM-2001-1', 'NM-2001', 'PROD-201', 1, 35000.0, 35000.0);
        """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("FastAPI SQLite database initialized successfully.")
