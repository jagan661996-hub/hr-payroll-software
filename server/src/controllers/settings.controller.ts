import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import bcrypt from "bcryptjs";
import { getDb, checkpointAndCloseDb } from "../config/database";
import { env } from "../config/env";
import { CompanySettingsRepository } from "../repositories/companySettings.repository";
import { UserRepository } from "../repositories/user.repository";
import { logAudit, findRecentAuditLogs } from "../services/auditLog.service";
import { AppError } from "../middleware/errorHandler";

// ===== Company settings =====

export function getCompanySettings(_req: Request, res: Response) {
  res.json(new CompanySettingsRepository(getDb()).get());
}

const companySettingsSchema = z.object({
  company_name: z.string().min(1),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default("India"),
  financial_year_start_month: z.number().int().min(1).max(12)
});

export function saveCompanySettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = companySettingsSchema.parse(req.body);
    const db = getDb();
    const updated = new CompanySettingsRepository(db).update(data);
    logAudit(db, req.user!.id, "UPDATE_COMPANY_SETTINGS", "company_settings", 1);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, "company_name and financial_year_start_month are required"));
    }
    next(err);
  }
}

// ===== User management =====

export function listUsers(_req: Request, res: Response) {
  res.json(new UserRepository(getDb()).findAll());
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"])
});

export function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createUserSchema.parse(req.body);
    const db = getDb();
    const repo = new UserRepository(db);

    if (repo.findByEmail(data.email)) {
      throw new AppError(409, "A user with this email already exists");
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    const id = repo.create(data.email, passwordHash, data.role);
    logAudit(db, req.user!.id, "CREATE_USER", "users", id, { email: data.email, role: data.role });
    res.status(201).json(repo.findById(id));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues[0]?.message ?? "Invalid user data"));
    }
    next(err);
  }
}

// ===== Backup / Restore =====

export function downloadBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const db = getDb();
    db.pragma("wal_checkpoint(FULL)"); // flush WAL so the file on disk is complete
    logAudit(db, req.user!.id, "DOWNLOAD_BACKUP");

    const filename = `hrms-backup-${new Date().toISOString().slice(0, 10)}.db`;
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    fs.createReadStream(env.dbPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export function restoreBackup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, "No backup file was uploaded");
    }

    // A real SQLite file always starts with this exact 16-byte magic
    // header - reject anything else before touching the live database.
    const header = req.file.buffer.subarray(0, 16).toString("utf-8");
    if (!header.startsWith("SQLite format 3")) {
      throw new AppError(400, "That file doesn't look like a valid database backup");
    }

    const userId = req.user!.id;
    checkpointAndCloseDb(); // release the current file handle before overwriting it
    fs.writeFileSync(env.dbPath, req.file.buffer);
    // Also remove any leftover WAL/SHM files from the old database so
    // the restored file isn't merged with stale pending writes.
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = env.dbPath + suffix;
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
    }

    const db = getDb(); // reopens fresh against the newly restored file
    logAudit(db, userId, "RESTORE_BACKUP");

    res.json({ success: true, message: "Database restored. Please restart the application." });
  } catch (err) {
    next(err);
  }
}

// ===== Audit logs =====

export function getAuditLogs(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(findRecentAuditLogs(getDb(), limit));
}
