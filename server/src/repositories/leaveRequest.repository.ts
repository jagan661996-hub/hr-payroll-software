import Database from "better-sqlite3";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by: number | null;
  created_at: string;
}

export interface LeaveRequestWithDetails extends LeaveRequest {
  employee_name: string;
  leave_type_name: string;
}

export class LeaveRequestRepository {
  constructor(private db: Database.Database) {}

  private baseSelect(): string {
    return `SELECT
        lr.*,
        e.full_name AS employee_name,
        lt.name AS leave_type_name
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id`;
  }

  findAll(): LeaveRequestWithDetails[] {
    return this.db
      .prepare(`${this.baseSelect()} ORDER BY lr.created_at DESC`)
      .all() as LeaveRequestWithDetails[];
  }

  findById(id: number): LeaveRequestWithDetails | undefined {
    return this.db.prepare(`${this.baseSelect()} WHERE lr.id = ?`).get(id) as
      | LeaveRequestWithDetails
      | undefined;
  }

  create(data: {
    employee_id: number;
    leave_type_id: number;
    from_date: string;
    to_date: string;
    days: number;
    reason: string | null;
  }): number {
    const result = this.db
      .prepare(
        `INSERT INTO leave_requests (employee_id, leave_type_id, from_date, to_date, days, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`
      )
      .run(
        data.employee_id,
        data.leave_type_id,
        data.from_date,
        data.to_date,
        data.days,
        data.reason
      );
    return Number(result.lastInsertRowid);
  }

  setStatus(id: number, status: "APPROVED" | "REJECTED", approvedBy: number): void {
    this.db
      .prepare(`UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?`)
      .run(status, approvedBy, id);
  }
}
