export interface OnDutyRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  from_date: string;
  to_date: string;
  purpose: string | null;
  location: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
