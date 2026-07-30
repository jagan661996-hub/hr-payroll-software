import path from "path";

// Central place for environment-driven configuration. Values fall
// back to sensible offline-desktop defaults since this app ships
// without a hosted .env by default (Electron sets these at runtime
// from userData path instead - see electron/main.ts in a later phase).
export const env = {
  port: Number(process.env.PORT ?? 4310),
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  dbPath: process.env.DB_PATH ?? path.resolve(__dirname, "../../../database/hrms.db"),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
