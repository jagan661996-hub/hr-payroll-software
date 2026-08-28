import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType
} from "docx";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { SalaryStructureRepository } from "../repositories/salaryStructure.repository";
import { parseIsoDateLocal } from "../utils/dateUtils";

function formatLongDate(iso: string): string {
  // parseIsoDateLocal, not new Date(iso) - see dateUtils.ts. Parsing a
  // plain date string with new Date() gives UTC midnight, and reading
  // it back with local getters can show the previous day depending on
  // the machine's timezone.
  const d = parseIsoDateLocal(iso);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  return `${day}${suffix} ${d.toLocaleString("en-US", { month: "long" })}, ${d.getFullYear()}`;
}

function body(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 150 } });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 200, after: 100 }
  });
}

// The numbered clauses below are the company's own standard terms,
// transcribed from the uploaded ON_DUTY... er, Appointment_Letter
// template - identical for every employee. Only the header fields
// (name, position, date, location) and the salary annexure are
// personalized per generated letter.
const STANDARD_CLAUSES: { title: string; text: string }[] = [
  {
    title: "1. Date of Appointment",
    text: "1.1. Your date of appointment is effective from the date of joining."
  },
  {
    title: "2. Code of Conduct",
    text: "2.1. The Company may require you, at any time, to perform any other administrative, managerial, supervisory, technical, or other functions and you will be bound to carry out such functions. 2.2. Your individual remuneration is purely a matter between yourself and the Company and has been arrived at on the basis of your job, skills, specific background, and professional merit. Accordingly, your salary and any changes made to it are strictly confidential; you shall treat such matters accordingly, and any breach thereof would be viewed very seriously. 2.3. You shall maintain proper discipline and dignity of your office and shall deal with all matters with sobriety. 2.4. You shall maintain and keep in your safe custody such books, laptop, registers, documents, and other papers as may be issued to you or may come in your possession and shall return the same when required. 2.5. You shall inform the Company of any changes in your personal data within 3 days of the occurrence of such change. 2.6. You will observe work timings and holidays as applicable to your location and place of work. 2.7. You shall be solely responsible for any issues that may arise between you and your previous employer with regard to your previous employment and the Company is not responsible for the same."
  },
  {
    title: "3. Probationary Period",
    text: "3.1. Initially, you will be on probation for a period of six months from the date of your joining. On successful completion of the probation period, if, in the opinion of the Company, you are found suitable in the appointed post, you will be confirmed in writing by the Company. Based on your performance, the Company is at liberty to terminate your services, if found unsatisfactory at any time during the probation period, or extend the probation period, as it deems necessary."
  },
  {
    title: "4. Salary",
    text: "4.1. During the period of probation you will be entitled to salary and perquisites as detailed in the annexure. The Company in writing will communicate any change in compensation to you. 4.2. Compensation structure is based on location and any change in compensation arising out of a change in location will be communicated to you in writing."
  },
  {
    title: "5. Initial Appointment and Subsequent Transfers",
    text: "5.1. You will be liable to transfer in such capacity as the Company may from time to time determine to any other location, department, establishment, factory or branch of the Company or subsidiary, associate or affiliate of the Company in India or abroad without claiming any extra remuneration for such transfers."
  },
  {
    title: "6. Leave",
    text: "6.1. You will be entitled to 12 Earned Leave, 6 Casual Leave, 6 Sick Leave, totalling 24 days of annual leave, and other benefits in accordance with the leave policy and rules of the Company."
  },
  {
    title: "7. Other Work",
    text: "7.1. Your position is a full time employment with the Company and you shall devote your whole time and attention to the Company's business entrusted to you. You will not take up any other work for remuneration or be interested directly or indirectly in any other trade or business during your employment without the prior written permission of the Chief Executive Officer of the Company."
  },
  {
    title: "8. Termination",
    text: "8.1. During the period of probation, your services shall be terminable by giving one month's notice or one month's basic pay in lieu thereof on either side. On confirmation, your services shall be terminable by giving three months' notice or three months' basic pay in lieu thereof on either side, at the sole discretion of the Company's management."
  },
  {
    title: "9. On Separation",
    text: "9.1. On communication of termination/resignation of your employment, you will immediately give up to the Company, before you are relieved, all documents of the Company including correspondence, specifications, formulae, books, documents, cost data, market data, literature, drawings and effects, and shall not make or retain any copies of these items."
  },
  {
    title: "10. Intellectual Property and Confidential Information",
    text: "10.1. Information pertaining to the Company's operations and its clients shall remain secret and safeguarded by you. Any Intellectual Property or Patents developed by you during your service will be the property of the Company."
  },
  {
    title: "11. Protection of Interest",
    text: "11.1. If you conceive any new or advanced methods of improving process/formulae/systems in relation to the operations of the Company, such development will be fully communicated to the Company and will remain the sole right/property of the Company."
  },
  {
    title: "12. Client Management",
    text: "12.1. On termination/resignation of employment, you will not seek employment opportunities with the Company's principals, customers, or any other person/entity with whom you had a business relationship within one year from your last working day."
  },
  {
    title: "13. Non-solicitation",
    text: "13.1. Any dispute arising between the parties shall be referred to a single arbitrator in accordance with the Arbitration and Conciliation Act, 1996. The venue of arbitration shall be Chennai, and courts in Chennai shall have exclusive jurisdiction. 13.2. For two years following termination of employment, you will not directly or indirectly solicit, hire, or employ any other employee of the Company. 13.3. For two years following termination of employment, you will not solicit any customer or vendor of the Company to move their business to a third party."
  },
  {
    title: "14. Retirement",
    text: "14.1. You will retire in the month of your attaining the age of 60 years. 14.2. You will be required to produce photocopies and originals of certificates/testimonials on the day of joining."
  }
];

