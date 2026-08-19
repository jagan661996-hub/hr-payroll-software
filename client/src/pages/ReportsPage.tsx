import { useEffect, useState } from "react";
import { api } from "../services/api";

interface PfRow {
  employeeCode: string;
  employeeName: string;
  basic: number;
  epfEmployee: number;
}
interface EsiRow {
  employeeCode: string;
  employeeName: string;
  grossEarnings: number;
  esiEmployee: number;
}
interface SalaryRow {
  employeeCode: string;
  employeeName: string;
  paidDays: number;
  lopDays: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
}

function formatMoney(n: number) {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Tab = "salary" | "pf" | "esi";

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>("salary");

  const [salaryRows, setSalaryRows] = useState<SalaryRow[]>([]);
  const [pfRows, setPfRows] = useState<PfRow[]>([]);
  const [esiRows, setEsiRows] = useState<EsiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [salaryRes, pfRes, esiRes] = await Promise.all([
        api.get("/reports/salary-register", { params: { year, month } }),
        api.get("/reports/pf", { params: { year, month } }),
        api.get("/reports/esi", { params: { year, month } })
      ]);
      setSalaryRows(salaryRes.data);
      setPfRows(pfRes.data);
      setEsiRows(esiRes.data);
    } catch {
      setLoadError("Could not load reports. Only Admin/HR can view this page.");
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

  async function handleExportExcel() {
    const res = await api.get("/reports/salary-register/export", {
      params: { year, month },
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `SalaryRegister_${year}-${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
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
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
          >
            Export Salary Register (Excel)
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 border-b border-slate-200">
        {(["salary", "pf", "esi"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"
            }`}
          >
            {t === "salary" ? "Salary Register" : t.toUpperCase()}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {loadError}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && tab === "salary" && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Paid Days</th>
                <th className="text-left px-4 py-3 font-medium">LOP</th>
                <th className="text-left px-4 py-3 font-medium">Gross</th>
                <th className="text-left px-4 py-3 font-medium">Deductions</th>
                <th className="text-left px-4 py-3 font-medium">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {salaryRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No payslips for this month yet - run payroll first.
                  </td>
                </tr>
              )}
              {salaryRows.map((r) => (
                <tr key={r.employeeCode} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {r.employeeName} <span className="text-slate-400">({r.employeeCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.paidDays}</td>
                  <td className="px-4 py-3 text-slate-600">{r.lopDays}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(r.grossEarnings)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(r.totalDeductions)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatMoney(r.netPay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "pf" && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Basic</th>
                <th className="text-left px-4 py-3 font-medium">EPF (Employee)</th>
              </tr>
            </thead>
            <tbody>
              {pfRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No PF contributions recorded for this month.
                  </td>
                </tr>
              )}
              {pfRows.map((r) => (
                <tr key={r.employeeCode} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {r.employeeName} <span className="text-slate-400">({r.employeeCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(r.basic)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatMoney(r.epfEmployee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "esi" && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Gross Earnings</th>
                <th className="text-left px-4 py-3 font-medium">ESI (Employee)</th>
              </tr>
            </thead>
            <tbody>
              {esiRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No ESI contributions recorded for this month.
                  </td>
                </tr>
              )}
              {esiRows.map((r) => (
                <tr key={r.employeeCode} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {r.employeeName} <span className="text-slate-400">({r.employeeCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatMoney(r.grossEarnings)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatMoney(r.esiEmployee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
