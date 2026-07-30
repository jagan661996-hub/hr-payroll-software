import { createApp } from "./app";
import { env } from "./config/env";
import { getDb } from "./config/database";
import { runMigrations } from "./database/migrate";
import { runSeed } from "./database/seed";

const db = getDb();
runMigrations(db);
runSeed(db);

const app = createApp();

app.listen(env.port, () => {
  console.log(`HR Payroll server listening on http://localhost:${env.port}`);
});
