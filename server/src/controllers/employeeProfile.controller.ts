import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { PersonalDetailsRepository } from "../repositories/employeePersonalDetails.repository";
import { IdentityRepository, maskIdentity } from "../repositories/employeeIdentity.repository";
import { OfficeContactRepository } from "../repositories/employeeOfficeContact.repository";
import { EmergencyContactRepository } from "../repositories/employeeEmergencyContact.repository";
import { ExperienceRepository } from "../repositories/employeeExperience.repository";
import { EducationRepository } from "../repositories/employeeEducation.repository";
import { DependentRepository } from "../repositories/employeeDependent.repository";
import { ExitDetailsRepository } from "../repositories/employeeExitDetails.repository";
import { EmployeeDocumentRepository } from "../repositories/employeeDocument.repository";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../services/auditLog.service";

// ===== Aggregated profile =====

export function getEmployeeProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    const employee = new EmployeeRepository(db).findById(employeeId);
    if (!employee) throw new AppError(404, "Employee not found");

    const identityRepo = new IdentityRepository(db);
    const rawIdentity = identityRepo.find(employeeId);
    // Identity numbers are masked for everyone except ADMIN - matches
    // the module spec's "should not be displayed completely to
    // unauthorized users." HR can still edit (see saveIdentity), just
    // can't see the previously-saved full value again afterward.
    const identity = rawIdentity
      ? req.user!.role === "ADMIN"
        ? rawIdentity
        : maskIdentity(rawIdentity)
      : null;

    res.json({
      employee,
      personal: new PersonalDetailsRepository(db).find(employeeId) ?? null,
      identity,
      officeContact: new OfficeContactRepository(db).find(employeeId) ?? null,
      emergencyContacts: new EmergencyContactRepository(db).findByEmployee(employeeId),
      experience: new ExperienceRepository(db).findByEmployee(employeeId),
      education: new EducationRepository(db).findByEmployee(employeeId),
      dependents: new DependentRepository(db).findByEmployee(employeeId),
      exitDetails: new ExitDetailsRepository(db).find(employeeId) ?? null,
      documents: new EmployeeDocumentRepository(db).findByEmployee(employeeId)
    });
  } catch (err) {
    next(err);
  }
}

function requireEmployee(db: ReturnType<typeof getDb>, id: number) {
  if (!new EmployeeRepository(db).findById(id)) {
    throw new AppError(404, "Employee not found");
  }
}

// ===== Personal details =====

const personalSchema = z.object({
  father_name: z.string().nullable().optional().default(null),
  mother_name: z.string().nullable().optional().default(null),
  spouse_name: z.string().nullable().optional().default(null),
  religion: z.string().nullable().optional().default(null),
  personal_email: z.string().email().nullable().optional().or(z.literal("")).default(null),
  personal_mobile: z.string().nullable().optional().default(null),
  alternate_mobile: z.string().nullable().optional().default(null),
  current_address: z.string().nullable().optional().default(null),
  permanent_address: z.string().nullable().optional().default(null),
  same_as_permanent: z.number().default(0),
  city: z.string().nullable().optional().default(null),
  state: z.string().nullable().optional().default(null),
  country: z.string().nullable().optional().default("India"),
  pin_code: z.string().nullable().optional().default(null)
});

export function savePersonalDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = personalSchema.parse(req.body);
    // "Same as Permanent Address" checkbox: copy server-side too, so
    // the stored current_address can't drift from permanent_address
    // if a client ever sends the flag without matching addresses.
    if (data.same_as_permanent) data.current_address = data.permanent_address;
    new PersonalDetailsRepository(db).upsert(employeeId, data as any);
    logAudit(db, req.user!.id, "UPDATE_EMPLOYEE_PERSONAL", "employees", employeeId);
    res.json(new PersonalDetailsRepository(db).find(employeeId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, "Invalid personal details"));
    next(err);
  }
}

// ===== Identity =====

const identitySchema = z.object({
  pan_number: z.string().nullable().optional().default(null),
  aadhaar_number: z.string().nullable().optional().default(null),
  passport_number: z.string().nullable().optional().default(null),
  passport_expiry: z.string().nullable().optional().default(null),
  driving_licence_number: z.string().nullable().optional().default(null),
  driving_licence_expiry: z.string().nullable().optional().default(null),
  voter_id: z.string().nullable().optional().default(null),
  uan_number: z.string().nullable().optional().default(null),
  pf_number: z.string().nullable().optional().default(null),
  esi_number: z.string().nullable().optional().default(null)
});

export function saveIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = identitySchema.parse(req.body);

    if (data.passport_expiry && isNaN(new Date(data.passport_expiry).getTime())) {
      throw new AppError(400, "Passport expiry must be a valid date");
    }

    new IdentityRepository(db).upsert(employeeId, data);
    // Never log the actual identity values, even in the audit trail.
    logAudit(db, req.user!.id, "UPDATE_EMPLOYEE_IDENTITY", "employees", employeeId);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, "Invalid identity data"));
    next(err);
  }
}

// ===== Office contact =====

