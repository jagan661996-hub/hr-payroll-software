export interface Employee {
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
  department_id: number | null;
  branch_id: number | null;
  shift_id: number | null;
  date_of_joining: string;
  date_of_confirmation: string | null;
  date_of_leaving: string | null;
  employment_type: string | null;
  reporting_manager_id: number | null;
  work_location: string | null;
  grade: string | null;
  cost_center: string | null;
  employee_category: string | null;
  probation_end_date: string | null;
  notice_period_days: number | null;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
  created_at: string;
}

export interface EmployeeWithDetails extends Employee {
  designation_title: string | null;
  department_name: string | null;
  branch_name: string | null;
  reporting_manager_name: string | null;
}
