-- HR Payroll Software - Migration 003: Full Employee Profile
-- Extends the core employees table with additional Basic/Work Information
-- fields, and adds one table per remaining profile section. employee_id
-- is the shared foreign key throughout, per the module spec.

-- ===== Extend employees: Basic Information + Work Information =====
ALTER TABLE employees ADD COLUMN first_name TEXT;
ALTER TABLE employees ADD COLUMN middle_name TEXT;
ALTER TABLE employees ADD COLUMN last_name TEXT;
ALTER TABLE employees ADD COLUMN photo_path TEXT;
ALTER TABLE employees ADD COLUMN date_of_birth TEXT;
ALTER TABLE employees ADD COLUMN gender TEXT;
ALTER TABLE employees ADD COLUMN marital_status TEXT;
ALTER TABLE employees ADD COLUMN blood_group TEXT;
ALTER TABLE employees ADD COLUMN nationality TEXT;
ALTER TABLE employees ADD COLUMN date_of_confirmation TEXT;
ALTER TABLE employees ADD COLUMN employment_type TEXT;
ALTER TABLE employees ADD COLUMN reporting_manager_id INTEGER REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN work_location TEXT;
ALTER TABLE employees ADD COLUMN grade TEXT;
ALTER TABLE employees ADD COLUMN cost_center TEXT;
ALTER TABLE employees ADD COLUMN employee_category TEXT;
ALTER TABLE employees ADD COLUMN probation_end_date TEXT;
ALTER TABLE employees ADD COLUMN notice_period_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_employees_reporting_manager ON employees(reporting_manager_id);

-- ===== Personal Details (1:1) =====
CREATE TABLE IF NOT EXISTS employee_personal_details (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  father_name TEXT,
  mother_name TEXT,
  spouse_name TEXT,
  religion TEXT,
  personal_email TEXT,
  personal_mobile TEXT,
  alternate_mobile TEXT,
  current_address TEXT,
  permanent_address TEXT,
  same_as_permanent INTEGER DEFAULT 0,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pin_code TEXT
);

-- ===== Identity Information (1:1) - sensitive, access-restricted at the API layer =====
CREATE TABLE IF NOT EXISTS employee_identity (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  pan_number TEXT,
  aadhaar_number TEXT,
  passport_number TEXT,
  passport_expiry TEXT,
  driving_licence_number TEXT,
  driving_licence_expiry TEXT,
  voter_id TEXT,
  uan_number TEXT,
  pf_number TEXT,
  esi_number TEXT
);

-- ===== Office Contact (1:1) =====
CREATE TABLE IF NOT EXISTS employee_office_contact (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  official_email TEXT,
  extension_number TEXT,
  office_mobile TEXT
);

-- ===== Emergency Contacts (repeatable) =====
CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT,
  mobile_number TEXT,
  alternate_number TEXT,
  address TEXT
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_employee ON employee_emergency_contacts(employee_id);

-- ===== Work Experience (repeatable) =====
CREATE TABLE IF NOT EXISTS employee_experience (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  previous_company TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  location TEXT,
  date_joined TEXT,
  date_left TEXT,
  total_experience_months INTEGER,
  last_drawn_salary REAL,
  reason_for_leaving TEXT,
  previous_employee_id TEXT,
  experience_certificate_path TEXT,
  relieving_letter_path TEXT
);
CREATE INDEX IF NOT EXISTS idx_experience_employee ON employee_experience(employee_id);

-- ===== Education Details (repeatable) =====
CREATE TABLE IF NOT EXISTS employee_education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  specialization TEXT,
  institution TEXT,
  university_board TEXT,
  year_of_passing INTEGER,
  percentage_cgpa REAL,
  mode_of_education TEXT,
  certificate_path TEXT
);
CREATE INDEX IF NOT EXISTS idx_education_employee ON employee_education(employee_id);

-- ===== Dependent Details (repeatable) =====
CREATE TABLE IF NOT EXISTS employee_dependents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  dependent_name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth TEXT,
  gender TEXT,
  occupation TEXT,
  mobile_number TEXT,
  email TEXT,
  address TEXT,
  id_number TEXT,
  is_nominee INTEGER DEFAULT 0,
  nominee_percentage REAL,
  medical_insurance_eligible INTEGER DEFAULT 0,
  remarks TEXT
);
CREATE INDEX IF NOT EXISTS idx_dependents_employee ON employee_dependents(employee_id);

-- ===== Exit Details (1:1) - only meaningful once status != ACTIVE, enforced in the UI/API, not the schema =====
CREATE TABLE IF NOT EXISTS employee_exit_details (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  exit_type TEXT,
  resignation_date TEXT,
  last_working_date TEXT,
  notice_period_days INTEGER,
  notice_period_served INTEGER DEFAULT 0,
  notice_period_waived INTEGER DEFAULT 0,
  reason_for_leaving TEXT,
  exit_interview_date TEXT,
  exit_interview_remarks TEXT,
  resignation_letter_path TEXT,
  company_assets_returned INTEGER DEFAULT 0,
  no_due_status TEXT,
  fnf_status TEXT,
  settlement_date TEXT,
  relieving_letter_path TEXT,
  experience_letter_path TEXT,
  final_settlement_amount REAL,
  remarks TEXT
);

-- ===== Employee Documents (repeatable, any category) =====
CREATE TABLE IF NOT EXISTS employee_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON employee_documents(employee_id);
