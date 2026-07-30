import Database from "better-sqlite3";

export interface Department {
  id: number;
  name: string;
}

export class DepartmentRepository {
  constructor(private db: Database.Database) {}

  findAll(): Department[] {
    return this.db.prepare("SELECT * FROM departments ORDER BY name").all() as Department[];
  }
}
