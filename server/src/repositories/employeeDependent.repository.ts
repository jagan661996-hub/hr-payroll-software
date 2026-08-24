import Database from "better-sqlite3";

export interface Dependent {
  id: number;
  employee_id: number;
  dependent_name: string;
  relationship: string | null;
  date_of_birth: string | null;
  gender: string | null;
  occupation: string | null;
  mobile_number: string | null;
  email: string | null;
  address: string | null;
  id_number: string | null;
  is_nominee: number;
  nominee_percentage: number | null;
  medical_insurance_eligible: number;
  remarks: string | null;
}

export type DependentInput = Omit<Dependent, "id" | "employee_id">;

export class DependentRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): Dependent[] {
    return this.db
      .prepare("SELECT * FROM employee_dependents WHERE employee_id = ? ORDER BY id")
      .all(employeeId) as Dependent[];
  }

  create(employeeId: number, data: DependentInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO employee_dependents
          (employee_id, dependent_name, relationship, date_of_birth, gender, occupation,
           mobile_number, email, address, id_number, is_nominee, nominee_percentage,
           medical_insurance_eligible, remarks)
         VALUES (@employee_id, @dependent_name, @relationship, @date_of_birth, @gender, @occupation,
           @mobile_number, @email, @address, @id_number, @is_nominee, @nominee_percentage,
           @medical_insurance_eligible, @remarks)`
      )
      .run({ ...data, employee_id: employeeId });
    return Number(result.lastInsertRowid);
  }

  update(id: number, employeeId: number, data: DependentInput): void {
    this.db
      .prepare(
        `UPDATE employee_dependents SET
          dependent_name=@dependent_name, relationship=@relationship, date_of_birth=@date_of_birth,
          gender=@gender, occupation=@occupation, mobile_number=@mobile_number, email=@email,
          address=@address, id_number=@id_number, is_nominee=@is_nominee,
          nominee_percentage=@nominee_percentage, medical_insurance_eligible=@medical_insurance_eligible,
          remarks=@remarks
         WHERE id=@id AND employee_id=@employee_id`
      )
      .run({ ...data, id, employee_id: employeeId });
  }

  delete(id: number, employeeId: number): void {
    this.db
      .prepare("DELETE FROM employee_dependents WHERE id = ? AND employee_id = ?")
      .run(id, employeeId);
  }
}
