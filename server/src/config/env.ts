import path from "path";

export const env = {
  port: Number(process.env.PORT ?? 4310),
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  dbPath: process.env.DB_PATH ?? path.resolve(__dirname, "../../../database/hrms.db"),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
