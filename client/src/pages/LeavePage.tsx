import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { LeaveType, LeaveRequest, LeaveBalance, LeaveImportResult } from "../types/leave";
import { Employee } from "../types/employee";
import LeaveApplyModal from "../components/LeaveApplyModal";
import { useAuthStore } from "../store/authStore";

const STATUS_STYLES: Record<LeaveRequest["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700"
};

type Tab = "requests" | "balances";

export default function LeavePage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [importResult, setImportResult] = useState<LeaveImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [year] = useState(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "HR";

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [requestsRes, balancesRes, typesRes, employeesRes] = await Promise.all([
        api.get("/leave"),
        api.get("/leave/balances", { params: { year } }),
        api.get("/leave/types"),
        api.get("/employees")
      ]);
      setRequests(requestsRes.data);
      setBalances(balancesRes.data);
      setLeaveTypes(typesRes.data);
      setEmployees(employeesRes.data);
    } catch {
      setLoadError("Could not load leave data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusChange(id: number, status: "APPROVED" | "REJECTED") {
    try {
      await api.put(`/leave/${id}/status`, { status });
      loadData();
    } catch (err: any) {
      setLoadError(err.response?.data?.error ?? "Could not update that request.");
    }
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
      const res = await api.post("/leave/import", formData, {
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

  function typeName(id: number) {
    return leaveTypes.find((lt) => lt.id === id)?.name ?? "—";
  }

  function employeeName(id: number) {
    return employees.find((e) => e.id === id)?.full_name ?? `#${id}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Leave</h2>
        <div className="flex items-center gap-3">
          {canManage && (
            <label className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium cursor-pointer">
              {importing ? "Importing…" : "Import Register"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={handleImportFile}
                disabled={importing}
              />
            </label>
          )}
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
          >
            + Apply Leave
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 border-b border-slate-200">
        <button
          onClick={() => setTab("requests")}
          className={`pb-2 text-sm font-medium border-b-2 ${
            tab === "requests"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500"
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => setTab("balances")}
          className={`pb-2 text-sm font-medium border-b-2 ${
            tab === "balances"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500"
          }`}
        >
          Balances ({year})
        </button>
      </div>

      {importResult && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          Processed sheets: {importResult.sheetsProcessed.join(", ") || "none"}. Updated{" "}
          {importResult.employeesUpdated.length} employee-year record(s).
          {importResult.sheetsSkipped.length > 0 && (
            <div className="mt-1 text-slate-600">
              Skipped: {importResult.sheetsSkipped.join(", ")}
            </div>
          )}
          {importResult.employeesUnmatched.length > 0 && (
            <div className="mt-1 text-amber-700">
              Could not match: {importResult.employeesUnmatched.join(", ")}
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

      {!loading && tab === "requests" && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-left px-4 py-3 font-medium">Days</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                {canManage && <th className="text-right px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No leave requests yet.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">{r.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.leave_type_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.from_date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.to_date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.days}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right space-x-3">
                      {r.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(r.id, "APPROVED")}
                            className="text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, "REJECTED")}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "balances" && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Leave Type</th>
                <th className="text-left px-4 py-3 font-medium">Opening</th>
                <th className="text-left px-4 py-3 font-medium">Accrued</th>
                <th className="text-left px-4 py-3 font-medium">Used</th>
                <th className="text-left px-4 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No balances recorded for {year} yet.
                  </td>
                </tr>
              )}
              {balances.map((b, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {employeeName(b.employee_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{typeName(b.leave_type_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.opening_balance}</td>
                  <td className="px-4 py-3 text-slate-600">{b.accrued}</td>
                  <td className="px-4 py-3 text-slate-600">{b.used}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {b.opening_balance + b.accrued - b.used}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showApplyModal && (
        <LeaveApplyModal
          employees={employees}
          leaveTypes={leaveTypes}
          onClose={() => setShowApplyModal(false)}
          onSaved={() => {
            setShowApplyModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
