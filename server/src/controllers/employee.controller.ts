import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../services/auditLog.service";

const employeeSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required"),
  full_name: z.string().min(1, "Full name is required"),
  first_name: z.string().nullable().optional().default(null),
  middle_name: z.string().nullable().optional().default(null),
  last_name: z.string().nullable().optional().default(null),
  date_of_birth: z.string().nullable().optional().default(null),
  gender: z.string().nullable().optional().default(null),
  marital_status: z.string().nullable().optional().default(null),
  blood_group: z.string().nullable().optional().default(null),
  nationality: z.string().nullable().optional().default(null),
  designation_id: z.number().nullable().optional().default(null),
  department_id: z.number().nullable().optional().default(null),
  branch_id: z.number().nullable().optional().default(null),
  shift_id: z.number().nullable().optional().default(null),
  date_of_joining: z.string().min(1, "Date of joining is required"),
  date_of_confirmation: z.string().nullable().optional().default(null),
  employment_type: z.string().nullable().optional().default(null),
  reporting_manager_id: z.number().nullable().optional().default(null),
  work_location: z.string().nullable().optional().default(null),
  grade: z.string().nullable().optional().default(null),
  cost_center: z.string().nullable().optional().default(null),
  employee_category: z.string().nullable().optional().default(null),
  probation_end_date: z.string().nullable().optional().default(null),
  notice_period_days: z.number().nullable().optional().default(null),
  status: z.enum(["ACTIVE", "RESIGNED", "TERMINATED"]).optional().default("ACTIVE")
});

export function listEmployees(_req: Request, res: Response) {
  const repo = new EmployeeRepository(getDb());
  res.json(repo.findAll());
}

export function getEmployeeSummary(_req: Request, res: Response) {
  const repo = new EmployeeRepository(getDb());
  res.json({ totalEmployees: repo.count() });
}

export function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const data = employeeSchema.parse(req.body);
    const db = getDb();
    const repo = new EmployeeRepository(db);

    if (repo.findByCode(data.employee_code)) {
      throw new AppError(409, `Employee code "${data.employee_code}" is already in use`);
    }

    const id = repo.create(data);
    logAudit(db, req.user!.id, "CREATE_EMPLOYEE", "employees", id, {
      employee_code: data.employee_code,
      full_name: data.full_name
    });
    res.status(201).json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues[0]?.message ?? "Invalid employee data"));
    }
    next(err);
  }
}

export function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const data = employeeSchema.parse(req.body);
    const db = getDb();
    const repo = new EmployeeRepository(db);

    const existing = repo.findById(id);
    if (!existing) {
      throw new AppError(404, "Employee not found");
    }

    const codeOwner = repo.findByCode(data.employee_code);
    if (codeOwner && codeOwner.id !== id) {
      throw new AppError(409, `Employee code "${data.employee_code}" is already in use`);
    }

    repo.update(id, data);
    logAudit(db, req.user!.id, "UPDATE_EMPLOYEE", "employees", id, {
      employee_code: data.employee_code,
      status: data.status
    });
    res.json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues[0]?.message ?? "Invalid employee data"));
    }
    next(err);
  }
}

// Same reasoning as the Documents feature: this must live outside the
// packaged app's own (read-only) resources, so it goes wherever
// Electron's main process points EMPLOYEE_PHOTOS_DIR - a writable
// folder under the OS user-data directory.
const PHOTOS_DIR =
  process.env.EMPLOYEE_PHOTOS_DIR ?? path.resolve(__dirname, "../../uploads/employee-photos");

const ALLOWED_PHOTO_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function uploadEmployeePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const repo = new EmployeeRepository(db);
    const employee = repo.findById(id);
    if (!employee) throw new AppError(404, "Employee not found");
    if (!req.file) throw new AppError(400, "No photo was uploaded");

    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    if (!ALLOWED_PHOTO_EXTENSIONS.has(ext)) {
      throw new AppError(400, "Photo must be a JPG, PNG, or WEBP image");
    }

    fs.mkdirSync(PHOTOS_DIR, { recursive: true });

    // Remove any previous photo for this employee (possibly a
    // different extension) before writing the new one, so old photos
    // don't pile up unused on disk.
    if (employee.photo_path) {
      const oldPath = path.join(PHOTOS_DIR, path.basename(employee.photo_path));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const filename = `employee_${id}${ext}`;
    fs.writeFileSync(path.join(PHOTOS_DIR, filename), req.file.buffer);

    repo.setPhotoPath(id, filename);
    logAudit(db, req.user!.id, "UPLOAD_EMPLOYEE_PHOTO", "employees", id);
    res.json({ photo_path: filename });
  } catch (err) {
    next(err);
  }
}

export function getEmployeePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const employee = new EmployeeRepository(getDb()).findById(id);
    if (!employee?.photo_path) throw new AppError(404, "No photo uploaded for this employee");

    const filePath = path.join(PHOTOS_DIR, path.basename(employee.photo_path));
    if (!fs.existsSync(filePath)) throw new AppError(404, "Photo file is missing");

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export function deleteEmployeePhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const repo = new EmployeeRepository(db);
    const employee = repo.findById(id);
    if (!employee) throw new AppError(404, "Employee not found");

    if (employee.photo_path) {
      const filePath = path.join(PHOTOS_DIR, path.basename(employee.photo_path));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      repo.setPhotoPath(id, null);
      logAudit(db, req.user!.id, "DELETE_EMPLOYEE_PHOTO", "employees", id);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export function exportEmployeesExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const db = getDb();
    const employees = new EmployeeRepository(db).findAll();

    const rows = employees.map((e) => ({
      "Employee Code": e.employee_code,
      "Full Name": e.full_name,
      "Designation": e.designation_title ?? "",
      "Department": e.department_name ?? "",
      "Branch": e.branch_name ?? "",
      "Date of Birth": e.date_of_birth ?? "",
      "Gender": e.gender ?? "",
      "Marital Status": e.marital_status ?? "",
      "Blood Group": e.blood_group ?? "",
      "Nationality": e.nationality ?? "",
      "Employment Type": e.employment_type ?? "",
      "Work Location": e.work_location ?? "",
      "Grade": e.grade ?? "",
      "Date of Joining": e.date_of_joining,
      "Date of Confirmation": e.date_of_confirmation ?? "",
      "Probation End Date": e.probation_end_date ?? "",
      "Notice Period (days)": e.notice_period_days ?? "",
      "Cost Center": e.cost_center ?? "",
      "Employee Category": e.employee_category ?? "",
      "Status": e.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    logAudit(db, req.user!.id, "EXPORT_EMPLOYEES", "employees", undefined, { count: rows.length });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Employees_${new Date().toISOString().slice(0, 10)}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
