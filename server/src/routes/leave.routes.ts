import { Router } from "express";
import multer from "multer";
import {
  listLeaveTypes,
  listLeaveRequests,
  applyLeave,
  updateLeaveStatus,
  getBalances,
  importLeave
} from "../controllers/leave.controller";
import { authenticate, requireRole } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();
router.use(authenticate);

router.get("/types", listLeaveTypes);
router.get("/balances", getBalances);
router.get("/", listLeaveRequests);
router.post("/", applyLeave);
router.put("/:id/status", requireRole("ADMIN", "HR"), updateLeaveStatus);
router.post("/import", requireRole("ADMIN", "HR"), upload.single("file"), importLeave);

export default router;
