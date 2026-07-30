import { createApp } from "./app";
import { env } from "./config/env";
import { getDb } from "./config/database";

getDb(); // establish/create the SQLite file on boot

const app = createApp();

app.listen(env.port, () => {
  console.log(`HR Payroll server listening on http://localhost:${env.port}`);
});
