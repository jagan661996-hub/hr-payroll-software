import { Request, Response } from "express";
import { getDb } from "../config/database";
import { DepartmentRepository } from "../repositories/department.repository";
import { DesignationRepository } from "../repositories/designation.repository";
import { BranchRepository } from "../repositories/branch.repository";
import { ShiftRepository } from "../repositories/shift.repository";

export function getMeta(_req: Request, res: Response) {
  const db = getDb();
  res.json({
    departments: new DepartmentRepository(db).findAll(),
    designations: new DesignationRepository(db).findAll(),
    branches: new BranchRepository(db).findAll(),
    shifts: new ShiftRepository(db).findAll()
  });
}
