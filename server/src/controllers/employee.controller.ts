import { Request, Response } from "express";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";

export function listEmployees(_req: Request, res: Response) {
  const repo = new EmployeeRepository(getDb());
  res.json(repo.findAll());
}

export function getEmployeeSummary(_req: Request, res: Response) {
  const repo = new EmployeeRepository(getDb());
  res.json({ totalEmployees: repo.count() });
}
