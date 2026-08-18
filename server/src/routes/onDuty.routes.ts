import { Router } from "express";
import {
  listOnDuty,
  applyOnDuty,
  updateOnDutyStatus,
  downloadOnDutyPdf
} from "../controllers/onDuty.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", listOnDuty);
router.post("/", applyOnDuty);
router.put("/:id/status", requireRole("ADMIN", "HR"), updateOnDutyStatus);
router.get("/:id/pdf", downloadOnDutyPdf);

export default router;
