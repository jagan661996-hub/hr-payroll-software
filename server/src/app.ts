import express from "express";
import cors from "cors";
import morgan from "morgan";
import healthRoutes from "./routes/health.routes";
import employeeRoutes from "./routes/employee.routes";
import authRoutes from "./routes/auth.routes";
import metaRoutes from "./routes/meta.routes";
import attendanceRoutes from "./routes/attendance.routes";
import leaveRoutes from "./routes/leave.routes";
import payrollRoutes from "./routes/payroll.routes";
import onDutyRoutes from "./routes/onDuty.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/meta", metaRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/leave", leaveRoutes);
  app.use("/api/payroll", payrollRoutes);
  app.use("/api/on-duty", onDutyRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/reports", reportRoutes);

  app.use(errorHandler);

  return app;
}
