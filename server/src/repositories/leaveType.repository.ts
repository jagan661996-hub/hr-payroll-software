import Database from "better-sqlite3";

export interface LeaveType {
  id: number;
  name: string;
  paid: number;
  default_annual_days: number;
}

export class LeaveTypeRepository {
  constructor(private db: Database.Database) {}

  findAll(): LeaveType[] {
    return this.db.prepare("SELECT * FROM leave_types ORDER BY name").all() as LeaveType[];
  }
}
