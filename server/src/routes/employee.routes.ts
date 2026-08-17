import { Router } from "express";
import {
  listEmployees,
  getEmployeeSummary,
  createEmployee,
  updateEmployee
} from "../controllers/employee.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", listEmployees);
router.get("/summary", getEmployeeSummary);

router.post("/", requireRole("ADMIN", "HR"), createEmployee);
router.put("/:id", requireRole("ADMIN", "HR"), updateEmployee);

export default router;
