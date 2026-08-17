import Database from "better-sqlite3";

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
}

export class ShiftRepository {
  constructor(private db: Database.Database) {}

  findAll(): Shift[] {
    return this.db.prepare("SELECT * FROM shifts ORDER BY name").all() as Shift[];
  }
}
