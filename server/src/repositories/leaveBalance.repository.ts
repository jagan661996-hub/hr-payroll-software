import Database from "better-sqlite3";

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  opening_balance: number;
  accrued: number;
  used: number;
}

export class LeaveBalanceRepository {
  constructor(private db: Database.Database) {}

  // Balances aren't pre-created for every employee/type/year combo -
  // that would be a lot of empty rows. Instead, create one on first
  // access, seeded from the leave type's default annual allowance.
  getOrCreate(employeeId: number, leaveTypeId: number, year: number): LeaveBalance {
    const existing = this.db
      .prepare(
        `SELECT * FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?`
      )
      .get(employeeId, leaveTypeId, year) as LeaveBalance | undefined;
    if (existing) return existing;

    const leaveType = this.db
      .prepare(`SELECT default_annual_days FROM leave_types WHERE id = ?`)
      .get(leaveTypeId) as { default_annual_days: number } | undefined;

    this.db
      .prepare(
        `INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, accrued, used)
         VALUES (?, ?, ?, 0, ?, 0)`
      )
      .run(employeeId, leaveTypeId, year, leaveType?.default_annual_days ?? 0);

    return this.db
      .prepare(
        `SELECT * FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?`
      )
      .get(employeeId, leaveTypeId, year) as LeaveBalance;
  }

  findByEmployeeAndYear(employeeId: number, year: number): LeaveBalance[] {
    return this.db
      .prepare(`SELECT * FROM leave_balances WHERE employee_id = ? AND year = ?`)
      .all(employeeId, year) as LeaveBalance[];
  }

  findByYear(year: number): LeaveBalance[] {
    return this.db.prepare(`SELECT * FROM leave_balances WHERE year = ?`).all(year) as
      LeaveBalance[];
  }

  incrementUsed(employeeId: number, leaveTypeId: number, year: number, days: number): void {
    this.getOrCreate(employeeId, leaveTypeId, year); // ensure row exists
    this.db
      .prepare(
        `UPDATE leave_balances SET used = used + ?
         WHERE employee_id = ? AND leave_type_id = ? AND year = ?`
      )
      .run(days, employeeId, leaveTypeId, year);
  }

  // Used by the historical register import, which knows a total for
  // the year rather than incremental amounts - overwrite rather than add.
  setUsed(employeeId: number, leaveTypeId: number, year: number, usedDays: number): void {
    this.getOrCreate(employeeId, leaveTypeId, year);
    this.db
      .prepare(
        `UPDATE leave_balances SET used = ?
         WHERE employee_id = ? AND leave_type_id = ? AND year = ?`
      )
      .run(usedDays, employeeId, leaveTypeId, year);
  }
}
