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
}
