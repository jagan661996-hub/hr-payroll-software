import { SalaryStructure } from "../repositories/salaryStructure.repository";
import { AttendanceRecord } from "../repositories/attendance.repository";

export interface PayrollBreakdown {
  earnings: {
    basic: number;
    dearness_allowance: number;
    hra: number;
    fixed_allowance: number;
    conveyance: number;
    medical_allowance: number;
    other_allowance: number;
  };
  deductions: {
    professional_tax: number;
    epf_employee: number;
    esi_employee: number;
    income_tax: number;
    loan_deduction: number;
    advance_deduction: number;
  };
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidDays: number;
  lopDays: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Attendance-based proration. Days with no attendance record at all
// (nothing imported/entered) are treated as fully worked - this
// matches the common case of a clean month with nothing to flag, and
// mirrors the sample payslip's "Paid Days 31 / LOP Days 0" for a
// month with full attendance.
export function calculatePayroll(
  structure: SalaryStructure,
  attendanceRecords: AttendanceRecord[],
  year: number,
  month: number
): PayrollBreakdown {
  const totalDays = daysInMonth(year, month);

  const absentDays = attendanceRecords.filter((r) => r.status_code === "A").length;
  const halfDays = attendanceRecords.filter(
    (r) => r.status_code === "HD" || r.status_code === "HALFDAY"
  ).length;
  const lopDays = absentDays + halfDays * 0.5;
  const paidDays = Math.max(0, totalDays - lopDays);
  const factor = paidDays / totalDays;

  const earningsFull = {
    basic: structure.basic,
    dearness_allowance: structure.dearness_allowance,
    hra: structure.hra,
    fixed_allowance: structure.fixed_allowance,
    conveyance: structure.conveyance,
    medical_allowance: structure.medical_allowance,
    other_allowance: structure.other_allowance
  };
  const earnings = Object.fromEntries(
    Object.entries(earningsFull).map(([k, v]) => [k, round2(v * factor)])
  ) as PayrollBreakdown["earnings"];
  const grossEarnings = round2(Object.values(earnings).reduce((a, b) => a + b, 0));

  const deductions: PayrollBreakdown["deductions"] = {
    professional_tax: structure.professional_tax,
    epf_employee: structure.epf_employee,
    esi_employee: structure.esi_employee,
    income_tax: structure.income_tax,
    loan_deduction: structure.loan_deduction,
    advance_deduction: structure.advance_deduction
  };
  const totalDeductions = round2(Object.values(deductions).reduce((a, b) => a + b, 0));
  const netPay = round2(grossEarnings - totalDeductions);

  return { earnings, deductions, grossEarnings, totalDeductions, netPay, paidDays, lopDays };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones ? `${tens}-${ONES[ones]}` : tens;
}

function threeDigitWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigitWords(rest));
  return parts.join(" ");
}

// Indian numbering system (Crore/Lakh/Thousand), matching the sample
// payslip's "Amount In Words" line.
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero";

  let n = rounded;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));

  return parts.join(" ");
}

// Indian financial year runs April to March. Given a 'YYYY-MM'
// pay_period, returns the 'YYYY-MM' string for the start of that FY,
// used to bound the year-to-date sum on payslips.
export function fiscalYearStart(payPeriod: string): string {
  const [year, month] = payPeriod.split("-").map(Number);
  const fyStartYear = month >= 4 ? year : year - 1;
  return `${fyStartYear}-04`;
}
