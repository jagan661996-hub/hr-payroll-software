import { useEffect, useState } from "react";
import { Employee, MetaData } from "../types/employee";
import { api } from "../services/api";
import AddMasterValueModal from "./AddMasterValueModal";

interface Props {
  meta: MetaData;
  employee: Employee | null; // null = creating a new employee
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  employee_code: "",
  full_name: "",
  designation_id: "" as string | number,
  department_id: "" as string | number,
  branch_id: "" as string | number,
  shift_id: "" as string | number,
  date_of_joining: "",
  status: "ACTIVE" as Employee["status"]
};

type AddingType = "department" | "designation" | "branch" | "shift" | null;

export default function EmployeeFormModal({ meta: initialMeta, employee, onClose, onSaved }: Props) {
  const [meta, setMeta] = useState(initialMeta);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adding, setAdding] = useState<AddingType>(null);

  useEffect(() => {
    if (employee) {
      setForm({
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        designation_id: employee.designation_id ?? "",
        department_id: employee.department_id ?? "",
        branch_id: employee.branch_id ?? "",
        shift_id: employee.shift_id ?? "",
        date_of_joining: employee.date_of_joining,
        status: employee.status
      });
    } else {
      setForm(emptyForm);
    }
  }, [employee]);

  function toNullableId(value: string | number): number | null {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      employee_code: form.employee_code,
      full_name: form.full_name,
      designation_id: toNullableId(form.designation_id),
      department_id: toNullableId(form.department_id),
      branch_id: toNullableId(form.branch_id),
      shift_id: toNullableId(form.shift_id),
      date_of_joining: form.date_of_joining,
      status: form.status
    };

    try {
      if (employee) {
        await api.put(`/employees/${employee.id}`, payload);
      } else {
        await api.post("/employees", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save employee. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {employee ? "Edit Employee" : "Add Employee"}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Employee Code
              </label>
              <input
                required
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="INDF0027"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Joining
              </label>
              <input
                required
                type="date"
                value={form.date_of_joining}
                onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Designation</label>
                <button
                  type="button"
                  onClick={() => setAdding("designation")}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  + New
                </button>
              </div>
              <select
                value={form.designation_id}
                onChange={(e) => setForm({ ...form, designation_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">—</option>
                {meta.designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <button
                  type="button"
                  onClick={() => setAdding("department")}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  + New
                </button>
              </div>
              <select
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">—</option>
                {meta.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Branch</label>
                <button
                  type="button"
                  onClick={() => setAdding("branch")}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  + New
                </button>
              </div>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">—</option>
                {meta.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Shift</label>
                <button
                  type="button"
                  onClick={() => setAdding("shift")}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  + New
                </button>
              </div>
              <select
                value={form.shift_id}
                onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">—</option>
                {meta.shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {employee && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Employee["status"] })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
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
