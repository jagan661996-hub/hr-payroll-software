import { useEffect, useState } from "react";
import { api } from "../services/api";
import { OnDutyRequest } from "../types/onDuty";
import { Employee } from "../types/employee";
import OnDutyApplyModal from "../components/OnDutyApplyModal";
import { useAuthStore } from "../store/authStore";

const STATUS_STYLES: Record<OnDutyRequest["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700"
};

export default function OnDutyPage() {
  const [requests, setRequests] = useState<OnDutyRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "HR";

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        api.get("/on-duty"),
        api.get("/employees")
      ]);
      setRequests(requestsRes.data);
      setEmployees(employeesRes.data);
    } catch {
      setLoadError("Could not load on duty data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleStatusChange(id: number, status: "APPROVED" | "REJECTED") {
    try {
      await api.put(`/on-duty/${id}/status`, { status });
      loadData();
    } catch (err: any) {
      setLoadError(err.response?.data?.error ?? "Could not update that request.");
    }
  }

  async function handleDownloadPdf(request: OnDutyRequest) {
    const res = await api.get(`/on-duty/${request.id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `OnDuty_${request.employee_code}_${request.from_date}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">On Duty</h2>
        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
        >
          + Apply On Duty
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {loadError}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Purpose</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No on duty requests yet.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">{r.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.from_date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.to_date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.location ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                    {r.purpose ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {canManage && r.status === "PENDING" && (
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
                    <button
                      onClick={() => handleDownloadPdf(r)}
                      className="text-brand-600 hover:text-brand-800 font-medium"
                    >
                      Form PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showApplyModal && (
        <OnDutyApplyModal
          employees={employees}
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
