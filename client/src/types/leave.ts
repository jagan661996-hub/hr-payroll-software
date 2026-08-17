export interface LeaveType {
  id: number;
  name: string;
  paid: number;
  default_annual_days: number;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee_name: string;
  leave_type_name: string;
}

export interface LeaveBalance {
  employee_id: number;
  leave_type_id: number;
  year: number;
  opening_balance: number;
  accrued: number;
  used: number;
}

export interface LeaveImportResult {
  sheetsProcessed: string[];
  sheetsSkipped: string[];
  employeesUpdated: { name: string; year: number; totalDays: number }[];
  employeesUnmatched: string[];
}
