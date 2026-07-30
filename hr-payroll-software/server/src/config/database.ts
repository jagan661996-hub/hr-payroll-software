import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { env } from "./env";

// Single shared connection. better-sqlite3 is synchronous, which is
// fine (and fast) for a single-user/office-LAN offline desktop app -
// no async pool needed. Migrations are applied in order from
// database/migrations on first boot (Phase 2 fleshes this out with a
// real migration runner + seed data).
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(env.dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(env.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
