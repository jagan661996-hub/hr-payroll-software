import { Router } from "express";
import {
  getPfReport,
  getEsiReport,
  getSalaryRegister,
  exportSalaryRegisterExcel
} from "../controllers/report.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(requireRole("ADMIN", "HR")); // reports contain sensitive salary data

router.get("/pf", getPfReport);
router.get("/esi", getEsiReport);
router.get("/salary-register", getSalaryRegister);
router.get("/salary-register/export", exportSalaryRegisterExcel);

export default router;
