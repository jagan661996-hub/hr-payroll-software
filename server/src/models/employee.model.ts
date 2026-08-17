export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  designation_id: number | null;
  department_id: number | null;
  branch_id: number | null;
  shift_id: number | null;
  date_of_joining: string;
  date_of_leaving: string | null;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
  created_at: string;
}

export interface EmployeeWithDetails extends Employee {
  designation_title: string | null;
  department_name: string | null;
  branch_name: string | null;
}
