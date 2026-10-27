import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Payslip, RunPayrollResult } from "../types/payroll";
import { Employee } from "../types/employee";
import SalaryStructureModal from "../components/SalaryStructureModal";
import { useAuthStore } from "../store/authStore";

function formatMoney(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Local calendar date as YYYY-MM-DD. (new Date().toISOString() would give
// the UTC date, which is yesterday's date for part of the day in India.)
function todayLocalIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PayrollPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunPayrollResult | null>(null);
  const [structureEmployee, setStructureEmployee] = useState<Employee | null>(null);
  const [payDate, setPayDate] = useState(todayLocalIso());
  const [payDateMessage, setPayDateMessage] = useState<string | null>(null);
  const [savingPayDate, setSavingPayDate] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "ADMIN" || role === "HR";

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [payslipsRes, employeesRes] = await Promise.all([
        api.get("/payroll/payslips", { params: { year, month } }),
        api.get("/employees")
      ]);
      setPayslips(payslipsRes.data);
      setEmployees(employeesRes.data);
      // Show the pay date already recorded for this month; otherwise
      // fall back to today for a month that hasn't been run yet.
      const existing = (payslipsRes.data as Payslip[]).find((p) => p.pay_date)?.pay_date;
      setPayDate(existing ?? todayLocalIso());
    } catch {
      setLoadError("Could not load payroll data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

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

  async function handleRunPayroll() {
    setRunning(true);
    setRunResult(null);
    setLoadError(null);
    try {
      const res = await api.post("/payroll/run", { year, month, pay_date: payDate });
      setRunResult(res.data);
      loadData();
    } catch (err: any) {
      setLoadError(err.response?.data?.error ?? "Could not run payroll.");
    } finally {
      setRunning(false);
    }
  }

  async function handleUpdatePayDate() {
    setSavingPayDate(true);
    setPayDateMessage(null);
    setLoadError(null);
    try {
      const res = await api.put("/payroll/pay-date", { year, month, pay_date: payDate });
      setPayDateMessage(`Pay date updated on ${res.data.updated} payslip(s).`);
      loadData();
    } catch (err: any) {
      setLoadError(err.response?.data?.error ?? "Could not update the pay date.");
    } finally {
      setSavingPayDate(false);
    }
  }

  async function handleDownloadPdf(payslip: Payslip) {
    const res = await api.get(`/payroll/payslips/${payslip.id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payslip_${payslip.employee_code}_${payslip.pay_period}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Payroll</h2>

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

          {canManage && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Pay Date</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {payslips.length > 0 && (
                <button
                  onClick={handleUpdatePayDate}
                  disabled={savingPayDate || !payDate}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium"
                >
                  {savingPayDate ? "Saving…" : "Update Pay Date"}
                </button>
              )}
              <button
                onClick={handleRunPayroll}
                disabled={running || !payDate}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
              >
                {running ? "Running…" : "Run Payroll"}
              </button>
            </div>
          )}
        </div>
      </div>

      {payDateMessage && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          {payDateMessage}
        </div>
      )}

      {runResult && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          Processed {runResult.processed.length} payslip(s) for {runResult.payPeriod}.
          {runResult.skipped.length > 0 && (
            <div className="mt-1 text-amber-700">
              Skipped (no salary structure configured): {runResult.skipped.join(", ")}
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

      {!loading && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Paid Days</th>
                <th className="text-left px-4 py-3 font-medium">LOP</th>
                <th className="text-left px-4 py-3 font-medium">Gross</th>
                <th className="text-left px-4 py-3 font-medium">Deductions</th>
                <th className="text-left px-4 py-3 font-medium">Net Pay</th>
                <th className="text-right px-4 py-3 font-medium">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No payslips generated for this month yet.
                    {canManage && ' Click "Run Payroll" above.'}
                  </td>
                </tr>
              )}
              {payslips.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {p.employee_name}{" "}
                    <span className="text-slate-400 font-normal">({p.employee_code})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.paid_days}</td>
                  <td className="px-4 py-3 text-slate-600">{p.lop_days}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(p.gross_earnings)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(p.total_deductions)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatMoney(p.net_pay)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownloadPdf(p)}
                      className="text-brand-600 hover:text-brand-800 font-medium"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
            Salary Structures
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {e.full_name}{" "}
                    <span className="text-slate-400 font-normal">({e.employee_code})</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setStructureEmployee(e)}
                      className="text-brand-600 hover:text-brand-800 font-medium"
                    >
                      Edit Salary Structure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {structureEmployee && (
        <SalaryStructureModal
          employee={structureEmployee}
          onClose={() => setStructureEmployee(null)}
          onSaved={() => setStructureEmployee(null)}
        />
      )}
    </div>
  );
}
