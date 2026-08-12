import { Router } from "express";
import { listEmployees, getEmployeeSummary } from "../controllers/employee.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All employee data requires a logged-in user as of Phase 3.
router.use(authenticate);

router.get("/", listEmployees);
router.get("/summary", getEmployeeSummary);

export default router;
