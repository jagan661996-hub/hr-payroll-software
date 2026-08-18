import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import Database from "better-sqlite3";
import { OnDutyRepository } from "../repositories/onDuty.repository";
import { EmployeeRepository } from "../repositories/employee.repository";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function drawField(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.font("Helvetica-Bold").fontSize(9).text(label, x, y);
  doc
    .moveTo(x, y + 14)
    .lineTo(x + width, y + 14)
    .strokeColor("#94a3b8")
    .stroke();
  doc.font("Helvetica").fontSize(10).text(value, x, y + 17, { width });
}

// Layout traced directly from the uploaded ON_DUTY_FORM_INDFANS.doc:
// Name / Emp ID / Date / Position / Dept / Date From / Date To /
// Purpose / Approved by (Name, Signature) / Employee Signature.
export function generateOnDutyFormPdf(requestId: number, db: Database.Database): PassThrough {
  const request = new OnDutyRepository(db).findById(requestId);
  if (!request) throw new Error("On duty request not found");

  const employee = new EmployeeRepository(db).findByCode(request.employee_code);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("INDUSTRIAL FANS (INDIA) PVT. LTD.", { align: "center" });
  doc.fontSize(12).text("ON DUTY FORM", { align: "center" });
  doc.moveDown(1.5);

  let y = doc.y;
  const colWidth = 220;
  const col2X = 320;

  drawField(doc, "Name", employee?.full_name ?? request.employee_name, 50, y, colWidth);
  drawField(doc, "Emp ID", request.employee_code, col2X, y, colWidth);
  y += 45;

  drawField(doc, "Position", employee?.designation_title ?? "—", 50, y, colWidth);
  drawField(doc, "Dept", employee?.department_name ?? "—", col2X, y, colWidth);
  y += 45;

  drawField(doc, "Date", formatDate(request.created_at), 50, y, colWidth);
  drawField(doc, "Location", request.location ?? "—", col2X, y, colWidth);
  y += 45;

  drawField(doc, "Date From", formatDate(request.from_date), 50, y, colWidth);
  drawField(doc, "Date To", formatDate(request.to_date), col2X, y, colWidth);
  y += 55;

  doc.font("Helvetica-Bold").fontSize(9).text("Purpose", 50, y);
  doc
    .moveTo(50, y + 14)
    .lineTo(545, y + 14)
    .strokeColor("#94a3b8")
    .stroke();
  doc.font("Helvetica").fontSize(10).text(request.purpose ?? "—", 50, y + 17, { width: 495 });
  y += 55;

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(request.status === "APPROVED" ? "#059669" : request.status === "REJECTED" ? "#dc2626" : "#d97706")
    .text(`Status: ${request.status}`, 50, y);
  doc.fillColor("black");
  y += 40;

  drawField(doc, "Approved by (Immediate Manager) - Name", "", 50, y, colWidth);
  drawField(doc, "Signature", "", col2X, y, colWidth);
  y += 55;

  drawField(doc, "Employee Signature", "", 50, y, colWidth);
  y += 60;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text(
      "Employees are requested to fill this form and take the approval of their immediate manager whenever they go out of office ON OFFICIAL WORK.",
      50,
      y,
      { width: 495 }
    );

  doc.end();
  return stream;
}
