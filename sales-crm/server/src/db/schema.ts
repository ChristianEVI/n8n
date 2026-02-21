import Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_key TEXT NOT NULL,
      project_suffix TEXT,
      project_number_raw TEXT,
      source_id TEXT,
      data_source TEXT NOT NULL,
      client_name TEXT,
      inquiry_date TEXT,
      drug_raw TEXT,
      inn TEXT,
      brand_name TEXT,
      item_type TEXT,
      classification_reason TEXT,
      inquiry_type TEXT,
      quantity TEXT,
      contact_name TEXT,
      contact_email TEXT,
      qualified TEXT,
      trigger_qualification TEXT,
      intended_use TEXT,
      transportation TEXT,
      ema_medicine_name TEXT,
      ema_active_substance TEXT,
      ema_atc_code TEXT,
      ema_biosimilar TEXT,
      ema_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_project_key ON inquiries(project_key);
    CREATE INDEX IF NOT EXISTS idx_inquiries_inn ON inquiries(inn);
    CREATE INDEX IF NOT EXISTS idx_inquiries_brand ON inquiries(brand_name);
    CREATE INDEX IF NOT EXISTS idx_inquiries_client ON inquiries(client_name);
    CREATE INDEX IF NOT EXISTS idx_inquiries_date ON inquiries(inquiry_date);

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      normalized_name TEXT,
      industry TEXT,
      country TEXT,
      website TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT CHECK(role IN ('SCIENTIST','ECONOMIC_BUYER','LOGISTICS','SPOC','OTHER')) DEFAULT 'OTHER',
      role_description TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_role ON contacts(role);

    CREATE TABLE IF NOT EXISTS inquiry_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER REFERENCES inquiries(id),
      contact_id INTEGER REFERENCES contacts(id),
      role_in_inquiry TEXT,
      UNIQUE(inquiry_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id),
      contact_id INTEGER REFERENCES contacts(id),
      inquiry_id INTEGER REFERENCES inquiries(id),
      subject TEXT,
      sent_date TEXT,
      direction TEXT CHECK(direction IN ('OUTBOUND','INBOUND')),
      status TEXT CHECK(status IN ('SENT','DRAFT','PLANNED','RECEIVED')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_email_account ON email_log(account_id);
    CREATE INDEX IF NOT EXISTS idx_email_contact ON email_log(contact_id);

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id),
      contact_id INTEGER REFERENCES contacts(id),
      inquiry_id INTEGER REFERENCES inquiries(id),
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')) DEFAULT 'MEDIUM',
      status TEXT CHECK(status IN ('OPEN','IN_PROGRESS','DONE','CANCELLED')) DEFAULT 'OPEN',
      task_type TEXT CHECK(task_type IN (
        'FOLLOW_UP_EMAIL','QUOTE_REMINDER','REORDER_REMINDER','QUALIFICATION_CHECK','GENERAL'
      )) DEFAULT 'GENERAL',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

    CREATE TABLE IF NOT EXISTS molecule_lookup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inn TEXT NOT NULL,
      brand_name TEXT,
      atc_code TEXT,
      is_biosimilar INTEGER DEFAULT 0,
      ema_url TEXT,
      notes TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_molecule_inn_brand ON molecule_lookup(inn, COALESCE(brand_name,''));
  `);
}
