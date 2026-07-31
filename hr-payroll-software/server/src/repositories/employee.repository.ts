import Database from "better-sqlite3";
import { EmployeeWithDetails } from "../models/employee.model";

// Repository = only table access, no decisions about what the data
// means. Controllers/services call this rather than writing SQL
// inline, so the query lives in exactly one place per table.
export class EmployeeRepository {
  constructor(private db: Database.Database) {}

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) as total FROM employees").get() as {
      total: number;
    };
    return row.total;
  }

  findAll(): EmployeeWithDetails[] {
    return this.db
      .prepare(
        `SELECT
          e.*,
          d.title AS designation_title,
          dep.name AS department_name,
          b.name AS branch_name
        FROM employees e
        LEFT JOIN designations d ON d.id = e.designation_id
        LEFT JOIN departments dep ON dep.id = e.department_id
        LEFT JOIN branches b ON b.id = e.branch_id
        ORDER BY e.full_name`
      )
      .all() as EmployeeWithDetails[];
  }

  findByCode(employeeCode: string): EmployeeWithDetails | undefined {
    return this.db
      .prepare(
        `SELECT
          e.*,
          d.title AS designation_title,
          dep.name AS department_name,
          b.name AS branch_name
        FROM employees e
        LEFT JOIN designations d ON d.id = e.designation_id
        LEFT JOIN departments dep ON dep.id = e.department_id
        LEFT JOIN branches b ON b.id = e.branch_id
        WHERE e.employee_code = ?`
      )
      .get(employeeCode) as EmployeeWithDetails | undefined;
  }
}
