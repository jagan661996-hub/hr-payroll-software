export interface EmployeeFull {
  id: number;
  employee_code: string;
  full_name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  photo_path: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  blood_group: string | null;
  nationality: string | null;
  designation_id: number | null;
  designation_title: string | null;
  department_id: number | null;
  department_name: string | null;
  branch_id: number | null;
  branch_name: string | null;
  shift_id: number | null;
  date_of_joining: string;
  date_of_confirmation: string | null;
  date_of_leaving: string | null;
  employment_type: string | null;
  reporting_manager_id: number | null;
  reporting_manager_name: string | null;
  work_location: string | null;
  grade: string | null;
  cost_center: string | null;
  employee_category: string | null;
  probation_end_date: string | null;
  notice_period_days: number | null;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
}

export interface PersonalDetails {
  father_name: string | null;
  mother_name: string | null;
  spouse_name: string | null;
  religion: string | null;
  personal_email: string | null;
  personal_mobile: string | null;
  alternate_mobile: string | null;
  current_address: string | null;
  permanent_address: string | null;
  same_as_permanent: number;
  city: string | null;
  state: string | null;
  country: string | null;
  pin_code: string | null;
}

export interface Identity {
  pan_number: string | null;
  aadhaar_number: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  driving_licence_number: string | null;
  driving_licence_expiry: string | null;
  voter_id: string | null;
  uan_number: string | null;
  pf_number: string | null;
  esi_number: string | null;
}

export interface OfficeContact {
  official_email: string | null;
  extension_number: string | null;
  office_mobile: string | null;
}

export interface EmergencyContact {
  id: number;
  contact_name: string;
  relationship: string | null;
  mobile_number: string | null;
  alternate_number: string | null;
  address: string | null;
}

export interface Experience {
  id: number;
  previous_company: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  date_joined: string | null;
  date_left: string | null;
  total_experience_months: number | null;
  last_drawn_salary: number | null;
  reason_for_leaving: string | null;
  previous_employee_id: string | null;
}

export interface Education {
  id: number;
  qualification: string;
  specialization: string | null;
  institution: string | null;
  university_board: string | null;
  year_of_passing: number | null;
  percentage_cgpa: number | null;
  mode_of_education: string | null;
}

export interface Dependent {
  id: number;
  dependent_name: string;
  relationship: string | null;
  date_of_birth: string | null;
  gender: string | null;
  occupation: string | null;
  mobile_number: string | null;
  email: string | null;
  address: string | null;
  id_number: string | null;
  is_nominee: number;
  nominee_percentage: number | null;
  medical_insurance_eligible: number;
  remarks: string | null;
}

export interface ExitDetails {
  exit_type: string | null;
  resignation_date: string | null;
  last_working_date: string | null;
  notice_period_days: number | null;
  notice_period_served: number;
  notice_period_waived: number;
  reason_for_leaving: string | null;
  exit_interview_date: string | null;
  exit_interview_remarks: string | null;
  company_assets_returned: number;
  no_due_status: string | null;
  fnf_status: string | null;
  settlement_date: string | null;
  final_settlement_amount: number | null;
  remarks: string | null;
}

export interface EmployeeDocument {
  id: number;
  document_name: string;
  document_type: string;
  uploaded_at: string;
}

export interface EmployeeProfile {
  employee: EmployeeFull;
  personal: PersonalDetails | null;
  identity: Identity | null;
  officeContact: OfficeContact | null;
  emergencyContacts: EmergencyContact[];
  experience: Experience[];
  education: Education[];
  dependents: Dependent[];
  exitDetails: ExitDetails | null;
  documents: EmployeeDocument[];
}
