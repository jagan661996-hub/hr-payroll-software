import Database from "better-sqlite3";

export interface Designation {
  id: number;
  title: string;
}

export class DesignationRepository {
  constructor(private db: Database.Database) {}

  findAll(): Designation[] {
    return this.db.prepare("SELECT * FROM designations ORDER BY title").all() as Designation[];
  }

  create(title: string): Designation {
    const result = this.db.prepare("INSERT INTO designations (title) VALUES (?)").run(title);
    return { id: Number(result.lastInsertRowid), title };
  }
}
