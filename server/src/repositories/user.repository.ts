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

  findAll(): Omit<User, "password_hash">[] {
    return this.db
      .prepare("SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
      .all() as Omit<User, "password_hash">[];
  }

  create(email: string, passwordHash: string, role: User["role"]): number {
    const result = this.db
      .prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)")
      .run(email, passwordHash, role);
    return Number(result.lastInsertRowid);
  }
}
