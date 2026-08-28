import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { PayslipRepository } from "../repositories/payslip.repository";
import { numberToIndianWords } from "./payrollCalculation.service";
import { parseIsoDateLocal } from "../utils/dateUtils";

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

const GREEN_ACCENT = "#10b981";
const GREEN_BG = "#ecfdf5";
const GREEN_BORDER = "#a7f3d0";
const GREEN_TEXT = "#065f46";
const GRAY_LABEL = "#64748b";
const GRAY_HEADING = "#334155";
const ROW_SHADE = "#f8fafc";
const DIVIDER = "#e2e8f0";

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

function formatLongDate(iso: string | null): string {
  if (!iso) return "—";
  // parseIsoDateLocal, not new Date(iso) - see dateUtils.ts.
  const d = parseIsoDateLocal(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  const LEFT = 50;
  const RIGHT = 545;
  const WIDTH = RIGHT - LEFT;

  // ===== Header: company name/address left, "Payslip For the Month" right =====
  doc.fillColor("black").font("Helvetica-Bold").fontSize(14).text("Industrial Fans India Private Limited", LEFT, 50, { width: 280 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY_LABEL)
    .text("28 New Boag Road, CIT Nagar, Kannamapet, Chennai, Tamil Nadu 600017, India", LEFT, 68, {
      width: 280
    });

  doc.font("Helvetica").fontSize(8.5).fillColor(GRAY_LABEL).text("Payslip For the Month", 345, 50, {
    width: 200,
    align: "right"
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("black")
    .text(monthName(payslip.pay_period), 345, 63, { width: 200, align: "right" });

  doc.moveTo(LEFT, 95).lineTo(RIGHT, 95).strokeColor(DIVIDER).lineWidth(1).stroke();

  // ===== Employee summary (left) + Net Pay highlight (right) =====
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY_HEADING).text("EMPLOYEE SUMMARY", LEFT, 110);

  const summaryRows: [string, string][] = [
    ["Employee Name", employee?.full_name ?? payslip.employee_name],
    ["Designation", employee?.designation_title ?? "—"],
    ["Employee ID", payslip.employee_code],
    ["Date of Joining", formatLongDate(employee?.date_of_joining ?? null)],
    ["Pay Period", monthName(payslip.pay_period)],
    ["Pay Date", formatLongDate(payslip.pay_date)]
  ];
  let sy = 130;
  doc.font("Helvetica").fontSize(9);
  summaryRows.forEach(([label, value]) => {
    doc.fillColor(GRAY_LABEL).text(label, LEFT, sy, { width: 110 });
    doc.fillColor("black").text(`: ${value}`, LEFT + 112, sy, { width: 170 });
    sy += 15;
  });

  // Net pay highlight box
  const boxX = 350;
  const boxW = RIGHT - boxX;
  doc.rect(boxX, 110, boxW, 62).fillAndStroke(GREEN_BG, GREEN_BORDER);
  doc.rect(boxX, 110, 4, 62).fill(GREEN_ACCENT);
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(GREEN_TEXT)
    .text(formatMoney(payslip.net_pay), boxX + 15, 123, { width: boxW - 25 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY_LABEL)
    .text("Employee Net Pay", boxX + 15, 150, { width: boxW - 25 });

  doc.moveTo(boxX, 180).lineTo(RIGHT, 180).strokeColor(DIVIDER).stroke();
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY_LABEL)
    .text("Paid Days", boxX, 190, { continued: true })
    .fillColor("black")
    .text(`  :  ${payslip.paid_days}`);
  doc
    .fillColor(GRAY_LABEL)
    .text("LOP Days", boxX, 205, { continued: true })
    .fillColor("black")
    .text(`  :  ${payslip.lop_days}`);

  // ===== Earnings / Deductions table =====
  const tableTop = 235;
  const divX = 300;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY_HEADING);
  doc.text("EARNINGS", LEFT, tableTop);
  doc.text("AMOUNT", 180, tableTop, { width: 110, align: "right" });
  doc.text("DEDUCTIONS", divX + 10, tableTop);
  doc.text("AMOUNT", 435, tableTop, { width: 110, align: "right" });

  const earningKeys = Object.keys(EARNING_LABELS).filter((k) => breakdown.earnings[k]);
  const deductionKeys = Object.keys(DEDUCTION_LABELS).filter((k) => breakdown.deductions[k]);
  const maxRows = Math.max(earningKeys.length, deductionKeys.length, 1);

  let rowY = tableTop + 18;
  doc.font("Helvetica").fontSize(9);
  for (let i = 0; i < maxRows; i++) {
    if (i < earningKeys.length) {
      const key = earningKeys[i];
      doc.fillColor("black").text(EARNING_LABELS[key], LEFT, rowY, { width: 145 });
      doc.text(formatMoney(breakdown.earnings[key]), 180, rowY, { width: 110, align: "right" });
    }
    if (i < deductionKeys.length) {
      const key = deductionKeys[i];
      doc.fillColor("black").text(DEDUCTION_LABELS[key], divX + 10, rowY, { width: 115 });
      doc.text(formatMoney(breakdown.deductions[key]), 435, rowY, { width: 110, align: "right" });
    }
    rowY += 16;
  }

  // Shaded totals row
  doc.rect(LEFT, rowY, WIDTH, 22).fill(ROW_SHADE);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("black");
  doc.text("Gross Earnings", LEFT + 2, rowY + 6, { width: 145 });
  doc.text(formatMoney(payslip.gross_earnings), 180, rowY + 6, { width: 110, align: "right" });
  doc.text("Total Deductions", divX + 12, rowY + 6, { width: 115 });
  doc.text(formatMoney(payslip.total_deductions), 435, rowY + 6, { width: 110, align: "right" });
  rowY += 22;

  // Vertical divider spanning the whole table, drawn last so it sits on top
  doc.moveTo(divX, tableTop).lineTo(divX, rowY).strokeColor(DIVIDER).stroke();

  // ===== Total net payable (full width) =====
  const totalBoxY = rowY + 15;
  doc.rect(LEFT, totalBoxY, WIDTH, 55).fillAndStroke(GREEN_BG, GREEN_BORDER);
  doc.rect(LEFT, totalBoxY, 4, 55).fill(GREEN_ACCENT);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("black")
    .text("TOTAL NET PAYABLE", LEFT + 15, totalBoxY + 11);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY_LABEL)
    .text("Gross Earnings - Total Deductions", LEFT + 15, totalBoxY + 29);
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(GREEN_TEXT)
    .text(formatMoney(payslip.net_pay), LEFT + 300, totalBoxY + 17, { width: 180, align: "right" });

  const afterBoxY = totalBoxY + 55 + 18;
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY_LABEL)
    .text(`Amount In Words : Indian Rupee ${numberToIndianWords(payslip.net_pay)} Only`, LEFT, afterBoxY);

  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(
      "This is a system-generated document and does not require a signature.",
      LEFT,
      afterBoxY + 25,
      { width: WIDTH, align: "center" }
    );

  doc.end();
  return stream;
}
