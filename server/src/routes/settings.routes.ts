import { Router } from "express";
import multer from "multer";
import {
  getCompanySettings,
  saveCompanySettings,
  listUsers,
  createUser,
  downloadBackup,
  restoreBackup,
  getAuditLogs
} from "../controllers/settings.controller";
import { authenticate, requireRole } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // a DB backup can grow larger than a spreadsheet
});

const router = Router();
router.use(authenticate);
router.use(requireRole("ADMIN")); // everything here is company-wide/administrative

router.get("/company", getCompanySettings);
router.put("/company", saveCompanySettings);

router.get("/users", listUsers);
router.post("/users", createUser);

router.get("/backup", downloadBackup);
router.post("/restore", upload.single("file"), restoreBackup);

router.get("/audit-logs", getAuditLogs);

export default router;
