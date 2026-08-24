import Database from "better-sqlite3";

export interface OfficeContact {
  employee_id: number;
  official_email: string | null;
  extension_number: string | null;
  office_mobile: string | null;
}

export type OfficeContactInput = Omit<OfficeContact, "employee_id">;

export class OfficeContactRepository {
  constructor(private db: Database.Database) {}

  find(employeeId: number): OfficeContact | undefined {
    return this.db
      .prepare("SELECT * FROM employee_office_contact WHERE employee_id = ?")
      .get(employeeId) as OfficeContact | undefined;
  }

  upsert(employeeId: number, data: OfficeContactInput): void {
    const exists = this.find(employeeId);
    const payload = { ...data, employee_id: employeeId };
    if (exists) {
      this.db
        .prepare(
          `UPDATE employee_office_contact SET
            official_email=@official_email, extension_number=@extension_number, office_mobile=@office_mobile
           WHERE employee_id=@employee_id`
        )
        .run(payload);
    } else {
      this.db
        .prepare(
          `INSERT INTO employee_office_contact (employee_id, official_email, extension_number, office_mobile)
           VALUES (@employee_id, @official_email, @extension_number, @office_mobile)`
        )
        .run(payload);
    }
  }
}
