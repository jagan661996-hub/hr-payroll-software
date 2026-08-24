import { Router } from "express";
import multer from "multer";
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
  limits: { fileSize: 20 * 1024 * 1024 } // scans of certificates/IDs can be a few MB
});

const router = Router();
router.use(authenticate);

// Aggregated read - identity masking for non-admins happens inside
// the controller itself, not here, since it depends on the actual
// stored data.
router.get("/:id/profile", getEmployeeProfile);

router.put("/:id/personal", requireRole("ADMIN", "HR"), savePersonalDetails);
router.put("/:id/identity", requireRole("ADMIN", "HR"), saveIdentity);
router.put("/:id/office-contact", requireRole("ADMIN", "HR"), saveOfficeContact);

router.post("/:id/emergency-contacts", requireRole("ADMIN", "HR"), addEmergencyContact);
router.put("/:id/emergency-contacts/:contactId", requireRole("ADMIN", "HR"), updateEmergencyContact);
router.delete("/:id/emergency-contacts/:contactId", requireRole("ADMIN", "HR"), deleteEmergencyContact);

router.post("/:id/experience", requireRole("ADMIN", "HR"), addExperience);
router.put("/:id/experience/:expId", requireRole("ADMIN", "HR"), updateExperience);
router.delete("/:id/experience/:expId", requireRole("ADMIN", "HR"), deleteExperience);

router.post("/:id/education", requireRole("ADMIN", "HR"), addEducation);
router.put("/:id/education/:eduId", requireRole("ADMIN", "HR"), updateEducation);
router.delete("/:id/education/:eduId", requireRole("ADMIN", "HR"), deleteEducation);

router.post("/:id/dependents", requireRole("ADMIN", "HR"), addDependent);
router.put("/:id/dependents/:depId", requireRole("ADMIN", "HR"), updateDependent);
router.delete("/:id/dependents/:depId", requireRole("ADMIN", "HR"), deleteDependent);

router.put("/:id/exit", requireRole("ADMIN", "HR"), saveExitDetails);

router.get("/:id/documents", listDocuments);
router.post("/:id/documents", requireRole("ADMIN", "HR"), upload.single("file"), uploadDocument);
router.get("/:id/documents/:docId/download", downloadDocument);
router.delete("/:id/documents/:docId", requireRole("ADMIN", "HR"), deleteDocument);

export default router;
