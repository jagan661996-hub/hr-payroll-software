-- HR Payroll Software - Phase 1 draft schema
-- Field choices below are traced directly to the sample files supplied:
--   Payslip_INDF0026_Jul_2025.pdf   -> employees, salary_structures, payslips
--   Attendance.xlsx                 -> attendance_daily, attendance_summary
--   Staff_Leave_Details.xls         -> leave_types, leave_balances, leave_requests
-- This will be extended/normalized further in Phase 2 (Database) with
-- proper migrations; this file is the reference draft for review.

PRAGMA foreign_keys = ON;

-- ===================== ORG STRUCTURE =====================
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India'
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS designations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,      -- 'HH:MM'
  end_time TEXT NOT NULL,
  grace_minutes INTEGER DEFAULT 10
);

-- ===================== USERS & EMPLOYEES =====================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','HR','EMPLOYEE')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL UNIQUE,      -- e.g. 'INDF0026'
  user_id INTEGER REFERENCES users(id),
  full_name TEXT NOT NULL,                 -- e.g. 'AJEES KHAN M'
  designation_id INTEGER REFERENCES designations(id),
  department_id INTEGER REFERENCES departments(id),
  branch_id INTEGER REFERENCES branches(id),
  shift_id INTEGER REFERENCES shifts(id),
  date_of_joining TEXT NOT NULL,
  date_of_leaving TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESIGNED','TERMINATED')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===================== SALARY STRUCTURE =====================
-- Mirrors the earnings/deductions layout seen in the sample payslip.
CREATE TABLE IF NOT EXISTS salary_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  effective_from TEXT NOT NULL,
  basic REAL NOT NULL DEFAULT 0,
  dearness_allowance REAL NOT NULL DEFAULT 0,
  hra REAL NOT NULL DEFAULT 0,
  fixed_allowance REAL NOT NULL DEFAULT 0,
  conveyance REAL NOT NULL DEFAULT 0,
  medical_allowance REAL NOT NULL DEFAULT 0,
  other_allowance REAL NOT NULL DEFAULT 0,
  professional_tax REAL NOT NULL DEFAULT 0,
  epf_employee REAL NOT NULL DEFAULT 0,
  esi_employee REAL NOT NULL DEFAULT 0,
  income_tax REAL NOT NULL DEFAULT 0,
  loan_deduction REAL NOT NULL DEFAULT 0,
  advance_deduction REAL NOT NULL DEFAULT 0
);

-- ===================== ATTENDANCE =====================
-- One row per employee per calendar day; matches the P / OD / WFH /
-- Leave day-code grid seen in Attendance.xlsx.
CREATE TABLE IF NOT EXISTS attendance_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  work_date TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  status_code TEXT NOT NULL,               -- P, A, OD, WFH, HL, WO, HD
  check_in TEXT,
  check_out TEXT,
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','BIOMETRIC','EXCEL_IMPORT')),
  is_locked INTEGER DEFAULT 0,
  UNIQUE(employee_id, work_date)
);

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  holiday_date TEXT NOT NULL,
  name TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id)
);

-- ===================== ON DUTY =====================
CREATE TABLE IF NOT EXISTS on_duty_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  purpose TEXT,
  location TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approved_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===================== LEAVE =====================
CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,               -- Casual, Sick, Earned, LOP, Maternity, Paternity, Comp Off
  paid INTEGER DEFAULT 1,
  default_annual_days REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  opening_balance REAL DEFAULT 0,
  accrued REAL DEFAULT 0,
  used REAL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  days REAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approved_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PAYROLL =====================
-- One row per employee per pay period; numbers mirror the payslip PDF
-- (gross earnings, total deductions, net payable, YTD).
CREATE TABLE IF NOT EXISTS payslips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  pay_period TEXT NOT NULL,                -- 'YYYY-MM'
  pay_date TEXT,
  paid_days REAL NOT NULL,
  lop_days REAL NOT NULL DEFAULT 0,
  gross_earnings REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_pay REAL NOT NULL,
  breakdown_json TEXT NOT NULL,             -- serialized earnings/deductions detail
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, pay_period)
);

-- ===================== AUDIT =====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id INTEGER,
  details_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
