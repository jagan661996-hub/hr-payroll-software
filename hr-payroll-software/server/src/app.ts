import express from "express";
import cors from "cors";
import morgan from "morgan";
import healthRoutes from "./routes/health.routes";
import employeeRoutes from "./routes/employee.routes";
import { errorHandler } from "./middleware/errorHandler";

// Route groups added here as each module lands:
//   /api/auth        -> Phase 3 (Authentication)
//   /api/employees   -> Phase 2 (read-only for now) / full CRUD in Phase 4
//   /api/attendance  -> Phase 5
//   /api/leave       -> Phase 6
//   /api/payroll     -> Phase 7
//   /api/reports     -> Phase 8
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api/health", healthRoutes);
  app.use("/api/employees", employeeRoutes);

  app.use(errorHandler);

  return app;
}
