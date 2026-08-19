import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { env } from "./env";

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

// Used only by the Settings > Restore Backup flow: flush any pending
// WAL writes to the main file, close the connection, and clear the
// singleton so the next getDb() call reopens fresh against whatever
// file is on disk (which the restore handler will have just replaced).
export function checkpointAndCloseDb(): void {
  if (!db) return;
  db.pragma("wal_checkpoint(FULL)");
  db.close();
  db = null;
}