const officeContactSchema = z.object({
  official_email: z.string().email().nullable().optional().or(z.literal("")).default(null),
  extension_number: z.string().nullable().optional().default(null),
  office_mobile: z.string().nullable().optional().default(null)
});

export function saveOfficeContact(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = officeContactSchema.parse(req.body);
    new OfficeContactRepository(db).upsert(employeeId, data as any);
    res.json(new OfficeContactRepository(db).find(employeeId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, "Invalid office contact data"));
    next(err);
  }
}

// ===== Emergency contacts (repeatable) =====

const emergencyContactSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  relationship: z.string().nullable().optional().default(null),
  mobile_number: z.string().nullable().optional().default(null),
  alternate_number: z.string().nullable().optional().default(null),
  address: z.string().nullable().optional().default(null)
});

export function addEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = emergencyContactSchema.parse(req.body);
    const id = new EmergencyContactRepository(db).create(employeeId, data);
    res.status(201).json({ id, employee_id: employeeId, ...data });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid contact"));
    next(err);
  }
}

export function updateEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const contactId = Number(req.params.contactId);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = emergencyContactSchema.parse(req.body);
    new EmergencyContactRepository(db).update(contactId, employeeId, data);
    res.json({ id: contactId, employee_id: employeeId, ...data });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid contact"));
    next(err);
  }
}

export function deleteEmergencyContact(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const contactId = Number(req.params.contactId);
  new EmergencyContactRepository(getDb()).delete(contactId, employeeId);
  res.json({ success: true });
}

// ===== Work experience (repeatable) =====

const experienceSchema = z.object({
  previous_company: z.string().min(1, "Previous company is required"),
  job_title: z.string().nullable().optional().default(null),
  department: z.string().nullable().optional().default(null),
  location: z.string().nullable().optional().default(null),
  date_joined: z.string().nullable().optional().default(null),
  date_left: z.string().nullable().optional().default(null),
  last_drawn_salary: z.number().nullable().optional().default(null),
  reason_for_leaving: z.string().nullable().optional().default(null),
  previous_employee_id: z.string().nullable().optional().default(null)
});

function validateDateOrder(dateJoined: string | null, dateLeft: string | null) {
  if (dateJoined && dateLeft && new Date(dateLeft) < new Date(dateJoined)) {
    throw new AppError(400, "Date left cannot be before date joined");
  }
}

export function addExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = experienceSchema.parse(req.body);
    validateDateOrder(data.date_joined, data.date_left);
    const id = new ExperienceRepository(db).create(employeeId, data);
    res.status(201).json(new ExperienceRepository(db).findByEmployee(employeeId).find((e) => e.id === id));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid experience entry"));
    next(err);
  }
}

export function updateExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const expId = Number(req.params.expId);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = experienceSchema.parse(req.body);
    validateDateOrder(data.date_joined, data.date_left);
    new ExperienceRepository(db).update(expId, employeeId, data);
    res.json(new ExperienceRepository(db).findByEmployee(employeeId).find((e) => e.id === expId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid experience entry"));
    next(err);
  }
}

export function deleteExperience(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const expId = Number(req.params.expId);
  new ExperienceRepository(getDb()).delete(expId, employeeId);
  res.json({ success: true });
}

// ===== Education (repeatable) =====

const educationSchema = z.object({
  qualification: z.string().min(1, "Qualification is required"),
  specialization: z.string().nullable().optional().default(null),
  institution: z.string().nullable().optional().default(null),
  university_board: z.string().nullable().optional().default(null),
  year_of_passing: z.number().nullable().optional().default(null),
  percentage_cgpa: z.number().min(0).max(100).nullable().optional().default(null),
  mode_of_education: z.string().nullable().optional().default(null)
});

export function addEducation(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = educationSchema.parse(req.body);
    const id = new EducationRepository(db).create(employeeId, data);
    res.status(201).json(new EducationRepository(db).findByEmployee(employeeId).find((e) => e.id === id));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid education entry"));
    next(err);
  }
}

export function updateEducation(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const eduId = Number(req.params.eduId);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = educationSchema.parse(req.body);
    new EducationRepository(db).update(eduId, employeeId, data);
    res.json(new EducationRepository(db).findByEmployee(employeeId).find((e) => e.id === eduId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid education entry"));
    next(err);
  }
}

export function deleteEducation(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const eduId = Number(req.params.eduId);
  new EducationRepository(getDb()).delete(eduId, employeeId);
  res.json({ success: true });
}

// ===== Dependents (repeatable) =====

const dependentSchema = z.object({
  dependent_name: z.string().min(1, "Dependent name is required"),
  relationship: z.string().nullable().optional().default(null),
  date_of_birth: z.string().nullable().optional().default(null),
  gender: z.string().nullable().optional().default(null),
  occupation: z.string().nullable().optional().default(null),
  mobile_number: z.string().nullable().optional().default(null),
  email: z.string().email().nullable().optional().or(z.literal("")).default(null),
  address: z.string().nullable().optional().default(null),
  id_number: z.string().nullable().optional().default(null),
  is_nominee: z.number().default(0),
  nominee_percentage: z.number().min(0).max(100).nullable().optional().default(null),
  medical_insurance_eligible: z.number().default(0),
  remarks: z.string().nullable().optional().default(null)
});

export function addDependent(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = dependentSchema.parse(req.body);
    const id = new DependentRepository(db).create(employeeId, data as any);
    res.status(201).json(new DependentRepository(db).findByEmployee(employeeId).find((d) => d.id === id));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid dependent entry"));
    next(err);
  }
}

