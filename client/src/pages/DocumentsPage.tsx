import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Employee } from "../types/employee";

const AVAILABLE_DOCS = [
  {
    id: "appointment-letter",
    label: "Appointment Letter",
    description: "Full appointment letter with company terms and salary annexure (.docx)",
    available: true
  },
  {
    id: "confirmation-letter",
    label: "Confirmation Letter",
    description: "Issued after probation is completed",
    available: false
  },
  {
    id: "experience-letter",
    label: "Experience Letter",
    description: "Issued on request or at exit",
    available: false
  },
  {
    id: "relieving-letter",
    label: "Relieving Letter",
    description: "Issued when an employee's exit is processed",
    available: false
  }
];

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/employees")
      .then((res) => setEmployees(res.data))
      .catch(() => setError("Could not load employees."))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate(docId: string) {
    if (!employeeId) {
      setError("Select an employee first.");
      return;
    }
    setError(null);
    setGenerating(docId);
    try {
      const employee = employees.find((e) => String(e.id) === employeeId)!;
      const res = await api.get(`/documents/${docId}/${employeeId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docId}_${employee.employee_code}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not generate this document.");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Documents</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && (
        <div className="bg-white rounded-xl2 shadow-card p-4 mb-6 max-w-md">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Employee
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Choose an employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} ({e.employee_code})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {AVAILABLE_DOCS.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl2 shadow-card p-4">
            <div className="text-sm font-semibold text-slate-900 mb-1">{doc.label}</div>
            <div className="text-xs text-slate-500 mb-3">{doc.description}</div>
            {doc.available ? (
              <button
                onClick={() => handleGenerate(doc.id)}
                disabled={!employeeId || generating === doc.id}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-medium"
              >
                {generating === doc.id ? "Generating…" : "Generate & Download"}
              </button>
            ) : (
              <span className="text-xs text-slate-400">Coming in a later phase</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
