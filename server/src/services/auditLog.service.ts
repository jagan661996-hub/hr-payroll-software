import Database from "better-sqlite3";

export function logAudit(
  db: Database.Database,
  userId: number | null,
  action: string,
  entity?: string,
  entityId?: number,
  details?: Record<string, unknown>
): void {
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, action, entity ?? null, entityId ?? null, details ? JSON.stringify(details) : null);
}

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  details_json: string | null;
  created_at: string;
}

export function findRecentAuditLogs(db: Database.Database, limit: number): AuditLogRow[] {
  return db
    .prepare(
      `SELECT a.*, u.email AS user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT ?`
    )
    .all(limit) as AuditLogRow[];
}
