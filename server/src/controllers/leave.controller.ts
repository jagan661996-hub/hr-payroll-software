import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { LeaveRequestRepository } from "../repositories/leaveRequest.repository";
import { LeaveBalanceRepository } from "../repositories/leaveBalance.repository";
import { LeaveTypeRepository } from "../repositories/leaveType.repository";
import { importLeaveRegister } from "../services/leaveImport.service";
import { AppError } from "../middleware/errorHandler";

function daysBetweenInclusive(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function listLeaveTypes(_req: Request, res: Response) {
  res.json(new LeaveTypeRepository(getDb()).findAll());
}

export function listLeaveRequests(_req: Request, res: Response) {
  res.json(new LeaveRequestRepository(getDb()).findAll());
}

const applySchema = z.object({
  employee_id: z.number(),
  leave_type_id: z.number(),
  from_date: z.string().min(1),
  to_date: z.string().min(1),
  reason: z.string().optional().default("")
});

export function applyLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const data = applySchema.parse(req.body);
    const days = daysBetweenInclusive(data.from_date, data.to_date);
    if (days <= 0) {
      throw new AppError(400, "To date must be on or after the from date");
    }

    const repo = new LeaveRequestRepository(getDb());
    const id = repo.create({ ...data, days, reason: data.reason || null });
    res.status(201).json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "employee_id, leave_type_id, from_date and to_date are required"));
    }
    next(err);
  }
}

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export function updateLeaveStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status } = statusSchema.parse(req.body);
    const db = getDb();
    const repo = new LeaveRequestRepository(db);

    const request = repo.findById(id);
    if (!request) throw new AppError(404, "Leave request not found");
    if (request.status !== "PENDING") {
      throw new AppError(409, `This request was already ${request.status.toLowerCase()}`);
    }

    repo.setStatus(id, status, req.user!.id);

    if (status === "APPROVED") {
      const year = Number(request.from_date.slice(0, 4));
      new LeaveBalanceRepository(db).incrementUsed(
        request.employee_id,
        request.leave_type_id,
        year,
        request.days
      );
    }

    res.json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'status must be "APPROVED" or "REJECTED"'));
    }
    next(err);
  }
}

const balancesQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export function getBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const { year } = balancesQuerySchema.parse(req.query);
    res.json(new LeaveBalanceRepository(getDb()).findByYear(year));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "year query parameter is required"));
    }
    next(err);
  }
}

export function importLeave(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, "No file was uploaded");
    }
    const result = importLeaveRegister(req.file.buffer, getDb());
    res.json(result);
  } catch (err) {
    if (err instanceof Error && !(err instanceof AppError)) {
      return next(new AppError(400, err.message));
    }
    next(err);
  }
}
