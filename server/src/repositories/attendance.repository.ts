import Database from "better-sqlite3";

export type AttendanceStatusCode = "P" | "A" | "OD" | "L" | "WFH" | "HD" | "WO" | "HL";

export interface AttendanceRecord {
  employee_id: number;
  work_date: string; // 'YYYY-MM-DD'
  status_code: string;
  source: "MANUAL" | "BIOMETRIC" | "EXCEL_IMPORT";
}

export class AttendanceRepository {
  constructor(private db: Database.Database) {}

  // One row per employee per day, so re-importing or re-editing the
  // same date always overwrites rather than duplicating - relies on
  // the UNIQUE(employee_id, work_date) constraint from the schema.
  upsert(employeeId: number, workDate: string, statusCode: string, source: string): void {
    this.db
      .prepare(
        `INSERT INTO attendance_daily (employee_id, work_date, status_code, source)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(employee_id, work_date)
         DO UPDATE SET status_code = excluded.status_code, source = excluded.source`
      )
      .run(employeeId, workDate, statusCode, source);
  }

  findByMonth(year: number, month: number): AttendanceRecord[] {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return this.db
      .prepare(
        `SELECT employee_id, work_date, status_code, source
         FROM attendance_daily
         WHERE work_date LIKE ?`
      )
      .all(`${prefix}-%`) as AttendanceRecord[];
  }

  // Used by the Dashboard's "Present Today" style cards in a future
  // phase; included now since it's a natural extension of findByMonth.
  findByDate(workDate: string): AttendanceRecord[] {
    return this.db
      .prepare(
        `SELECT employee_id, work_date, status_code, source
         FROM attendance_daily
         WHERE work_date = ?`
      )
      .all(workDate) as AttendanceRecord[];
  }
}
