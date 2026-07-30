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

// Shape returned to the client - joined with human-readable names
// instead of raw foreign keys, since the UI never wants to look up
// "designation_id: 2" on its own.
export interface EmployeeWithDetails extends Employee {
  designation_title: string | null;
  department_name: string | null;
  branch_name: string | null;
}
