import { Router } from "express";
import {
  getMeta,
  createDepartment,
  createDesignation,
  createBranch,
  createShift
} from "../controllers/meta.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", getMeta);

// Letting HR/Admin add new master values on the fly (from the
// Add/Edit Employee form) instead of only via the initial seed data.
router.post("/departments", requireRole("ADMIN", "HR"), createDepartment);
router.post("/designations", requireRole("ADMIN", "HR"), createDesignation);
router.post("/branches", requireRole("ADMIN", "HR"), createBranch);
router.post("/shifts", requireRole("ADMIN", "HR"), createShift);

export default router;
