import Database from "better-sqlite3";

export interface EmergencyContact {
  id: number;
  employee_id: number;
  contact_name: string;
  relationship: string | null;
  mobile_number: string | null;
  alternate_number: string | null;
  address: string | null;
}

export type EmergencyContactInput = Omit<EmergencyContact, "id" | "employee_id">;

export class EmergencyContactRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): EmergencyContact[] {
    return this.db
      .prepare("SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY id")
      .all(employeeId) as EmergencyContact[];
  }

  create(employeeId: number, data: EmergencyContactInput): number {
    const result = this.db
      .prepare(
        `INSERT INTO employee_emergency_contacts
          (employee_id, contact_name, relationship, mobile_number, alternate_number, address)
         VALUES (@employee_id, @contact_name, @relationship, @mobile_number, @alternate_number, @address)`
      )
      .run({ ...data, employee_id: employeeId });
    return Number(result.lastInsertRowid);
  }

  update(id: number, employeeId: number, data: EmergencyContactInput): void {
    this.db
      .prepare(
        `UPDATE employee_emergency_contacts SET
          contact_name=@contact_name, relationship=@relationship, mobile_number=@mobile_number,
          alternate_number=@alternate_number, address=@address
         WHERE id=@id AND employee_id=@employee_id`
      )
      .run({ ...data, id, employee_id: employeeId });
  }

  delete(id: number, employeeId: number): void {
    this.db
      .prepare("DELETE FROM employee_emergency_contacts WHERE id = ? AND employee_id = ?")
      .run(id, employeeId);
  }
}
