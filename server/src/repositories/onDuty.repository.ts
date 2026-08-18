import Database from "better-sqlite3";

export interface OnDutyRequest {
  id: number;
  employee_id: number;
  from_date: string;
  to_date: string;
  purpose: string | null;
  location: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by: number | null;
  created_at: string;
}

export interface OnDutyWithDetails extends OnDutyRequest {
  employee_name: string;
  employee_code: string;
}

export class OnDutyRepository {
  constructor(private db: Database.Database) {}

  private baseSelect(): string {
    return `SELECT od.*, e.full_name AS employee_name, e.employee_code
      FROM on_duty_requests od
      JOIN employees e ON e.id = od.employee_id`;
  }

  findAll(): OnDutyWithDetails[] {
    return this.db
      .prepare(`${this.baseSelect()} ORDER BY od.created_at DESC`)
      .all() as OnDutyWithDetails[];
  }

  findById(id: number): OnDutyWithDetails | undefined {
    return this.db.prepare(`${this.baseSelect()} WHERE od.id = ?`).get(id) as
      | OnDutyWithDetails
      | undefined;
  }

  create(data: {
    employee_id: number;
    from_date: string;
    to_date: string;
    purpose: string | null;
    location: string | null;
  }): number {
    const result = this.db
      .prepare(
        `INSERT INTO on_duty_requests (employee_id, from_date, to_date, purpose, location, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`
      )
      .run(data.employee_id, data.from_date, data.to_date, data.purpose, data.location);
    return Number(result.lastInsertRowid);
  }

  setStatus(id: number, status: "APPROVED" | "REJECTED", approvedBy: number): void {
    this.db
      .prepare(`UPDATE on_duty_requests SET status = ?, approved_by = ? WHERE id = ?`)
      .run(status, approvedBy, id);
  }
}
