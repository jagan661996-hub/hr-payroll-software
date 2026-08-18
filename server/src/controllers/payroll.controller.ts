import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { SalaryStructureRepository } from "../repositories/salaryStructure.repository";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { PayslipRepository } from "../repositories/payslip.repository";
import { calculatePayroll } from "../services/payrollCalculation.service";
import { generatePayslipPdf } from "../services/payslipPdf.service";
import { AppError } from "../middleware/errorHandler";

export function getSalaryStructure(req: Request, res: Response) {
  const employeeId = Number(req.params.employeeId);
  const structure = new SalaryStructureRepository(getDb()).findByEmployee(employeeId);
  res.json(structure ?? null);
}

const structureSchema = z.object({
  effective_from: z.string().min(1),
  basic: z.number().min(0),
  dearness_allowance: z.number().min(0).default(0),
  hra: z.number().min(0).default(0),
  fixed_allowance: z.number().min(0).default(0),
  conveyance: z.number().min(0).default(0),
  medical_allowance: z.number().min(0).default(0),
  other_allowance: z.number().min(0).default(0),
  professional_tax: z.number().min(0).default(0),
  epf_employee: z.number().min(0).default(0),
  esi_employee: z.number().min(0).default(0),
  income_tax: z.number().min(0).default(0),
  loan_deduction: z.number().min(0).default(0),
  advance_deduction: z.number().min(0).default(0)
});

export function saveSalaryStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.employeeId);
    const data = structureSchema.parse(req.body);
    const db = getDb();

    if (!new EmployeeRepository(db).findById(employeeId)) {
      throw new AppError(404, "Employee not found");
    }

    new SalaryStructureRepository(db).upsert(employeeId, data);
    res.json(new SalaryStructureRepository(db).findByEmployee(employeeId));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues[0]?.message ?? "Invalid salary structure"));
    }
    next(err);
  }
}

const runSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  pay_date: z.string().optional()
});

// Runs payroll for every active employee that has a salary structure
// configured. Employees without one are skipped and reported back,
// rather than silently producing a zero-value payslip.
export function runPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month, pay_date } = runSchema.parse(req.body);
    const db = getDb();
    const payPeriod = `${year}-${String(month).padStart(2, "0")}`;

    const employees = new EmployeeRepository(db).findAll().filter((e) => e.status === "ACTIVE");
    const structureRepo = new SalaryStructureRepository(db);
    const attendanceRepo = new AttendanceRepository(db);
    const payslipRepo = new PayslipRepository(db);

    const monthAttendance = attendanceRepo.findByMonth(year, month);

    const processed: string[] = [];
    const skipped: string[] = [];

    for (const employee of employees) {
      const structure = structureRepo.findByEmployee(employee.id);
      if (!structure) {
        skipped.push(employee.full_name);
        continue;
      }

      const employeeAttendance = monthAttendance.filter((a) => a.employee_id === employee.id);
      const result = calculatePayroll(structure, employeeAttendance, year, month);

      payslipRepo.upsert({
        employee_id: employee.id,
        pay_period: payPeriod,
        pay_date: pay_date ?? null,
        paid_days: result.paidDays,
        lop_days: result.lopDays,
        gross_earnings: result.grossEarnings,
        total_deductions: result.totalDeductions,
        net_pay: result.netPay,
        breakdown_json: JSON.stringify({
          earnings: result.earnings,
          deductions: result.deductions
        })
      });
      processed.push(employee.full_name);
    }

    res.json({ payPeriod, processed, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month are required"));
    }
    next(err);
  }
}

const periodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export function listPayslips(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = periodQuerySchema.parse(req.query);
    const payPeriod = `${year}-${String(month).padStart(2, "0")}`;
    res.json(new PayslipRepository(getDb()).findByPeriod(payPeriod));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}

export function downloadPayslipPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const payslip = new PayslipRepository(db).findById(id);
    if (!payslip) throw new AppError(404, "Payslip not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Payslip_${payslip.employee_code}_${payslip.pay_period}.pdf"`
    );
    const stream = generatePayslipPdf(id, db);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}
