import { Router } from "express";
import multer from "multer";
import {
  getMonthAttendance,
  updateAttendanceDay,
  importAttendance,
  exportAttendanceExcel
} from "../controllers/attendance.controller";
import { authenticate, requireRole } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB is plenty for an attendance sheet
});

const router = Router();
router.use(authenticate);

router.get("/", getMonthAttendance);
router.get("/export", exportAttendanceExcel);
router.put("/:employeeId/:date", requireRole("ADMIN", "HR"), updateAttendanceDay);
router.post("/import", requireRole("ADMIN", "HR"), upload.single("file"), importAttendance);

export default router;
