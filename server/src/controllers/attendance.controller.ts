import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { importAttendanceExcel } from "../services/attendanceImport.service";
import { AppError } from "../middleware/errorHandler";

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export function getMonthAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = monthQuerySchema.parse(req.query);
    const db = getDb();
    const employees = new EmployeeRepository(db).findAll();
    const records = new AttendanceRepository(db).findByMonth(year, month);
    res.json({ employees, records });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}

const updateDaySchema = z.object({
  status_code: z.string().min(1).max(20)
});

export function updateAttendanceDay(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.employeeId);
    const workDate = req.params.date; // 'YYYY-MM-DD'
    const { status_code } = updateDaySchema.parse(req.body);

    const employee = new EmployeeRepository(getDb()).findById(employeeId);
    if (!employee) {
      throw new AppError(404, "Employee not found");
    }

    new AttendanceRepository(getDb()).upsert(
      employeeId,
      workDate,
      status_code.toUpperCase(),
      "MANUAL"
    );
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "A valid status_code is required"));
    }
    next(err);
  }
}

export function importAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, "No file was uploaded");
    }
    const result = importAttendanceExcel(req.file.buffer, getDb());
    res.json(result);
  } catch (err) {
    if (err instanceof Error && !(err instanceof AppError)) {
      return next(new AppError(400, err.message));
    }
    next(err);
  }
}
