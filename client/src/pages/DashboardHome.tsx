import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

interface DashboardSummary {
  presentToday: number;
  onLeaveToday: number;
  lateToday: number;
  pendingApprovals: number;
  departmentCounts: { department: string; count: number }[];
  attendanceTrend: { month: string; percentPresent: number }[];
  payrollTrend: { month: string; totalNetPay: number }[];
}

const CARD_COLORS = ["#3766ef", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => {
        setSummary(res.data);
        setStatus("connected");
      })
      .catch(() => setStatus("error"));
  }, []);

  const cards = summary
    ? [
        { label: "Present Today", value: summary.presentToday },
        { label: "On Leave", value: summary.onLeaveToday },
        { label: "Late Coming", value: summary.lateToday },
        { label: "Pending Approvals", value: summary.pendingApprovals }
      ]
    : [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {status === "checking" &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl2 shadow-card p-4">
              <div className="text-2xl font-semibold text-slate-300">…</div>
              <div className="text-xs text-slate-400 mt-1">Loading</div>
            </div>
          ))}
        {status === "connected" &&
          cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl2 shadow-card p-4">
              <div className="text-2xl font-semibold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 mt-1">{c.label}</div>
            </div>
          ))}
        {status === "error" && (
          <div className="col-span-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl2 p-4">
            Could not reach the backend server.
          </div>
        )}
      </div>

      {status === "connected" && summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl2 shadow-card p-4">
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Employees by Department
            </div>
            {summary.departmentCounts.length === 0 ? (
              <div className="text-sm text-slate-400">No employees yet.</div>
            ) : (
              <Doughnut
                data={{
                  labels: summary.departmentCounts.map((d) => d.department),
                  datasets: [
                    {
                      data: summary.departmentCounts.map((d) => d.count),
                      backgroundColor: CARD_COLORS.concat([
                        "#10b981",
                        "#0ea5e9",
                        "#ec4899",
                        "#64748b"
                      ])
                    }
                  ]
                }}
                options={{ plugins: { legend: { position: "right", labels: { boxWidth: 12 } } } }}
              />
            )}
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-4">
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Attendance % (last 6 months)
            </div>
            <Bar
              data={{
                labels: summary.attendanceTrend.map((t) => t.month),
                datasets: [
                  {
                    label: "% Present",
                    data: summary.attendanceTrend.map((t) => t.percentPresent),
                    backgroundColor: "#3766ef"
                  }
                ]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
            />
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-4 col-span-2">
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Payroll Expense (last 6 months)
            </div>
            <Line
              data={{
                labels: summary.payrollTrend.map((t) => t.month),
                datasets: [
                  {
                    label: "Net Pay Total (Rs.)",
                    data: summary.payrollTrend.map((t) => t.totalNetPay),
                    borderColor: "#3766ef",
                    backgroundColor: "rgba(55,102,239,0.1)",
                    fill: true,
                    tension: 0.3
                  }
                ]
              }}
              options={{ plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
