import { Router } from "express";
import { downloadAppointmentLetter } from "../controllers/document.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get(
  "/appointment-letter/:employeeId",
  requireRole("ADMIN", "HR"),
  downloadAppointmentLetter
);

export default router;
