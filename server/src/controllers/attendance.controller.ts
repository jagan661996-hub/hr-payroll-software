import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as XLSX from "xlsx";
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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Exports in the same Sl:No / Name / one-column-per-day shape used for
// import, so the file can be edited and re-imported if needed, and
// looks familiar to anyone used to the original spreadsheet format.
export function exportAttendanceExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = monthQuerySchema.parse(req.query);
    const db = getDb();
    const employees = new EmployeeRepository(db).findAll();
    const records = new AttendanceRepository(db).findByMonth(year, month);

    const recordLookup = new Map<string, string>();
    records.forEach((r) => recordLookup.set(`${r.employee_id}_${r.work_date}`, r.status_code));

    const totalDays = daysInMonth(year, month);
    const dayDates: Date[] = Array.from({ length: totalDays }, (_, i) => new Date(year, month - 1, i + 1));

    const header = ["Sl:No:", "Name", "Branch", ...dayDates.map((d) => d)];
    const subHeader = ["", "", "", ...dayDates.map((d) => d.toLocaleDateString("en-US", { weekday: "long" }))];

    const rows: unknown[][] = [header, subHeader];
    employees.forEach((emp, i) => {
      const row: unknown[] = [
        i + 1,
        emp.full_name,
        emp.branch_name ?? "",
        ...dayDates.map((d) => {
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return recordLookup.get(`${emp.id}_${iso}`) ?? "";
        })
      ];
      rows.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${year}-${String(month).padStart(2, "0")}`);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Attendance_${year}-${String(month).padStart(2, "0")}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year and month query parameters are required"));
    }
    next(err);
  }
}
