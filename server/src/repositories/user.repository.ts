import Database from "better-sqlite3";
import { User } from "../models/user.model";

export class UserRepository {
  constructor(private db: Database.Database) {}

  findByEmail(email: string): User | undefined {
    return this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | User
      | undefined;
  }

  findById(id: number): User | undefined {
    return this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  }
}
