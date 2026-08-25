import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { DepartmentRepository } from "../repositories/department.repository";
import { DesignationRepository } from "../repositories/designation.repository";
import { BranchRepository } from "../repositories/branch.repository";
import { ShiftRepository } from "../repositories/shift.repository";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../services/auditLog.service";

export function getMeta(_req: Request, res: Response) {
  const db = getDb();
  res.json({
    departments: new DepartmentRepository(db).findAll(),
    designations: new DesignationRepository(db).findAll(),
    branches: new BranchRepository(db).findAll(),
    shifts: new ShiftRepository(db).findAll()
  });
}

const nameSchema = z.object({ name: z.string().min(1, "Name is required") });
const titleSchema = z.object({ title: z.string().min(1, "Title is required") });

export function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = nameSchema.parse(req.body);
    const db = getDb();
    const existing = new DepartmentRepository(db)
      .findAll()
      .find((d) => d.name.toLowerCase() === name.toLowerCase());
    if (existing) throw new AppError(409, `Department "${name}" already exists`);
    const department = new DepartmentRepository(db).create(name);
    logAudit(db, req.user!.id, "CREATE_DEPARTMENT", "departments", department.id, { name });
    res.status(201).json(department);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid data"));
    next(err);
  }
}

export function createDesignation(req: Request, res: Response, next: NextFunction) {
  try {
    const { title } = titleSchema.parse(req.body);
    const db = getDb();
    const existing = new DesignationRepository(db)
      .findAll()
      .find((d) => d.title.toLowerCase() === title.toLowerCase());
    if (existing) throw new AppError(409, `Designation "${title}" already exists`);
    const designation = new DesignationRepository(db).create(title);
    logAudit(db, req.user!.id, "CREATE_DESIGNATION", "designations", designation.id, { title });
    res.status(201).json(designation);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid data"));
    next(err);
  }
}

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional()
});

export function createBranch(req: Request, res: Response, next: NextFunction) {
  try {
    const data = branchSchema.parse(req.body);
    const db = getDb();
    const existing = new BranchRepository(db)
      .findAll()
      .find((b) => b.name.toLowerCase() === data.name.toLowerCase());
    if (existing) throw new AppError(409, `Branch "${data.name}" already exists`);
    const branch = new BranchRepository(db).create(data);
    logAudit(db, req.user!.id, "CREATE_BRANCH", "branches", branch.id, { name: data.name });
    res.status(201).json(branch);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid data"));
    next(err);
  }
}

const shiftSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  grace_minutes: z.number().optional()
});

export function createShift(req: Request, res: Response, next: NextFunction) {
  try {
    const data = shiftSchema.parse(req.body);
    const db = getDb();
    const existing = new ShiftRepository(db)
      .findAll()
      .find((s) => s.name.toLowerCase() === data.name.toLowerCase());
    if (existing) throw new AppError(409, `Shift "${data.name}" already exists`);
    const shift = new ShiftRepository(db).create(data);
    logAudit(db, req.user!.id, "CREATE_SHIFT", "shifts", shift.id, { name: data.name });
    res.status(201).json(shift);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid data"));
    next(err);
  }
}
