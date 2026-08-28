import Database from "better-sqlite3";
import { parseIsoDateLocal } from "../utils/dateUtils";

export interface Experience {
  id: number;
  employee_id: number;
  previous_company: string;
  job_title: string | null;
  department: string | null;
  location: string | null;
  date_joined: string | null;
  date_left: string | null;
  total_experience_months: number | null;
  last_drawn_salary: number | null;
  reason_for_leaving: string | null;
  previous_employee_id: string | null;
  experience_certificate_path: string | null;
  relieving_letter_path: string | null;
}

export type ExperienceInput = Omit<
  Experience,
  "id" | "employee_id" | "total_experience_months" | "experience_certificate_path" | "relieving_letter_path"
>;

function monthsBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromDate = parseIsoDateLocal(from);
  const toDate = parseIsoDateLocal(to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;
  return Math.max(
    0,
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())
  );
}

export class ExperienceRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): Experience[] {
    return this.db
      .prepare("SELECT * FROM employee_experience WHERE employee_id = ? ORDER BY date_joined DESC")
      .all(employeeId) as Experience[];
  }

  create(employeeId: number, data: ExperienceInput): number {
    const totalMonths = monthsBetween(data.date_joined, data.date_left);
    const result = this.db
      .prepare(
        `INSERT INTO employee_experience
          (employee_id, previous_company, job_title, department, location, date_joined, date_left,
           total_experience_months, last_drawn_salary, reason_for_leaving, previous_employee_id)
         VALUES (@employee_id, @previous_company, @job_title, @department, @location, @date_joined,
           @date_left, @total_experience_months, @last_drawn_salary, @reason_for_leaving, @previous_employee_id)`
      )
      .run({ ...data, employee_id: employeeId, total_experience_months: totalMonths });
    return Number(result.lastInsertRowid);
  }

  update(id: number, employeeId: number, data: ExperienceInput): void {
    const totalMonths = monthsBetween(data.date_joined, data.date_left);
    this.db
      .prepare(
        `UPDATE employee_experience SET
          previous_company=@previous_company, job_title=@job_title, department=@department,
          location=@location, date_joined=@date_joined, date_left=@date_left,
          total_experience_months=@total_experience_months, last_drawn_salary=@last_drawn_salary,
          reason_for_leaving=@reason_for_leaving, previous_employee_id=@previous_employee_id
         WHERE id=@id AND employee_id=@employee_id`
      )
      .run({ ...data, id, employee_id: employeeId, total_experience_months: totalMonths });
  }

  delete(id: number, employeeId: number): void {
    this.db
      .prepare("DELETE FROM employee_experience WHERE id = ? AND employee_id = ?")
      .run(id, employeeId);
  }
}