export function updateDependent(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const depId = Number(req.params.depId);
    const db = getDb();
    requireEmployee(db, employeeId);
    const data = dependentSchema.parse(req.body);
    new DependentRepository(db).update(depId, employeeId, data as any);
    res.json(new DependentRepository(db).findByEmployee(employeeId).find((d) => d.id === depId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid dependent entry"));
    next(err);
  }
}

export function deleteDependent(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const depId = Number(req.params.depId);
  new DependentRepository(getDb()).delete(depId, employeeId);
  res.json({ success: true });
}

// ===== Exit details =====

const exitSchema = z.object({
  exit_type: z.enum([
    "Resignation", "Termination", "Retirement", "Absconding", "Contract Expiry", "Death", "Other"
  ]).nullable().optional().default(null),
  resignation_date: z.string().nullable().optional().default(null),
  last_working_date: z.string().nullable().optional().default(null),
  notice_period_days: z.number().nullable().optional().default(null),
  notice_period_served: z.number().default(0),
  notice_period_waived: z.number().default(0),
  reason_for_leaving: z.string().nullable().optional().default(null),
  exit_interview_date: z.string().nullable().optional().default(null),
  exit_interview_remarks: z.string().nullable().optional().default(null),
  company_assets_returned: z.number().default(0),
  no_due_status: z.string().nullable().optional().default(null),
  fnf_status: z.string().nullable().optional().default(null),
  settlement_date: z.string().nullable().optional().default(null),
  final_settlement_amount: z.number().nullable().optional().default(null),
  remarks: z.string().nullable().optional().default(null)
});

export function saveExitDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    const employee = new EmployeeRepository(db).findById(employeeId);
    if (!employee) throw new AppError(404, "Employee not found");
    if (employee.status === "ACTIVE") {
      throw new AppError(
        400,
        "Exit details are not applicable while the employee is Active - change their status first"
      );
    }

    const data = exitSchema.parse(req.body);
    if (
      data.resignation_date &&
      data.last_working_date &&
      new Date(data.last_working_date) < new Date(data.resignation_date)
    ) {
      throw new AppError(400, "Last working date cannot be before the resignation date");
    }

    new ExitDetailsRepository(db).upsert(employeeId, data);
    logAudit(db, req.user!.id, "UPDATE_EMPLOYEE_EXIT", "employees", employeeId, {
      exit_type: data.exit_type
    });
    res.json(new ExitDetailsRepository(db).find(employeeId));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.issues[0]?.message ?? "Invalid exit details"));
    next(err);
  }
}

// ===== Documents =====

// Like DB_PATH, this must point somewhere writable. In the packaged
// app, Electron's main process sets UPLOADS_DIR to a folder under the
// OS's user-data directory before the server starts - writing inside
// the packaged app's own resources (an asar archive) isn't possible
// at all, the same reason the SQLite file can't live there either.
const DOCUMENTS_DIR =
  process.env.UPLOADS_DIR ??
  path.resolve(__dirname, "../../uploads/employee-documents");

export function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const db = getDb();
    requireEmployee(db, employeeId);
    if (!req.file) throw new AppError(400, "No file was uploaded");

    const documentType = (req.body.document_type as string) || "Other";
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    const storedFilename = `${employeeId}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fullPath = path.join(DOCUMENTS_DIR, storedFilename);
    fs.writeFileSync(fullPath, req.file.buffer);

    const id = new EmployeeDocumentRepository(db).create(
      employeeId,
      req.file.originalname,
      documentType,
      storedFilename,
      req.user!.id
    );
    logAudit(db, req.user!.id, "UPLOAD_EMPLOYEE_DOCUMENT", "employees", employeeId, {
      documentType,
      fileName: req.file.originalname
    });
    res.status(201).json(new EmployeeDocumentRepository(db).findById(id));
  } catch (err) {
    next(err);
  }
}

export function listDocuments(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  res.json(new EmployeeDocumentRepository(getDb()).findByEmployee(employeeId));
}

export function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const docId = Number(req.params.docId);
    const doc = new EmployeeDocumentRepository(getDb()).findById(docId);
    if (!doc) throw new AppError(404, "Document not found");
    const fullPath = path.join(DOCUMENTS_DIR, doc.file_path);
    if (!fs.existsSync(fullPath)) throw new AppError(404, "File is missing from storage");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.document_name}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export function deleteDocument(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const docId = Number(req.params.docId);
  const db = getDb();
  const repo = new EmployeeDocumentRepository(db);
  const doc = repo.findById(docId);
  if (doc) {
    const fullPath = path.join(DOCUMENTS_DIR, doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  repo.delete(docId, employeeId);
  res.json({ success: true });
}
