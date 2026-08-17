export interface AttendanceRecord {
  employee_id: number;
  work_date: string; // 'YYYY-MM-DD'
  status_code: string;
  source: "MANUAL" | "BIOMETRIC" | "EXCEL_IMPORT";
}

export interface AttendanceEmployee {
  id: number;
  full_name: string;
  employee_code: string;
}

export interface AttendanceMonthResponse {
  employees: AttendanceEmployee[];
  records: AttendanceRecord[];
}

export interface ImportResult {
  daysImported: number;
  employeesMatched: string[];
  employeesUnmatched: string[];
}
