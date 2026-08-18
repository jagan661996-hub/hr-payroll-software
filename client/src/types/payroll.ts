export interface SalaryStructure {
  id: number;
  employee_id: number;
  effective_from: string;
  basic: number;
  dearness_allowance: number;
  hra: number;
  fixed_allowance: number;
  conveyance: number;
  medical_allowance: number;
  other_allowance: number;
  professional_tax: number;
  epf_employee: number;
  esi_employee: number;
  income_tax: number;
  loan_deduction: number;
  advance_deduction: number;
}

export interface Payslip {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  pay_period: string;
  pay_date: string | null;
  paid_days: number;
  lop_days: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
}

export interface RunPayrollResult {
  payPeriod: string;
  processed: string[];
  skipped: string[];
}
