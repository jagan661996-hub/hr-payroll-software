import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as XLSX from "xlsx";
import { getDb } from "../config/database";
import { PayslipRepository } from "../repositories/payslip.repository";
import { AppError } from "../middleware/errorHandler";

const periodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

function getPeriodPayslips(year: number, month: number) {
  const payPeriod = `${year}-${String(month).padStart(2, "0")}`;
  return new PayslipRepository(getDb()).findByPeriod(payPeriod);
}

function parseBreakdown(breakdownJson: string): {
  earnings: Record<string, number>;
  deductions: Record<string, number>;
} {
  return JSON.parse(breakdownJson);
}

export function getPfReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = periodQuerySchema.parse(req.query);
    const payslips = getPeriodPayslips(year, month);
    const rows = payslips
      .map((p) => {
        const b = parseBreakdown(p.breakdown_json);
        return {
          employeeCode: p.employee_code,
          employeeName: p.employee_name,
          basic: b.earnings.basic ?? 0,
          epfEmployee: b.deductions.epf_employee ?? 0
        };
      })
      .filter((r) => r.epfEmployee > 0);
    res.json(rows);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}

export function getEsiReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = periodQuerySchema.parse(req.query);
    const payslips = getPeriodPayslips(year, month);
    const rows = payslips
      .map((p) => {
        const b = parseBreakdown(p.breakdown_json);
        return {
          employeeCode: p.employee_code,
          employeeName: p.employee_name,
          grossEarnings: p.gross_earnings,
          esiEmployee: b.deductions.esi_employee ?? 0
        };
      })
      .filter((r) => r.esiEmployee > 0);
    res.json(rows);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}

export function getSalaryRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = periodQuerySchema.parse(req.query);
    const payslips = getPeriodPayslips(year, month);
    res.json(
      payslips.map((p) => ({
        employeeCode: p.employee_code,
        employeeName: p.employee_name,
        paidDays: p.paid_days,
        lopDays: p.lop_days,
        grossEarnings: p.gross_earnings,
        totalDeductions: p.total_deductions,
        netPay: p.net_pay
      }))
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}

export function exportSalaryRegisterExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = periodQuerySchema.parse(req.query);
    const payslips = getPeriodPayslips(year, month);

    const rows = payslips.map((p) => ({
      "Employee Code": p.employee_code,
      "Employee Name": p.employee_name,
      "Paid Days": p.paid_days,
      "LOP Days": p.lop_days,
      "Gross Earnings": p.gross_earnings,
      "Total Deductions": p.total_deductions,
      "Net Pay": p.net_pay
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Register");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="SalaryRegister_${year}-${String(month).padStart(2, "0")}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}
