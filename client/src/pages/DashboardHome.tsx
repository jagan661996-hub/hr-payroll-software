import { useEffect, useState } from "react";
import { api } from "../services/api";

const PLACEHOLDER_CARDS = [
  { label: "Present Today", value: "--" },
  { label: "On Leave", value: "--" },
  { label: "Late Coming", value: "--" },
  { label: "Pending Approvals", value: "--" }
];

export default function DashboardHome() {
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    api
      .get("/employees/summary")
      .then((res) => {
        setEmployeeCount(res.data.totalEmployees);
        setDbStatus("connected");
      })
      .catch(() => setDbStatus("error"));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h2>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {PLACEHOLDER_CARDS.map((c) => (
          <div key={c.label} className="bg-white rounded-xl2 shadow-card p-4">
            <div className="text-2xl font-semibold text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}

        <div className="bg-white rounded-xl2 shadow-card p-4 border border-brand-100">
          <div className="text-2xl font-semibold text-brand-700">
            {dbStatus === "checking" ? "..." : dbStatus === "error" ? "!" : employeeCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Employees in System (live)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-4 text-sm">
        <span className="font-medium text-slate-700">Database status: </span>
        {dbStatus === "checking" && <span className="text-slate-500">Checking connection...</span>}
        {dbStatus === "connected" && (
          <span className="text-emerald-600">
            Connected -- migrations and seed data applied successfully.
          </span>
        )}
        {dbStatus === "error" && (
          <span className="text-red-600">
            Could not reach the backend server. Make sure it started correctly.
          </span>
        )}
      </div>
    </div>
  );
}
