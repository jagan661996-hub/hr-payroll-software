import { Request, Response } from "express";
import { getDb } from "../config/database";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRESENT_CODES = ["P", "OD", "WFH", "HD"];

export function getDashboardSummary(_req: Request, res: Response) {
  const db = getDb();
  const today = todayIso();

  const presentToday = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM attendance_daily WHERE work_date = ? AND status_code IN (${PRESENT_CODES.map(() => "?").join(",")})`
      )
      .get(today, ...PRESENT_CODES) as { c: number }
  ).c;

  const onLeaveToday = (
    db
      .prepare(`SELECT COUNT(*) as c FROM attendance_daily WHERE work_date = ? AND status_code = 'L'`)
      .get(today) as { c: number }
  ).c;

  const lateToday = (
    db
      .prepare(`SELECT COUNT(*) as c FROM attendance_daily WHERE work_date = ? AND late_minutes > 0`)
      .get(today) as { c: number }
  ).c;

  const pendingLeave = (
    db.prepare(`SELECT COUNT(*) as c FROM leave_requests WHERE status = 'PENDING'`).get() as {
      c: number;
    }
  ).c;
  const pendingOnDuty = (
    db.prepare(`SELECT COUNT(*) as c FROM on_duty_requests WHERE status = 'PENDING'`).get() as {
      c: number;
    }
  ).c;

  const departmentCounts = db
    .prepare(
      `SELECT COALESCE(dep.name, 'Unassigned') AS department, COUNT(*) AS count
       FROM employees e
       LEFT JOIN departments dep ON dep.id = e.department_id
       WHERE e.status = 'ACTIVE'
       GROUP BY department
       ORDER BY count DESC`
    )
    .all();

  // Last 6 months: % of attendance-day records marked as present-equivalent
  const attendanceTrend: { month: string; percentPresent: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = (
      db
        .prepare(`SELECT COUNT(*) as c FROM attendance_daily WHERE work_date LIKE ?`)
        .get(`${prefix}-%`) as { c: number }
    ).c;
    const present = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM attendance_daily WHERE work_date LIKE ? AND status_code IN (${PRESENT_CODES.map(() => "?").join(",")})`
        )
        .get(`${prefix}-%`, ...PRESENT_CODES) as { c: number }
    ).c;
    attendanceTrend.push({
      month: d.toLocaleString("default", { month: "short" }),
      percentPresent: total > 0 ? Math.round((present / total) * 100) : 0
    });
  }

  // Last 6 months: total net payroll expense
  const payrollTrend: { month: string; totalNetPay: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const sum = (
      db
        .prepare(`SELECT COALESCE(SUM(net_pay), 0) as total FROM payslips WHERE pay_period = ?`)
        .get(period) as { total: number }
    ).total;
    payrollTrend.push({ month: d.toLocaleString("default", { month: "short" }), totalNetPay: sum });
  }

  res.json({
    presentToday,
    onLeaveToday,
    lateToday,
    pendingApprovals: pendingLeave + pendingOnDuty,
    departmentCounts,
    attendanceTrend,
    payrollTrend
  });
}
