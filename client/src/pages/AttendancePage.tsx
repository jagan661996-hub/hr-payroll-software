import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../services/api";
import { AttendanceMonthResponse, ImportResult } from "../types/attendance";
import { useAuthStore } from "../store/authStore";

const STATUS_STYLES: Record<string, string> = {
  P: "bg-emerald-100 text-emerald-700",
  A: "bg-red-100 text-red-700",
  OD: "bg-blue-100 text-blue-700",
  L: "bg-amber-100 text-amber-700",
  WFH: "bg-purple-100 text-purple-700",
  HD: "bg-orange-100 text-orange-700",
  HALFDAY: "bg-orange-100 text-orange-700",
  WO: "bg-slate-100 text-slate-500",
  HL: "bg-sky-100 text-sky-700"
};

const STATUS_OPTIONS = ["P", "A", "OD", "L", "WFH", "HD", "WO", "HL"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function AttendancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const [data, setData] = useState<AttendanceMonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null); // `${employeeId}_${date}`
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "HR";

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get("/attendance", { params: { year, month } });
      setData(res.data);
    } catch {
      setLoadError("Could not load attendance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const recordLookup = useMemo(() => {
    const map = new Map<string, string>();
    data?.records.forEach((r) => map.set(`${r.employee_id}_${r.work_date}`, r.status_code));
    return map;
  }, [data]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
    [year, month]
  );

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  async function handleCellChange(employeeId: number, isoDate: string, statusCode: string) {
    setEditingCell(null);
    try {
      await api.put(`/attendance/${employeeId}/${isoDate}`, { status_code: statusCode });
      loadData();
    } catch {
      setLoadError("Could not save that change.");
    }
  }

  async function handleExport() {
    const res = await api.get("/attendance/export", {
      params: { year, month },
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setLoadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/attendance/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImportResult(res.data);
      loadData();
    } catch (err: any) {
      setLoadError(err.response?.data?.error ?? "Import failed. Check the file format.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Attendance</h2>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="px-2 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50"
            >
              ←
            </button>
            <span className="text-sm font-medium text-slate-700 w-32 text-center">
              {new Date(year, month - 1).toLocaleString("default", {
                month: "long",
                year: "numeric"
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="px-2 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50"
            >
              →
            </button>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium"
          >
            Export (Excel)
          </button>

          {canEdit && (
            <label className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium cursor-pointer">
              {importing ? "Importing…" : "Import from Excel"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
                disabled={importing}
              />
            </label>
          )}
        </div>
      </div>

      {importResult && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          Imported {importResult.daysImported} day-records for {importResult.employeesMatched.length}{" "}
          employee(s).
          {importResult.employeesUnmatched.length > 0 && (
            <div className="mt-1 text-amber-700">
              Could not match: {importResult.employeesUnmatched.join(", ")} — check these names
              match employee records exactly.
            </div>
          )}
        </div>
      )}

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {loadError}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && data && (
        <div className="bg-white rounded-xl2 shadow-card overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="bg-surface-muted text-slate-500 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-surface-muted z-10">
                  Employee
                </th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-3 font-medium text-center w-10">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.employees.length === 0 && (
                <tr>
                  <td colSpan={days.length + 1} className="px-4 py-6 text-center text-slate-400">
                    No employees yet.
                  </td>
                </tr>
              )}
              {data.employees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-900 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                    {emp.full_name}
                  </td>
                  {days.map((d) => {
                    const isoDate = `${year}-${pad(month)}-${pad(d)}`;
                    const cellKey = `${emp.id}_${isoDate}`;
                    const status = recordLookup.get(cellKey);
                    const isEditing = editingCell === cellKey;

                    if (isEditing) {
                      return (
                        <td key={d} className="p-0.5 text-center">
                          <select
                            autoFocus
                            defaultValue={status ?? ""}
                            onBlur={() => setEditingCell(null)}
                            onChange={(e) => handleCellChange(emp.id, isoDate, e.target.value)}
                            className="w-14 text-xs border border-brand-400 rounded"
                          >
                            <option value="">—</option>
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={d}
                        onClick={() => canEdit && setEditingCell(cellKey)}
                        className={`px-1 py-2 text-center ${canEdit ? "cursor-pointer" : ""}`}
                      >
                        {status ? (
                          <span
                            className={`inline-block w-8 rounded text-[11px] font-medium py-0.5 ${
                              STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="text-slate-300">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400">
        P = Present · A = Absent · OD = On Duty · L = Leave · WFH = Work From Home · HD = Half Day
        · WO = Week Off · HL = Holiday
        {canEdit && " — click any cell to edit"}
      </div>
    </div>
  );
}
