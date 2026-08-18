import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { PayslipRepository, Payslip } from "../repositories/payslip.repository";
import { numberToIndianWords, fiscalYearStart } from "./payrollCalculation.service";

const EARNING_LABELS: Record<string, string> = {
  basic: "Basic",
  dearness_allowance: "Dearness Allowance",
  hra: "House Rent Allowance",
  fixed_allowance: "Fixed Allowance",
  conveyance: "Conveyance",
  medical_allowance: "Medical Allowance",
  other_allowance: "Other Allowances"
};

const DEDUCTION_LABELS: Record<string, string> = {
  professional_tax: "Professional Tax",
  epf_employee: "EPF Contribution",
  esi_employee: "ESI Contribution",
  income_tax: "Income Tax",
  loan_deduction: "Loan",
  advance_deduction: "Advance"
};

// pdfkit's built-in Helvetica font doesn't include the ₹ glyph, so
// currency amounts use "Rs." rather than risk it rendering as a
// missing-glyph box - verified visually before shipping.
function formatMoney(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthName(payPeriod: string): string {
  const [y, m] = payPeriod.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function generatePayslipPdf(payslipId: number, db: Database.Database): PassThrough {
  const payslipRepo = new PayslipRepository(db);
  const employeeRepo = new EmployeeRepository(db);

  const payslip = payslipRepo.findById(payslipId);
  if (!payslip) throw new Error("Payslip not found");

  const employee = employeeRepo.findByCode(payslip.employee_code);
  const breakdown = JSON.parse(payslip.breakdown_json) as {
    earnings: Record<string, number>;
    deductions: Record<string, number>;
  };

  // Year-to-date: sum this and every prior payslip in the same Indian
  // financial year (April-March).
  const fyStart = fiscalYearStart(payslip.pay_period);
  const ytdPayslips = payslipRepo.findForYtd(payslip.employee_id, fyStart, payslip.pay_period);
  const ytdEarnings: Record<string, number> = {};
  const ytdDeductions: Record<string, number> = {};
  for (const p of ytdPayslips) {
    const b = JSON.parse(p.breakdown_json) as {
      earnings: Record<string, number>;
      deductions: Record<string, number>;
    };
    for (const [k, v] of Object.entries(b.earnings)) ytdEarnings[k] = (ytdEarnings[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.deductions))
      ytdDeductions[k] = (ytdDeductions[k] ?? 0) + v;
  }

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Header
  doc.fontSize(14).font("Helvetica-Bold").text("Industrial Fans India Private Limited");
  doc
    .fontSize(9)
    .font("Helvetica")
    .text("28 New Boag Road, CIT Nagar, Kannamapet, Chennai, Tamil Nadu 600017, India");
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Bold").text(`Payslip For the Month - ${monthName(payslip.pay_period)}`);
  doc.moveDown(0.8);

  // Employee summary
  doc.fontSize(10).font("Helvetica-Bold").text("EMPLOYEE SUMMARY");
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9.5);
  const summaryRows: [string, string][] = [
    ["Employee Name", employee?.full_name ?? payslip.employee_name],
    ["Designation", employee?.designation_title ?? "—"],
    ["Employee ID", payslip.employee_code],
    ["Date of Joining", employee?.date_of_joining ?? "—"],
    ["Pay Period", monthName(payslip.pay_period)],
    ["Pay Date", payslip.pay_date ?? "—"],
    ["Paid Days", String(payslip.paid_days)],
    ["LOP Days", String(payslip.lop_days)]
  ];
  const summaryStartY = doc.y;
  summaryRows.forEach(([label, value], i) => {
    doc.text(label, 50, summaryStartY + i * 14, { continued: true, width: 200 });
    doc.text(`  ${value}`);
  });
  doc.y = summaryStartY + summaryRows.length * 14 + 10;

  // Earnings / Deductions table
  doc.moveDown(0.5);
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 220;
  const col3 = 320;
  const col4 = 420;

  doc.font("Helvetica-Bold").fontSize(9.5);
  doc.text("EARNINGS", col1, tableTop);
  doc.text("AMOUNT", col2, tableTop);
  doc.text("YTD", col3, tableTop);
  doc.text("DEDUCTIONS", col4, tableTop);

  let rowY = tableTop + 16;
  doc.font("Helvetica").fontSize(9);

  const earningKeys = Object.keys(EARNING_LABELS).filter((k) => breakdown.earnings[k]);
  const deductionKeys = Object.keys(DEDUCTION_LABELS).filter((k) => breakdown.deductions[k]);
  const maxRows = Math.max(earningKeys.length, deductionKeys.length);

  for (let i = 0; i < maxRows; i++) {
    if (i < earningKeys.length) {
      const key = earningKeys[i];
      doc.text(EARNING_LABELS[key], col1, rowY);
      doc.text(formatMoney(breakdown.earnings[key]), col2, rowY);
      doc.text(formatMoney(ytdEarnings[key] ?? breakdown.earnings[key]), col3, rowY);
    }
    if (i < deductionKeys.length) {
      const key = deductionKeys[i];
      doc.text(
        `${DEDUCTION_LABELS[key]}: ${formatMoney(breakdown.deductions[key])}`,
        col4,
        rowY,
        { width: 130 }
      );
    }
    rowY += 15;
  }

  doc.moveTo(50, rowY + 2).lineTo(545, rowY + 2).strokeColor("#cccccc").stroke();
  rowY += 10;

  doc.font("Helvetica-Bold").fontSize(9.5);
  doc.text(`Gross Earnings: ${formatMoney(payslip.gross_earnings)}`, col1, rowY);
  doc.text(`Total Deductions: ${formatMoney(payslip.total_deductions)}`, col4, rowY, {
    width: 145
  });
  rowY += 30;

  // Net payable
  doc.rect(50, rowY, 495, 55).fillAndStroke("#f7f8fb", "#e2e8f0");
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("TOTAL NET PAYABLE", 65, rowY + 10);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text("Gross Earnings - Total Deductions", 65, rowY + 28);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(formatMoney(payslip.net_pay), 380, rowY + 15, { width: 150, align: "right" });

  rowY += 70;
  doc
    .fillColor("black")
    .font("Helvetica")
    .fontSize(9)
    .text(`Amount In Words: Indian Rupee ${numberToIndianWords(payslip.net_pay)} Only`, 50, rowY);

  rowY += 25;
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("-- This is a system-generated document. --", 50, rowY, { width: 495, align: "center" });

  doc.end();
  return stream;
}
