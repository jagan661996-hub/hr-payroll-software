import { useEffect, useState } from "react";
import { api } from "../services/api";
import { SalaryStructure } from "../types/payroll";
import { Employee } from "../types/employee";

interface Props {
  employee: Employee;
  onClose: () => void;
  onSaved: () => void;
}

type EditableFields = Omit<SalaryStructure, "id" | "employee_id">;

const FIELDS: { key: keyof EditableFields; label: string; group: "earning" | "deduction" }[] = [
  { key: "basic", label: "Basic", group: "earning" },
  { key: "dearness_allowance", label: "Dearness Allowance", group: "earning" },
  { key: "hra", label: "House Rent Allowance", group: "earning" },
  { key: "fixed_allowance", label: "Fixed Allowance", group: "earning" },
  { key: "conveyance", label: "Conveyance", group: "earning" },
  { key: "medical_allowance", label: "Medical Allowance", group: "earning" },
  { key: "other_allowance", label: "Other Allowances", group: "earning" },
  { key: "professional_tax", label: "Professional Tax", group: "deduction" },
  { key: "epf_employee", label: "EPF", group: "deduction" },
  { key: "esi_employee", label: "ESI", group: "deduction" },
  { key: "income_tax", label: "Income Tax", group: "deduction" },
  { key: "loan_deduction", label: "Loan", group: "deduction" },
  { key: "advance_deduction", label: "Advance", group: "deduction" }
];

const emptyForm = {
  effective_from: new Date().toISOString().slice(0, 10),
  basic: 0,
  dearness_allowance: 0,
  hra: 0,
  fixed_allowance: 0,
  conveyance: 0,
  medical_allowance: 0,
  other_allowance: 0,
  professional_tax: 0,
  epf_employee: 0,
  esi_employee: 0,
  income_tax: 0,
  loan_deduction: 0,
  advance_deduction: 0
};

export default function SalaryStructureModal({ employee, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/payroll/structure/${employee.id}`)
      .then((res) => {
        if (res.data) {
          setForm({ ...emptyForm, ...res.data });
        }
      })
      .finally(() => setLoading(false));
  }, [employee.id]);

  function updateField(key: keyof typeof emptyForm, value: string) {
    if (key === "effective_from") {
      setForm({ ...form, effective_from: value });
    } else {
      setForm({ ...form, [key]: Number(value) || 0 });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.put(`/payroll/structure/${employee.id}`, form);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save salary structure.");
    } finally {
      setSubmitting(false);
    }
  }

  const earningFields = FIELDS.filter((f) => f.group === "earning");
  const deductionFields = FIELDS.filter((f) => f.group === "deduction");

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Salary Structure</h3>
        <p className="text-sm text-slate-500 mb-4">
          {employee.full_name} ({employee.employee_code})
        </p>

        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Effective From
              </label>
              <input
                type="date"
                required
                value={form.effective_from}
                onChange={(e) => updateField("effective_from", e.target.value)}
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Earnings</h4>
              <div className="grid grid-cols-2 gap-3">
                {earningFields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form[f.key]}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Deductions</h4>
              <div className="grid grid-cols-2 gap-3">
                {deductionFields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form[f.key]}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>

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
        )}
      </div>
    </div>
  );
}