export async function generateAppointmentLetterDocx(
  employeeId: number,
  db: Database.Database
): Promise<Buffer> {
  const employee = new EmployeeRepository(db).findById(employeeId);
  if (!employee) throw new Error("Employee not found");

  const structure = new SalaryStructureRepository(db).findByEmployee(employeeId);
  const today = new Date().toISOString().slice(0, 10);

  const salaryRows = structure
    ? [
        ["Basic", structure.basic],
        ["Dearness Allowance", structure.dearness_allowance],
        ["House Rent Allowance", structure.hra],
        ["Fixed Allowance", structure.fixed_allowance],
        ["Conveyance", structure.conveyance],
        ["Medical Allowance", structure.medical_allowance],
        ["Other Allowances", structure.other_allowance]
      ].filter(([, amount]) => Number(amount) > 0)
    : [];

  const clauseParagraphs = STANDARD_CLAUSES.flatMap((c) => [heading(c.title), body(c.text)]);

  const salaryTable =
    salaryRows.length > 0
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Component", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Monthly Amount (Rs.)", bold: true })] })] })
              ]
            }),
            ...salaryRows.map(
              ([label, amount]) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(String(label))] }),
                    new TableCell({
                      children: [new Paragraph(Number(amount).toLocaleString("en-IN"))]
                    })
                  ]
                })
            )
          ]
        })
      : new Paragraph("Salary structure not yet configured in the system.");

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Appointment Letter", bold: true, size: 32 })],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          body(formatLongDate(today)),
          body(`Dear ${employee.full_name},`),
          body("Congratulations!"),
          body(
            `We are pleased to appoint you as ${employee.designation_title ?? "[Position]"}, or in such other capacity as the management of Industrial Fans (India) Pvt. Ltd, hereinafter called the Company, shall from time to time determine, under the following terms and conditions:`
          ),
          heading("WORK DETAILS"),
          body(`Position: ${employee.designation_title ?? "—"}`),
          body("Reporting to: Director / CEO"),
          body(`Date of Joining: ${formatLongDate(employee.date_of_joining)}`),
          body(`Department: ${employee.department_name ?? "—"}`),
          body(`Branch: ${employee.branch_name ?? "—"}`),
          body("Work Hours: 9:30 AM to 6:00 PM including Lunch Break"),
          body("Work Week: Monday to Saturday"),
          body("Type: Full-time"),
          ...clauseParagraphs,
          heading("Retirement"),
          body(
            `Please note that you are governed by all Rules and Regulations of the Company, which are in force from time to time. We take pleasure in welcoming you to our organization and look forward to a mutually beneficial association. We wish you all the best in your career.`
          ),
          new Paragraph({ spacing: { before: 400 } }),
          body("Sincerely,"),
          body("For Industrial Fans (India) Private Ltd.                          Accepted by,"),
          new Paragraph({ spacing: { before: 400 } }),
          body(`Managing Director                                                          ${employee.full_name}`),
          body(`Date: _______________                                                  Date: _______________`),
          new Paragraph({
            children: [new TextRun({ text: "Salary Annexure", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 200 },
            pageBreakBefore: true
          }),
          salaryTable,
          new Paragraph({ spacing: { before: 300 } }),
          body(
            "Note: This salary annexure applies only to the initial 6-month probation period. Future salary revisions will be subject to performance reviews."
          )
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}
