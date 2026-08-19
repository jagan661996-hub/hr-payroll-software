-- HR Payroll Software - Migration 002: Company Settings
-- Single-row table (id is always 1) holding company-wide configuration
-- that Settings screens let Admins edit without touching code.

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'Industrial Fans India Private Limited',
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  financial_year_start_month INTEGER NOT NULL DEFAULT 4 CHECK (financial_year_start_month BETWEEN 1 AND 12)
);

INSERT OR IGNORE INTO company_settings (id, company_name, address, city, state, country)
VALUES (
  1,
  'Industrial Fans India Private Limited',
  '28 New Boag Road, CIT Nagar, Kannamapet',
  'Chennai',
  'Tamil Nadu',
  'India'
);
