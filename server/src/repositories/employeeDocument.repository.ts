import Database from "better-sqlite3";

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_name: string;
  document_type: string;
  file_path: string;
  uploaded_by: number | null;
  uploaded_at: string;
}

export class EmployeeDocumentRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): EmployeeDocument[] {
    return this.db
      .prepare("SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY uploaded_at DESC")
      .all(employeeId) as EmployeeDocument[];
  }

  findById(id: number): EmployeeDocument | undefined {
    return this.db.prepare("SELECT * FROM employee_documents WHERE id = ?").get(id) as
      | EmployeeDocument
      | undefined;
  }

  create(
    employeeId: number,
    documentName: string,
    documentType: string,
    filePath: string,
    uploadedBy: number
  ): number {
    const result = this.db
      .prepare(
        `INSERT INTO employee_documents (employee_id, document_name, document_type, file_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(employeeId, documentName, documentType, filePath, uploadedBy);
    return Number(result.lastInsertRowid);
  }

  delete(id: number, employeeId: number): void {
    this.db.prepare("DELETE FROM employee_documents WHERE id = ? AND employee_id = ?").run(
      id,
      employeeId
    );
  }
}
