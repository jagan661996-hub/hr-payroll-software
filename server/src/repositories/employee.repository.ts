import Database from "better-sqlite3";
import { EmployeeWithDetails } from "../models/employee.model";

export interface EmployeeInput {
  employee_code: string;
  full_name: string;
  designation_id: number | null;
  department_id: number | null;
  branch_id: number | null;
  shift_id: number | null;
  date_of_joining: string;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
}

export class EmployeeRepository {
  constructor(private db: Database.Database) {}

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) as total FROM employees").get() as {
      total: number;
    };
    return row.total;
  }

  private baseSelect(): string {
    return `SELECT
        e.*,
        d.title AS designation_title,
        dep.name AS department_name,
        b.name AS branch_name
      FROM employees e
      LEFT JOIN designations d ON d.id = e.designation_id
      LEFT JOIN departments dep ON dep.id = e.department_id
      LEFT JOIN branches b ON b.id = e.branch_id`;
  }

  findAll(): EmployeeWithDetails[] {
    return this.db
      .prepare(`${this.baseSelect()} ORDER BY e.full_name`)
      .all() as EmployeeWithDetails[];
  }

  findById(id: number): EmployeeWithDetails | undefined {
    return this.db.prepare(`${this.baseSelect()} WHERE e.id = ?`).get(id) as
      | EmployeeWithDetails
      | undefined;
  }

  findByCode(employeeCode: string): EmployeeWithDetails | undefined {
    return this.db.prepare(`${this.baseSelect()} WHERE e.employee_code = ?`).get(employeeCode) as
      | EmployeeWithDetails
      | undefined;
  }

  create(data: EmployeeInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO employees
          (employee_code, full_name, designation_id, department_id, branch_id, shift_id, date_of_joining, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.employee_code,
        data.full_name,
        data.designation_id,
        data.department_id,
        data.branch_id,
        data.shift_id,
        data.date_of_joining,
        data.status
      );
    return Number(result.lastInsertRowid);
  }

  update(id: number, data: EmployeeInput): void {
    this.db
      .prepare(
        `UPDATE employees SET
          employee_code = ?,
          full_name = ?,
          designation_id = ?,
          department_id = ?,
          branch_id = ?,
          shift_id = ?,
          date_of_joining = ?,
          status = ?
        WHERE id = ?`
      )
      .run(
        data.employee_code,
        data.full_name,
        data.designation_id,
        data.department_id,
        data.branch_id,
        data.shift_id,
        data.date_of_joining,
        data.status,
        id
      );
  }
}
