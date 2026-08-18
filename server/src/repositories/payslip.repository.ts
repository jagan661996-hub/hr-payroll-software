import Database from "better-sqlite3";

export interface Payslip {
  id: number;
  employee_id: number;
  pay_period: string; // 'YYYY-MM'
  pay_date: string | null;
  paid_days: number;
  lop_days: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
  breakdown_json: string;
  generated_at: string;
}

export interface PayslipWithEmployee extends Payslip {
  employee_name: string;
  employee_code: string;
}

export class PayslipRepository {
  constructor(private db: Database.Database) {}

  private baseSelect(): string {
    return `SELECT p.*, e.full_name AS employee_name, e.employee_code
      FROM payslips p JOIN employees e ON e.id = p.employee_id`;
  }

  findByPeriod(payPeriod: string): PayslipWithEmployee[] {
    return this.db
      .prepare(`${this.baseSelect()} WHERE p.pay_period = ? ORDER BY e.full_name`)
      .all(payPeriod) as PayslipWithEmployee[];
  }

  findById(id: number): PayslipWithEmployee | undefined {
    return this.db.prepare(`${this.baseSelect()} WHERE p.id = ?`).get(id) as
      | PayslipWithEmployee
      | undefined;
  }

  // Payslips for one employee within a pay_period range, used to
  // compute year-to-date totals for the PDF. pay_period is a
  // zero-padded 'YYYY-MM' string so a plain string range comparison
  // sorts correctly, including across a year boundary.
  findForYtd(employeeId: number, fromPeriod: string, uptoPeriod: string): Payslip[] {
    return this.db
      .prepare(
        `SELECT * FROM payslips WHERE employee_id = ? AND pay_period >= ? AND pay_period <= ? ORDER BY pay_period`
      )
      .all(employeeId, fromPeriod, uptoPeriod) as Payslip[];
  }

  upsert(data: Omit<Payslip, "id" | "generated_at">): number {
    const result = this.db
      .prepare(
        `INSERT INTO payslips
          (employee_id, pay_period, pay_date, paid_days, lop_days, gross_earnings, total_deductions, net_pay, breakdown_json)
         VALUES (@employee_id, @pay_period, @pay_date, @paid_days, @lop_days, @gross_earnings, @total_deductions, @net_pay, @breakdown_json)
         ON CONFLICT(employee_id, pay_period) DO UPDATE SET
           pay_date = excluded.pay_date,
           paid_days = excluded.paid_days,
           lop_days = excluded.lop_days,
           gross_earnings = excluded.gross_earnings,
           total_deductions = excluded.total_deductions,
           net_pay = excluded.net_pay,
           breakdown_json = excluded.breakdown_json,
           generated_at = CURRENT_TIMESTAMP`
      )
      .run(data);

    if (result.lastInsertRowid) return Number(result.lastInsertRowid);
    const row = this.db
      .prepare(`SELECT id FROM payslips WHERE employee_id = ? AND pay_period = ?`)
      .get(data.employee_id, data.pay_period) as { id: number };
    return row.id;
  }
}
