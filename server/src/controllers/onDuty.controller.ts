import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getDb } from "../config/database";
import { OnDutyRepository } from "../repositories/onDuty.repository";
import { generateOnDutyFormPdf } from "../services/onDutyPdf.service";
import { AppError } from "../middleware/errorHandler";

export function listOnDuty(_req: Request, res: Response) {
  res.json(new OnDutyRepository(getDb()).findAll());
}

const applySchema = z.object({
  employee_id: z.number(),
  from_date: z.string().min(1),
  to_date: z.string().min(1),
  purpose: z.string().optional().default(""),
  location: z.string().optional().default("")
});

export function applyOnDuty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = applySchema.parse(req.body);
    if (new Date(data.to_date) < new Date(data.from_date)) {
      throw new AppError(400, "To date must be on or after the from date");
    }
    const repo = new OnDutyRepository(getDb());
    const id = repo.create({
      employee_id: data.employee_id,
      from_date: data.from_date,
      to_date: data.to_date,
      purpose: data.purpose || null,
      location: data.location || null
    });
    res.status(201).json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "employee_id, from_date and to_date are required"));
    }
    next(err);
  }
}

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export function updateOnDutyStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { status } = statusSchema.parse(req.body);
    const repo = new OnDutyRepository(getDb());

    const request = repo.findById(id);
    if (!request) throw new AppError(404, "On duty request not found");
    if (request.status !== "PENDING") {
      throw new AppError(409, `This request was already ${request.status.toLowerCase()}`);
    }

    repo.setStatus(id, status, req.user!.id);
    res.json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'status must be "APPROVED" or "REJECTED"'));
    }
    next(err);
  }
}

export function downloadOnDutyPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const request = new OnDutyRepository(db).findById(id);
    if (!request) throw new AppError(404, "On duty request not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="OnDuty_${request.employee_code}_${request.from_date}.pdf"`
    );
    generateOnDutyFormPdf(id, db).pipe(res);
  } catch (err) {
    next(err);
  }
}
