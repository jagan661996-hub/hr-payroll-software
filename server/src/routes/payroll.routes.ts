import { Router } from "express";
import {
  getSalaryStructure,
  saveSalaryStructure,
  runPayroll,
  updatePayDate,
  listPayslips,
  downloadPayslipPdf
} from "../controllers/payroll.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/structure/:employeeId", getSalaryStructure);
router.put("/structure/:employeeId", requireRole("ADMIN", "HR"), saveSalaryStructure);
router.post("/run", requireRole("ADMIN", "HR"), runPayroll);
router.put("/pay-date", requireRole("ADMIN", "HR"), updatePayDate);
router.get("/payslips", listPayslips);
router.get("/payslips/:id/pdf", downloadPayslipPdf);

export default router;
