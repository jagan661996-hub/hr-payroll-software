import Database from "better-sqlite3";
import { EmployeeWithDetails } from "../models/employee.model";

export interface EmployeeInput {
  employee_code: string;
  full_name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  blood_group?: string | null;
  nationality?: string | null;
  designation_id: number | null;
  department_id: number | null;
  branch_id: number | null;
  shift_id: number | null;
  date_of_joining: string;
  date_of_confirmation?: string | null;
  employment_type?: string | null;
  reporting_manager_id?: number | null;
  work_location?: string | null;
  grade?: string | null;
  cost_center?: string | null;
  employee_category?: string | null;
  probation_end_date?: string | null;
  notice_period_days?: number | null;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
}

const OPTIONAL_FIELDS: (keyof EmployeeInput)[] = [
  "first_name", "middle_name", "last_name", "date_of_birth", "gender", "marital_status",
  "blood_group", "nationality", "date_of_confirmation", "employment_type",
  "reporting_manager_id", "work_location", "grade", "cost_center", "employee_category",
  "probation_end_date", "notice_period_days"
];

function withDefaults(data: EmployeeInput): Required<Omit<EmployeeInput, keyof EmployeeInput>> & EmployeeInput {
  const result: any = { ...data };
  for (const field of OPTIONAL_FIELDS) {
    if (result[field] === undefined) result[field] = null;
  }
  return result;
}

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

  private baseSelect(): string {
    return `SELECT
        e.*,
        d.title AS designation_title,
        dep.name AS department_name,
        b.name AS branch_name,
        rm.full_name AS reporting_manager_name
      FROM employees e
      LEFT JOIN designations d ON d.id = e.designation_id
      LEFT JOIN departments dep ON dep.id = e.department_id
      LEFT JOIN branches b ON b.id = e.branch_id
      LEFT JOIN employees rm ON rm.id = e.reporting_manager_id`;
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
    const d = withDefaults(data);
    const result = this.db
      .prepare(
        `INSERT INTO employees
          (employee_code, full_name, first_name, middle_name, last_name, date_of_birth, gender,
           marital_status, blood_group, nationality, designation_id, department_id, branch_id,
           shift_id, date_of_joining, date_of_confirmation, employment_type, reporting_manager_id,
           work_location, grade, cost_center, employee_category, probation_end_date,
           notice_period_days, status)
         VALUES (@employee_code, @full_name, @first_name, @middle_name, @last_name, @date_of_birth,
           @gender, @marital_status, @blood_group, @nationality, @designation_id, @department_id,
           @branch_id, @shift_id, @date_of_joining, @date_of_confirmation, @employment_type,
           @reporting_manager_id, @work_location, @grade, @cost_center, @employee_category,
           @probation_end_date, @notice_period_days, @status)`
      )
      .run(d);
    return Number(result.lastInsertRowid);
  }

  update(id: number, data: EmployeeInput): void {
    const d = withDefaults(data);
    this.db
      .prepare(
        `UPDATE employees SET
          employee_code = @employee_code, full_name = @full_name, first_name = @first_name,
          middle_name = @middle_name, last_name = @last_name, date_of_birth = @date_of_birth,
          gender = @gender, marital_status = @marital_status, blood_group = @blood_group,
          nationality = @nationality, designation_id = @designation_id, department_id = @department_id,
          branch_id = @branch_id, shift_id = @shift_id, date_of_joining = @date_of_joining,
          date_of_confirmation = @date_of_confirmation, employment_type = @employment_type,
          reporting_manager_id = @reporting_manager_id, work_location = @work_location, grade = @grade,
          cost_center = @cost_center, employee_category = @employee_category,
          probation_end_date = @probation_end_date, notice_period_days = @notice_period_days,
          status = @status
        WHERE id = @id`
      )
      .run({ ...d, id });
  }
}
