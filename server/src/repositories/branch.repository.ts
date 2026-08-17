import Database from "better-sqlite3";

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export class BranchRepository {
  constructor(private db: Database.Database) {}

  findAll(): Branch[] {
    return this.db.prepare("SELECT * FROM branches ORDER BY name").all() as Branch[];
  }
}
