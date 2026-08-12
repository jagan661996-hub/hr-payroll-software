import { Request, Response } from "express";

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: "ok",
    service: "hr-payroll-server",
    timestamp: new Date().toISOString()
  });
}
