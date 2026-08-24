import Database from "better-sqlite3";

export interface Education {
  id: number;
  employee_id: number;
  qualification: string;
  specialization: string | null;
  institution: string | null;
  university_board: string | null;
  year_of_passing: number | null;
  percentage_cgpa: number | null;
  mode_of_education: string | null;
  certificate_path: string | null;
}

export type EducationInput = Omit<Education, "id" | "employee_id" | "certificate_path">;

export class EducationRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): Education[] {
    return this.db
      .prepare("SELECT * FROM employee_education WHERE employee_id = ? ORDER BY year_of_passing DESC")
      .all(employeeId) as Education[];
  }

  create(employeeId: number, data: EducationInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO employee_education
          (employee_id, qualification, specialization, institution, university_board,
           year_of_passing, percentage_cgpa, mode_of_education)
         VALUES (@employee_id, @qualification, @specialization, @institution, @university_board,
           @year_of_passing, @percentage_cgpa, @mode_of_education)`
      )
      .run({ ...data, employee_id: employeeId });
    return Number(result.lastInsertRowid);
  }

  update(id: number, employeeId: number, data: EducationInput): void {
    this.db
      .prepare(
        `UPDATE employee_education SET
          qualification=@qualification, specialization=@specialization, institution=@institution,
          university_board=@university_board, year_of_passing=@year_of_passing,
          percentage_cgpa=@percentage_cgpa, mode_of_education=@mode_of_education
         WHERE id=@id AND employee_id=@employee_id`
      )
      .run({ ...data, id, employee_id: employeeId });
  }

  delete(id: number, employeeId: number): void {
    this.db
      .prepare("DELETE FROM employee_education WHERE id = ? AND employee_id = ?")
      .run(id, employeeId);
  }
}
