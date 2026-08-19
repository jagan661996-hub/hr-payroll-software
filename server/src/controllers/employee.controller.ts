import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../services/auditLog.service";

const employeeSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required"),
  full_name: z.string().min(1, "Full name is required"),
  designation_id: z.number().nullable().optional().default(null),
  department_id: z.number().nullable().optional().default(null),
  branch_id: z.number().nullable().optional().default(null),
  shift_id: z.number().nullable().optional().default(null),
  date_of_joining: z.string().min(1, "Date of joining is required"),
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
