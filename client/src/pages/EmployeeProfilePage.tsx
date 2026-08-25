import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import {
  EmployeeProfile,
  PersonalDetails,
  Identity,
  OfficeContact,
  EmergencyContact,
  Experience,
  Education,
  Dependent,
  ExitDetails
} from "../types/employeeProfile";
import { Employee, MetaData } from "../types/employee";
import AddMasterValueModal from "../components/AddMasterValueModal";

const SECTIONS = [
  "Basic Information",
  "Work Information",
  "Personal Details",
  "Identity Information",
  "Contact Details",
  "Work Experience",
  "Education Details",
  "Dependent Details",
  "Exit Details"
] as const;
type Section = (typeof SECTIONS)[number];

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// Same as Field, but with a small "+ New" link for master-data
// dropdowns (Department/Designation/Branch/Shift) so HR isn't stuck
// only with whatever was seeded at setup.
function FieldWithAction({
  label,
  canEdit,
  onAdd,
  children
}: {
  label: string;
  canEdit: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelCls + " mb-0"}>{label}</label>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            + New
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SaveBar({ onSave, saving, message }: { onSave: () => void; saving: boolean; message: string | null }) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {message && <span className="text-sm text-emerald-600">{message}</span>}
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const employeeId = Number(id);
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "HR";

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("Basic Information");
  const [showDocuments, setShowDocuments] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get(`/employees/${employeeId}/profile`),
      api.get("/meta"),
      api.get("/employees")
    ])
      .then(([profileRes, metaRes, employeesRes]) => {
        setProfile(profileRes.data);
        setMeta(metaRes.data);
        setAllEmployees(employeesRes.data);
      })
      .catch(() => setLoadError("Could not load this employee's profile."))
      .finally(() => setLoading(false));
  }, [employeeId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (loadError || !profile) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
        {loadError ?? "Employee not found."}
      </div>
    );
  }

  const { employee } = profile;
  const initials = employee.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const STATUS_STYLES: Record<Employee["status"], string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    RESIGNED: "bg-amber-50 text-amber-700",
    TERMINATED: "bg-red-50 text-red-700"
  };

  return (
    <div>
      <button
        onClick={() => navigate("/employees")}
        className="text-sm text-brand-600 hover:text-brand-800 mb-3"
      >
        ← Back to Employees
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-xl2 shadow-card p-6 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{employee.full_name}</div>
            <div className="text-sm text-slate-500">
              {employee.employee_code} · {employee.designation_title ?? "—"} ·{" "}
              {employee.department_name ?? "—"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Joined {employee.date_of_joining}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[employee.status]}`}
          >
            {employee.status}
          </span>
          <button
            onClick={() => setShowDocuments(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700"
          >
            Documents ({profile.documents.length})
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                disabled={s === "Exit Details" && employee.status === "ACTIVE"}
                className={`block w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-b-0 ${
                  section === s
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : s === "Exit Details" && employee.status === "ACTIVE"
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 bg-white rounded-xl2 shadow-card p-6">
          {section === "Basic Information" && (
            <BasicInfoSection employee={employee} canEdit={canEdit} onSaved={loadProfile} />
          )}
          {section === "Work Information" && meta && (
            <WorkInfoSection
              employee={employee}
              meta={meta}
              allEmployees={allEmployees}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Personal Details" && (
            <PersonalSection
              employeeId={employeeId}
              data={profile.personal}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Identity Information" && (
            <IdentitySection
              employeeId={employeeId}
              data={profile.identity}
              isAdmin={role === "ADMIN"}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Contact Details" && (
            <ContactSection
              employeeId={employeeId}
              personal={profile.personal}
              officeContact={profile.officeContact}
              emergencyContacts={profile.emergencyContacts}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Work Experience" && (
            <ExperienceSection
              employeeId={employeeId}
              rows={profile.experience}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Education Details" && (
            <EducationSection
              employeeId={employeeId}
              rows={profile.education}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Dependent Details" && (
            <DependentSection
              employeeId={employeeId}
              rows={profile.dependents}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
          {section === "Exit Details" && (
            <ExitSection
              employeeId={employeeId}
              data={profile.exitDetails}
              isActive={employee.status === "ACTIVE"}
              canEdit={canEdit}
              onSaved={loadProfile}
            />
          )}
        </div>
      </div>

      {showDocuments && (
        <DocumentsModal
          employeeId={employeeId}
          canEdit={canEdit}
          onClose={() => setShowDocuments(false)}
          onChanged={loadProfile}
        />
      )}
    </div>
  );
}

// ===================== Basic Information =====================

function BasicInfoSection({
  employee,
  canEdit,
  onSaved
}: {
  employee: EmployeeProfile["employee"];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_code: employee.employee_code,
    first_name: employee.first_name ?? "",
    middle_name: employee.middle_name ?? "",
    last_name: employee.last_name ?? "",
    full_name: employee.full_name,
    date_of_birth: employee.date_of_birth ?? "",
    gender: employee.gender ?? "",
    marital_status: employee.marital_status ?? "",
    blood_group: employee.blood_group ?? "",
    nationality: employee.nationality ?? "",
    status: employee.status,
    date_of_joining: employee.date_of_joining
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/employees/${employee.id}`, {
        ...form,
        designation_id: employee.designation_id,
        department_id: employee.department_id,
        branch_id: employee.branch_id,
        shift_id: employee.shift_id
      });
      setMessage("Saved.");
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Basic Information</h3>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Employee Code">
          <input
            disabled={!canEdit}
            value={form.employee_code}
            onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="First Name">
          <input
            disabled={!canEdit}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Middle Name">
          <input
            disabled={!canEdit}
            value={form.middle_name}
            onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Last Name">
          <input
            disabled={!canEdit}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Full Name (display)">
          <input
            disabled={!canEdit}
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Date of Birth">
          <input
            disabled={!canEdit}
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Gender">
          <select
            disabled={!canEdit}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Marital Status">
          <select
            disabled={!canEdit}
            value={form.marital_status}
            onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
          </select>
        </Field>
        <Field label="Blood Group">
          <input
            disabled={!canEdit}
            value={form.blood_group}
            onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            placeholder="O+, A-, etc."
            className={inputCls}
          />
        </Field>
        <Field label="Nationality">
          <input
            disabled={!canEdit}
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Employee Status">
          <select
            disabled={!canEdit}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className={inputCls}
          >
            <option value="ACTIVE">Active</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </Field>
        <Field label="Date of Joining">
          <input
            disabled={!canEdit}
            type="date"
            required
            value={form.date_of_joining}
            onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Employee photo upload is available from the Documents panel in the header (as a "Photo"
        document) in this version.
      </p>
      {canEdit && <SaveBar onSave={handleSave} saving={saving} message={message} />}
    </div>
  );
}

// ===================== Work Information =====================

function WorkInfoSection({
  employee,
  meta: initialMeta,
  allEmployees,
  canEdit,
  onSaved
}: {
  employee: EmployeeProfile["employee"];
  meta: MetaData;
  allEmployees: Employee[];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [meta, setMeta] = useState(initialMeta);
  const [adding, setAdding] = useState<"department" | "designation" | "branch" | "shift" | null>(
    null
  );
  const [form, setForm] = useState({
    date_of_joining: employee.date_of_joining,
    date_of_confirmation: employee.date_of_confirmation ?? "",
    employment_type: employee.employment_type ?? "",
    department_id: employee.department_id ?? "",
    designation_id: employee.designation_id ?? "",
    reporting_manager_id: employee.reporting_manager_id ?? "",
    branch_id: employee.branch_id ?? "",
    work_location: employee.work_location ?? "",
    grade: employee.grade ?? "",
    shift_id: employee.shift_id ?? "",
    probation_end_date: employee.probation_end_date ?? "",
    notice_period_days: employee.notice_period_days ?? "",
    cost_center: employee.cost_center ?? "",
    employee_category: employee.employee_category ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toNullableId(v: string | number) {
    return v === "" ? null : Number(v);
  }

  function handleMasterCreated(value: { id: number; label: string }) {
    if (adding === "department") {
      setMeta({ ...meta, departments: [...meta.departments, { id: value.id, name: value.label }] });
      setForm({ ...form, department_id: value.id });
    } else if (adding === "designation") {
      setMeta({
        ...meta,
        designations: [...meta.designations, { id: value.id, title: value.label }]
      });
      setForm({ ...form, designation_id: value.id });
    } else if (adding === "branch") {
      setMeta({ ...meta, branches: [...meta.branches, { id: value.id, name: value.label }] });
      setForm({ ...form, branch_id: value.id });
    } else if (adding === "shift") {
      setMeta({ ...meta, shifts: [...meta.shifts, { id: value.id, name: value.label }] });
      setForm({ ...form, shift_id: value.id });
    }
    setAdding(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/employees/${employee.id}`, {
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        status: employee.status,
        date_of_joining: form.date_of_joining,
        date_of_confirmation: form.date_of_confirmation || null,
        employment_type: form.employment_type || null,
        department_id: toNullableId(form.department_id),
        designation_id: toNullableId(form.designation_id),
        reporting_manager_id: toNullableId(form.reporting_manager_id),
        branch_id: toNullableId(form.branch_id),
        work_location: form.work_location || null,
        grade: form.grade || null,
        shift_id: toNullableId(form.shift_id),
        probation_end_date: form.probation_end_date || null,
        notice_period_days: form.notice_period_days === "" ? null : Number(form.notice_period_days),
        cost_center: form.cost_center || null,
        employee_category: form.employee_category || null
      });
      setMessage("Saved.");
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Work Information</h3>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Date of Joining">
          <input
            disabled={!canEdit}
            type="date"
            value={form.date_of_joining}
            onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Date of Confirmation">
          <input
            disabled={!canEdit}
            type="date"
            value={form.date_of_confirmation}
            onChange={(e) => setForm({ ...form, date_of_confirmation: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Employment Type">
          <select
            disabled={!canEdit}
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Intern</option>
          </select>
        </Field>
        <FieldWithAction
          label="Department"
          canEdit={canEdit}
          onAdd={() => setAdding("department")}
        >
          <select
            disabled={!canEdit}
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {meta.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FieldWithAction>
        <FieldWithAction
          label="Designation"
          canEdit={canEdit}
          onAdd={() => setAdding("designation")}
        >
          <select
            disabled={!canEdit}
            value={form.designation_id}
            onChange={(e) => setForm({ ...form, designation_id: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {meta.designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </FieldWithAction>
        <Field label="Reporting Manager">
          <select
            disabled={!canEdit}
            value={form.reporting_manager_id}
            onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {allEmployees
              .filter((e) => e.id !== employee.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
          </select>
        </Field>
        <FieldWithAction label="Branch / Location" canEdit={canEdit} onAdd={() => setAdding("branch")}>
          <select
            disabled={!canEdit}
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {meta.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </FieldWithAction>
        <Field label="Work Location">
          <input
            disabled={!canEdit}
            value={form.work_location}
            onChange={(e) => setForm({ ...form, work_location: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Grade">
          <input
            disabled={!canEdit}
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className={inputCls}
          />
        </Field>
        <FieldWithAction label="Shift" canEdit={canEdit} onAdd={() => setAdding("shift")}>
          <select
            disabled={!canEdit}
            value={form.shift_id}
            onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {meta.shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FieldWithAction>
        <Field label="Probation End Date">
          <input
            disabled={!canEdit}
            type="date"
            value={form.probation_end_date}
            onChange={(e) => setForm({ ...form, probation_end_date: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Notice Period (days)">
          <input
            disabled={!canEdit}
            type="number"
            min={0}
            value={form.notice_period_days}
            onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Cost Center">
          <input
            disabled={!canEdit}
            value={form.cost_center}
            onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Employee Category">
          <input
            disabled={!canEdit}
            value={form.employee_category}
            onChange={(e) => setForm({ ...form, employee_category: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
      {canEdit && <SaveBar onSave={handleSave} saving={saving} message={message} />}
      {adding && (
        <AddMasterValueModal
          type={adding}
          onClose={() => setAdding(null)}
          onCreated={handleMasterCreated}
        />
      )}
    </div>
  );
}

// ===================== Personal Details =====================

function PersonalSection({
  employeeId,
  data,
  canEdit,
  onSaved
}: {
  employeeId: number;
  data: PersonalDetails | null;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const empty: PersonalDetails = {
    father_name: "", mother_name: "", spouse_name: "", religion: "",
    personal_email: "", personal_mobile: "", alternate_mobile: "",
    current_address: "", permanent_address: "", same_as_permanent: 0,
    city: "", state: "", country: "India", pin_code: ""
  };
  const [form, setForm] = useState<PersonalDetails>(data ?? empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(data ?? empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function handleSameAsPermanent(checked: boolean) {
    setForm({
      ...form,
      same_as_permanent: checked ? 1 : 0,
      current_address: checked ? form.permanent_address : form.current_address
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/employees/${employeeId}/personal`, form);
      setMessage("Saved.");
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Personal Details</h3>
      <p className="text-xs text-slate-400 mb-4">
        Date of birth, gender, marital status, blood group and nationality are edited in Basic
        Information - this tab covers family, contact, and address details.
      </p>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Field label="Father's Name">
          <input disabled={!canEdit} value={form.father_name ?? ""} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Mother's Name">
          <input disabled={!canEdit} value={form.mother_name ?? ""} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Spouse Name">
          <input disabled={!canEdit} value={form.spouse_name ?? ""} onChange={(e) => setForm({ ...form, spouse_name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Religion">
          <input disabled={!canEdit} value={form.religion ?? ""} onChange={(e) => setForm({ ...form, religion: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Personal Email">
          <input disabled={!canEdit} type="email" value={form.personal_email ?? ""} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Personal Mobile">
          <input disabled={!canEdit} value={form.personal_mobile ?? ""} onChange={(e) => setForm({ ...form, personal_mobile: e.target.value })} className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <Field label="Permanent Address">
          <textarea disabled={!canEdit} rows={2} value={form.permanent_address ?? ""} onChange={(e) => setForm({ ...form, permanent_address: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Current Address">
          <textarea disabled={!canEdit || !!form.same_as_permanent} rows={2} value={form.current_address ?? ""} onChange={(e) => setForm({ ...form, current_address: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        <input
          disabled={!canEdit}
          type="checkbox"
          checked={!!form.same_as_permanent}
          onChange={(e) => handleSameAsPermanent(e.target.checked)}
        />
        Same as Permanent Address
      </label>

      <div className="grid grid-cols-4 gap-4">
        <Field label="City">
          <input disabled={!canEdit} value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
        </Field>
        <Field label="State">
          <input disabled={!canEdit} value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Country">
          <input disabled={!canEdit} value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
        </Field>
        <Field label="PIN Code">
          <input disabled={!canEdit} value={form.pin_code ?? ""} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} className={inputCls} />
        </Field>
      </div>
      {canEdit && <SaveBar onSave={handleSave} saving={saving} message={message} />}
    </div>
  );
}

// ===================== Identity Information =====================

function IdentitySection({
  employeeId,
  data,
  isAdmin,
  canEdit,
  onSaved
}: {
  employeeId: number;
  data: Identity | null;
  isAdmin: boolean;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const empty: Identity = {
    pan_number: "", aadhaar_number: "", passport_number: "", passport_expiry: "",
    driving_licence_number: "", driving_licence_expiry: "", voter_id: "",
    uan_number: "", pf_number: "", esi_number: ""
  };
  const [form, setForm] = useState<Identity>(data ?? empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(data ?? empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/employees/${employeeId}/identity`, form);
      setMessage("Saved.");
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">Identity Information</h3>
      {!isAdmin && (
        <p className="text-xs text-amber-600 mb-4">
          Identity numbers are masked for your role and shown only in part (e.g. PAN:
          XXXXX1234X). Only Admin accounts can view full values. Re-entering a value below and
          saving will still update it correctly.
        </p>
      )}
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4">
        <Field label="PAN Number">
          <input disabled={!canEdit} value={form.pan_number ?? ""} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Aadhaar Number">
          <input disabled={!canEdit} value={form.aadhaar_number ?? ""} onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Passport Number">
          <input disabled={!canEdit} value={form.passport_number ?? ""} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Passport Expiry">
          <input disabled={!canEdit} type="date" value={form.passport_expiry ?? ""} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Driving Licence Number">
          <input disabled={!canEdit} value={form.driving_licence_number ?? ""} onChange={(e) => setForm({ ...form, driving_licence_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Driving Licence Expiry">
          <input disabled={!canEdit} type="date" value={form.driving_licence_expiry ?? ""} onChange={(e) => setForm({ ...form, driving_licence_expiry: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Voter ID">
          <input disabled={!canEdit} value={form.voter_id ?? ""} onChange={(e) => setForm({ ...form, voter_id: e.target.value })} className={inputCls} />
        </Field>
        <Field label="UAN Number">
          <input disabled={!canEdit} value={form.uan_number ?? ""} onChange={(e) => setForm({ ...form, uan_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="PF Number">
          <input disabled={!canEdit} value={form.pf_number ?? ""} onChange={(e) => setForm({ ...form, pf_number: e.target.value })} className={inputCls} />
        </Field>
        <Field label="ESI Number">
          <input disabled={!canEdit} value={form.esi_number ?? ""} onChange={(e) => setForm({ ...form, esi_number: e.target.value })} className={inputCls} />
        </Field>
      </div>
      {canEdit && <SaveBar onSave={handleSave} saving={saving} message={message} />}
    </div>
  );
}

// ===================== Contact Details =====================

function ContactSection({
  employeeId,
  personal,
  officeContact,
  emergencyContacts,
  canEdit,
  onSaved
}: {
  employeeId: number;
  personal: PersonalDetails | null;
  officeContact: OfficeContact | null;
  emergencyContacts: EmergencyContact[];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [office, setOffice] = useState<OfficeContact>(
    officeContact ?? { official_email: "", extension_number: "", office_mobile: "" }
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    setOffice(officeContact ?? { official_email: "", extension_number: "", office_mobile: "" });
  }, [officeContact]);

  async function handleSaveOffice() {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/employees/${employeeId}/office-contact`, office);
      setMessage("Saved.");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContact(contactId: number) {
    if (!confirm("Delete this emergency contact?")) return;
    await api.delete(`/employees/${employeeId}/emergency-contacts/${contactId}`);
    onSaved();
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Contact Details</h3>

      <div className="mb-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">Personal Contact</div>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
          <div>Mobile: {personal?.personal_mobile || "—"}</div>
          <div>Email: {personal?.personal_email || "—"}</div>
          <div>Alternate: {personal?.alternate_mobile || "—"}</div>
        </div>
        <p className="text-xs text-slate-400 mt-1">Edit these in the Personal Details tab.</p>
      </div>

      <div className="mb-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">Office Contact</div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Official Email">
            <input disabled={!canEdit} type="email" value={office.official_email ?? ""} onChange={(e) => setOffice({ ...office, official_email: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Extension Number">
            <input disabled={!canEdit} value={office.extension_number ?? ""} onChange={(e) => setOffice({ ...office, extension_number: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Office Mobile">
            <input disabled={!canEdit} value={office.office_mobile ?? ""} onChange={(e) => setOffice({ ...office, office_mobile: e.target.value })} className={inputCls} />
          </Field>
        </div>
        {canEdit && <SaveBar onSave={handleSaveOffice} saving={saving} message={message} />}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-700">Emergency Contacts</div>
          {canEdit && (
            <button
              onClick={() => {
                setEditingContact(null);
                setShowContactForm(true);
              }}
              className="text-sm text-brand-600 hover:text-brand-800 font-medium"
            >
              + Add Contact
            </button>
          )}
        </div>
        <div className="bg-surface-muted rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Relationship</th>
                <th className="text-left px-3 py-2">Mobile</th>
                {canEdit && <th className="text-right px-3 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {emergencyContacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                    No emergency contacts added.
                  </td>
                </tr>
              )}
              {emergencyContacts.map((c) => (
                <tr key={c.id} className="border-t border-white">
                  <td className="px-3 py-2 text-slate-900">{c.contact_name}</td>
                  <td className="px-3 py-2 text-slate-600">{c.relationship || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{c.mobile_number || "—"}</td>
                  {canEdit && (
                    <td className="px-3 py-2 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditingContact(c);
                          setShowContactForm(true);
                        }}
                        className="text-brand-600 hover:text-brand-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showContactForm && (
        <EmergencyContactModal
          employeeId={employeeId}
          contact={editingContact}
          onClose={() => setShowContactForm(false)}
          onSaved={() => {
            setShowContactForm(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}

function EmergencyContactModal({
  employeeId,
  contact,
  onClose,
  onSaved
}: {
  employeeId: number;
  contact: EmergencyContact | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    contact_name: contact?.contact_name ?? "",
    relationship: contact?.relationship ?? "",
    mobile_number: contact?.mobile_number ?? "",
    alternate_number: contact?.alternate_number ?? "",
    address: contact?.address ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (contact) {
        await api.put(`/employees/${employeeId}/emergency-contacts/${contact.id}`, form);
      } else {
        await api.post(`/employees/${employeeId}/emergency-contacts`, form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save contact.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {contact ? "Edit" : "Add"} Emergency Contact
        </h3>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name">
            <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Relationship">
            <input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Mobile Number">
            <input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Alternate Number">
            <input value={form.alternate_number} onChange={(e) => setForm({ ...form, alternate_number: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Address">
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== Work Experience =====================

function ExperienceSection({
  employeeId,
  rows,
  canEdit,
  onSaved
}: {
  employeeId: number;
  rows: Experience[];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this experience entry?")) return;
    await api.delete(`/employees/${employeeId}/experience/${id}`);
    onSaved();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Work Experience</h3>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium"
          >
            + Add Experience
          </button>
        )}
      </div>
      <div className="bg-surface-muted rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Company</th>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Duration</th>
              <th className="text-left px-3 py-2">Experience</th>
              {canEdit && <th className="text-right px-3 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                  No previous employment records.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white">
                <td className="px-3 py-2 text-slate-900">{r.previous_company}</td>
                <td className="px-3 py-2 text-slate-600">{r.job_title || "—"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {r.date_joined || "—"} to {r.date_left || "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {r.total_experience_months != null
                    ? `${Math.floor(r.total_experience_months / 12)}y ${r.total_experience_months % 12}m`
                    : "—"}
                </td>
                {canEdit && (
                  <td className="px-3 py-2 text-right space-x-3">
                    <button onClick={() => { setEditing(r); setShowForm(true); }} className="text-brand-600 hover:text-brand-800">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ExperienceModal
          employeeId={employeeId}
          entry={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onSaved(); }}
        />
      )}
    </div>
  );
}

function ExperienceModal({
  employeeId, entry, onClose, onSaved
}: { employeeId: number; entry: Experience | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    previous_company: entry?.previous_company ?? "",
    job_title: entry?.job_title ?? "",
    department: entry?.department ?? "",
    location: entry?.location ?? "",
    date_joined: entry?.date_joined ?? "",
    date_left: entry?.date_left ?? "",
    last_drawn_salary: entry?.last_drawn_salary ?? "",
    reason_for_leaving: entry?.reason_for_leaving ?? "",
    previous_employee_id: entry?.previous_employee_id ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      ...form,
      last_drawn_salary: form.last_drawn_salary === "" ? null : Number(form.last_drawn_salary)
    };
    try {
      if (entry) {
        await api.put(`/employees/${employeeId}/experience/${entry.id}`, payload);
      } else {
        await api.post(`/employees/${employeeId}/experience`, payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {entry ? "Edit" : "Add"} Work Experience
        </h3>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Previous Company">
            <input required value={form.previous_company} onChange={(e) => setForm({ ...form, previous_company: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job Title">
              <input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Department">
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date Joined">
              <input type="date" value={form.date_joined} onChange={(e) => setForm({ ...form, date_joined: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Date Left">
              <input type="date" value={form.date_left} onChange={(e) => setForm({ ...form, date_left: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Last Drawn Salary">
            <input type="number" min={0} value={form.last_drawn_salary} onChange={(e) => setForm({ ...form, last_drawn_salary: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Reason for Leaving">
            <input value={form.reason_for_leaving} onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium">
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== Education Details =====================

function EducationSection({
  employeeId, rows, canEdit, onSaved
}: { employeeId: number; rows: Education[]; canEdit: boolean; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this education entry?")) return;
    await api.delete(`/employees/${employeeId}/education/${id}`);
    onSaved();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Education Details</h3>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-sm text-brand-600 hover:text-brand-800 font-medium">
            + Add Education
          </button>
        )}
      </div>
      <div className="bg-surface-muted rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Qualification</th>
              <th className="text-left px-3 py-2">Institution</th>
              <th className="text-left px-3 py-2">Year</th>
              <th className="text-left px-3 py-2">%/CGPA</th>
              {canEdit && <th className="text-right px-3 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">No education records.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white">
                <td className="px-3 py-2 text-slate-900">{r.qualification}</td>
                <td className="px-3 py-2 text-slate-600">{r.institution || "—"}</td>
                <td className="px-3 py-2 text-slate-600">{r.year_of_passing || "—"}</td>
                <td className="px-3 py-2 text-slate-600">{r.percentage_cgpa ?? "—"}</td>
                {canEdit && (
                  <td className="px-3 py-2 text-right space-x-3">
                    <button onClick={() => { setEditing(r); setShowForm(true); }} className="text-brand-600 hover:text-brand-800">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <EducationModal employeeId={employeeId} entry={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); onSaved(); }} />
      )}
    </div>
  );
}

function EducationModal({
  employeeId, entry, onClose, onSaved
}: { employeeId: number; entry: Education | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    qualification: entry?.qualification ?? "",
    specialization: entry?.specialization ?? "",
    institution: entry?.institution ?? "",
    university_board: entry?.university_board ?? "",
    year_of_passing: entry?.year_of_passing ?? "",
    percentage_cgpa: entry?.percentage_cgpa ?? "",
    mode_of_education: entry?.mode_of_education ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      ...form,
      year_of_passing: form.year_of_passing === "" ? null : Number(form.year_of_passing),
      percentage_cgpa: form.percentage_cgpa === "" ? null : Number(form.percentage_cgpa)
    };
    try {
      if (entry) {
        await api.put(`/employees/${employeeId}/education/${entry.id}`, payload);
      } else {
        await api.post(`/employees/${employeeId}/education`, payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{entry ? "Edit" : "Add"} Education</h3>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Qualification">
            <select required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className={inputCls}>
              <option value="">Select</option>
              <option>10th</option><option>12th</option><option>Diploma</option><option>ITI</option>
              <option>UG</option><option>PG</option><option>Professional Certification</option><option>Other</option>
            </select>
          </Field>
          <Field label="Specialization">
            <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Institution / College">
            <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className={inputCls} />
          </Field>
          <Field label="University / Board">
            <input value={form.university_board} onChange={(e) => setForm({ ...form, university_board: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year of Passing">
              <input type="number" value={form.year_of_passing} onChange={(e) => setForm({ ...form, year_of_passing: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Percentage / CGPA">
              <input type="number" step="0.01" value={form.percentage_cgpa} onChange={(e) => setForm({ ...form, percentage_cgpa: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Mode of Education">
            <select value={form.mode_of_education} onChange={(e) => setForm({ ...form, mode_of_education: e.target.value })} className={inputCls}>
              <option value="">—</option>
              <option>Full-time</option><option>Part-time</option><option>Distance / Correspondence</option>
            </select>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium">
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== Dependent Details =====================

function DependentSection({
  employeeId, rows, canEdit, onSaved
}: { employeeId: number; rows: Dependent[]; canEdit: boolean; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Dependent | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this dependent?")) return;
    await api.delete(`/employees/${employeeId}/dependents/${id}`);
    onSaved();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Dependent Details</h3>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-sm text-brand-600 hover:text-brand-800 font-medium">
            + Add Dependent
          </button>
        )}
      </div>
      <div className="bg-surface-muted rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Relationship</th>
              <th className="text-left px-3 py-2">Nominee</th>
              <th className="text-left px-3 py-2">Insurance</th>
              {canEdit && <th className="text-right px-3 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">No dependents added.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white">
                <td className="px-3 py-2 text-slate-900">{r.dependent_name}</td>
                <td className="px-3 py-2 text-slate-600">{r.relationship || "—"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {r.is_nominee ? `Yes (${r.nominee_percentage ?? 0}%)` : "No"}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.medical_insurance_eligible ? "Yes" : "No"}</td>
                {canEdit && (
                  <td className="px-3 py-2 text-right space-x-3">
                    <button onClick={() => { setEditing(r); setShowForm(true); }} className="text-brand-600 hover:text-brand-800">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <DependentModal employeeId={employeeId} entry={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); onSaved(); }} />
      )}
    </div>
  );
}

function DependentModal({
  employeeId, entry, onClose, onSaved
}: { employeeId: number; entry: Dependent | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    dependent_name: entry?.dependent_name ?? "",
    relationship: entry?.relationship ?? "",
    date_of_birth: entry?.date_of_birth ?? "",
    gender: entry?.gender ?? "",
    occupation: entry?.occupation ?? "",
    mobile_number: entry?.mobile_number ?? "",
    email: entry?.email ?? "",
    address: entry?.address ?? "",
    id_number: entry?.id_number ?? "",
    is_nominee: entry?.is_nominee ?? 0,
    nominee_percentage: entry?.nominee_percentage ?? "",
    medical_insurance_eligible: entry?.medical_insurance_eligible ?? 0,
    remarks: entry?.remarks ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      ...form,
      nominee_percentage: form.nominee_percentage === "" ? null : Number(form.nominee_percentage)
    };
    try {
      if (entry) {
        await api.put(`/employees/${employeeId}/dependents/${entry.id}`, payload);
      } else {
        await api.post(`/employees/${employeeId}/dependents`, payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{entry ? "Edit" : "Add"} Dependent</h3>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Dependent Name">
            <input required value={form.dependent_name} onChange={(e) => setForm({ ...form, dependent_name: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relationship">
              <input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile Number">
              <input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Occupation">
              <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={!!form.is_nominee} onChange={(e) => setForm({ ...form, is_nominee: e.target.checked ? 1 : 0 })} />
              Is Nominee
            </label>
            {!!form.is_nominee && (
              <Field label="Nominee %">
                <input type="number" min={0} max={100} value={form.nominee_percentage} onChange={(e) => setForm({ ...form, nominee_percentage: e.target.value })} className={inputCls} />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={!!form.medical_insurance_eligible} onChange={(e) => setForm({ ...form, medical_insurance_eligible: e.target.checked ? 1 : 0 })} />
              Medical Insurance Eligible
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium">
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== Exit Details =====================

function ExitSection({
  employeeId, data, isActive, canEdit, onSaved
}: { employeeId: number; data: ExitDetails | null; isActive: boolean; canEdit: boolean; onSaved: () => void }) {
  const empty: ExitDetails = {
    exit_type: "", resignation_date: "", last_working_date: "", notice_period_days: null,
    notice_period_served: 0, notice_period_waived: 0, reason_for_leaving: "",
    exit_interview_date: "", exit_interview_remarks: "", company_assets_returned: 0,
    no_due_status: "", fnf_status: "", settlement_date: "", final_settlement_amount: null, remarks: ""
  };
  const [form, setForm] = useState<ExitDetails>(data ?? empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(data ?? empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isActive) {
    return (
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-2">Exit Details</h3>
        <p className="text-sm text-slate-400">
          This section is only available once an employee's status is changed away from Active
          (Resigned/Terminated) in Basic Information.
        </p>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/employees/${employeeId}/exit`, form);
      setMessage("Saved.");
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-4">Exit Details</h3>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Exit Type">
          <select disabled={!canEdit} value={form.exit_type ?? ""} onChange={(e) => setForm({ ...form, exit_type: e.target.value })} className={inputCls}>
            <option value="">—</option>
            <option>Resignation</option><option>Termination</option><option>Retirement</option>
            <option>Absconding</option><option>Contract Expiry</option><option>Death</option><option>Other</option>
          </select>
        </Field>
        <Field label="Resignation Date">
          <input disabled={!canEdit} type="date" value={form.resignation_date ?? ""} onChange={(e) => setForm({ ...form, resignation_date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Last Working Date">
          <input disabled={!canEdit} type="date" value={form.last_working_date ?? ""} onChange={(e) => setForm({ ...form, last_working_date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Notice Period (days)">
          <input disabled={!canEdit} type="number" value={form.notice_period_days ?? ""} onChange={(e) => setForm({ ...form, notice_period_days: e.target.value === "" ? null : Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Exit Interview Date">
          <input disabled={!canEdit} type="date" value={form.exit_interview_date ?? ""} onChange={(e) => setForm({ ...form, exit_interview_date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Settlement Date">
          <input disabled={!canEdit} type="date" value={form.settlement_date ?? ""} onChange={(e) => setForm({ ...form, settlement_date: e.target.value })} className={inputCls} />
        </Field>
        <Field label="No Due Status">
          <select disabled={!canEdit} value={form.no_due_status ?? ""} onChange={(e) => setForm({ ...form, no_due_status: e.target.value })} className={inputCls}>
            <option value="">—</option><option>Pending</option><option>Cleared</option>
          </select>
        </Field>
        <Field label="Full & Final Settlement Status">
          <select disabled={!canEdit} value={form.fnf_status ?? ""} onChange={(e) => setForm({ ...form, fnf_status: e.target.value })} className={inputCls}>
            <option value="">—</option><option>Pending</option><option>Processed</option><option>Paid</option>
          </select>
        </Field>
        <Field label="Final Settlement Amount">
          <input disabled={!canEdit} type="number" value={form.final_settlement_amount ?? ""} onChange={(e) => setForm({ ...form, final_settlement_amount: e.target.value === "" ? null : Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>

      <div className="flex items-center gap-6 mt-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input disabled={!canEdit} type="checkbox" checked={!!form.notice_period_served} onChange={(e) => setForm({ ...form, notice_period_served: e.target.checked ? 1 : 0 })} />
          Notice Period Served
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input disabled={!canEdit} type="checkbox" checked={!!form.notice_period_waived} onChange={(e) => setForm({ ...form, notice_period_waived: e.target.checked ? 1 : 0 })} />
          Notice Period Waived
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input disabled={!canEdit} type="checkbox" checked={!!form.company_assets_returned} onChange={(e) => setForm({ ...form, company_assets_returned: e.target.checked ? 1 : 0 })} />
          Company Assets Returned
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <Field label="Reason for Leaving">
          <textarea disabled={!canEdit} rows={2} value={form.reason_for_leaving ?? ""} onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Exit Interview Remarks">
          <textarea disabled={!canEdit} rows={2} value={form.exit_interview_remarks ?? ""} onChange={(e) => setForm({ ...form, exit_interview_remarks: e.target.value })} className={inputCls} />
        </Field>
      </div>

      {canEdit && <SaveBar onSave={handleSave} saving={saving} message={message} />}
    </div>
  );
}

// ===================== Documents modal (header action) =====================

function DocumentsModal({
  employeeId, canEdit, onClose, onChanged
}: { employeeId: number; canEdit: boolean; onClose: () => void; onChanged: () => void }) {
  const [documents, setDocuments] = useState<EmployeeProfile["documents"]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("Identity Documents");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DOC_TYPES = [
    "Identity Documents", "Education Documents", "Experience Documents", "Appointment Letter",
    "Payslips", "Leave Documents", "On Duty Documents", "Exit Documents", "Other"
  ];

  function load() {
    setLoading(true);
    api.get(`/employees/${employeeId}/documents`).then((res) => setDocuments(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, [employeeId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);
    try {
      await api.post(`/employees/${employeeId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      load();
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDownload(docId: number, name: string) {
    const res = await api.get(`/employees/${employeeId}/documents/${docId}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(docId: number) {
    if (!confirm("Delete this document?")) return;
    await api.delete(`/employees/${employeeId}/documents/${docId}`);
    load();
    onChanged();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        {canEdit && (
          <div className="flex items-center gap-3 mb-4">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={inputCls} style={{ width: "auto", flex: 1 }}>
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <label className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium cursor-pointer whitespace-nowrap">
              {uploading ? "Uploading…" : "Upload File"}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && documents.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-6">No documents uploaded yet.</div>
        )}
        {!loading && documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-surface-muted rounded-lg px-3 py-2 text-sm">
                <div>
                  <div className="text-slate-900 font-medium">{d.document_name}</div>
                  <div className="text-xs text-slate-500">{d.document_type} · {new Date(d.uploaded_at).toLocaleDateString()}</div>
                </div>
                <div className="space-x-3">
                  <button onClick={() => handleDownload(d.id, d.document_name)} className="text-brand-600 hover:text-brand-800">Download</button>
                  {canEdit && <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800">Delete</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
