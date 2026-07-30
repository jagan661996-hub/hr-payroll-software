import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// Migrations live in database/migrations at the repo root. This path
// is computed relative to the compiled file's location
// (server/dist/database/migrate.js), matching the same pattern used
// in config/database.ts for the SQLite file itself.
const MIGRATIONS_DIR = path.resolve(__dirname, "../../../database/migrations");

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const alreadyApplied = new Set(
    (db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[]).map(
      (row) => row.name
    )
  );

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`No migrations directory found at ${MIGRATIONS_DIR}`);
    return;
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // filenames are numerically prefixed (001_, 002_...) so sort = run order

  for (const file of migrationFiles) {
    if (alreadyApplied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
    });
    applyMigration();
    console.log(`[migrate] applied ${file}`);
  }
}
