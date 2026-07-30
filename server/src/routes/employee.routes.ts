import { Router } from "express";
import { listEmployees, getEmployeeSummary } from "../controllers/employee.controller";

const router = Router();
router.get("/", listEmployees);
router.get("/summary", getEmployeeSummary);

export default router;
