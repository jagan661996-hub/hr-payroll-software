import { Router } from "express";
import multer from "multer";
import {
  listEmployees,
  getEmployeeSummary,
  createEmployee,
  updateEmployee
} from "../controllers/employee.controller";
import {
  getEmployeeProfile,
  savePersonalDetails,
  saveIdentity,
  saveOfficeContact,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  addDependent,
  updateDependent,
  deleteDependent,
  saveExitDetails,
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument
} from "../controllers/employeeProfile.controller";
import { authenticate, requireRole } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // supporting documents (scans, certificates) can be sizeable
});

const router = Router();

router.use(authenticate);

// ===== Basic list/summary/CRUD (Phase 4) =====
router.get("/", listEmployees);
router.get("/summary", getEmployeeSummary);
router.post("/", requireRole("ADMIN", "HR"), createEmployee);
router.put("/:id", requireRole("ADMIN", "HR"), updateEmployee);

// ===== Full profile (aggregated read) =====
router.get("/:id/profile", getEmployeeProfile);

// ===== Personal / Identity / Office Contact (1:1 sections) =====
router.put("/:id/personal", requireRole("ADMIN", "HR"), savePersonalDetails);
router.put("/:id/identity", requireRole("ADMIN", "HR"), saveIdentity);
router.put("/:id/office-contact", requireRole("ADMIN", "HR"), saveOfficeContact);

// ===== Emergency contacts (repeatable) =====
router.post("/:id/emergency-contacts", requireRole("ADMIN", "HR"), addEmergencyContact);
router.put("/:id/emergency-contacts/:contactId", requireRole("ADMIN", "HR"), updateEmergencyContact);
router.delete("/:id/emergency-contacts/:contactId", requireRole("ADMIN", "HR"), deleteEmergencyContact);

// ===== Work experience (repeatable) =====
router.post("/:id/experience", requireRole("ADMIN", "HR"), addExperience);
router.put("/:id/experience/:expId", requireRole("ADMIN", "HR"), updateExperience);
router.delete("/:id/experience/:expId", requireRole("ADMIN", "HR"), deleteExperience);

// ===== Education (repeatable) =====
router.post("/:id/education", requireRole("ADMIN", "HR"), addEducation);
router.put("/:id/education/:eduId", requireRole("ADMIN", "HR"), updateEducation);
router.delete("/:id/education/:eduId", requireRole("ADMIN", "HR"), deleteEducation);

// ===== Dependents (repeatable) =====
router.post("/:id/dependents", requireRole("ADMIN", "HR"), addDependent);
router.put("/:id/dependents/:depId", requireRole("ADMIN", "HR"), updateDependent);
router.delete("/:id/dependents/:depId", requireRole("ADMIN", "HR"), deleteDependent);

// ===== Exit details =====
router.put("/:id/exit", requireRole("ADMIN", "HR"), saveExitDetails);

// ===== Documents =====
router.post("/:id/documents", requireRole("ADMIN", "HR"), upload.single("file"), uploadDocument);
router.get("/:id/documents", listDocuments);
router.get("/:id/documents/:docId/download", downloadDocument);
router.delete("/:id/documents/:docId", requireRole("ADMIN", "HR"), deleteDocument);

export default router;
