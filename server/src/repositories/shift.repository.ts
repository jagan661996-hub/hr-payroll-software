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

  create(data: { name: string; start_time: string; end_time: string; grace_minutes?: number }): Shift {
    const graceMinutes = data.grace_minutes ?? 10;
    const result = this.db
      .prepare(
        "INSERT INTO shifts (name, start_time, end_time, grace_minutes) VALUES (?, ?, ?, ?)"
      )
      .run(data.name, data.start_time, data.end_time, graceMinutes);
    return {
      id: Number(result.lastInsertRowid),
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
      grace_minutes: graceMinutes
    };
  }
}
