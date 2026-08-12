import { Outlet } from "react-router-dom";

const NAV_ITEMS = [
  "Dashboard",
  "Employees",
  "Attendance",
  "Leave",
  "On Duty",
  "Payroll",
  "Documents",
  "Reports",
  "Settings"
];

// Sidebar/topbar shell. Only "Dashboard" is wired to a route so far;
// the rest are placeholders that later phases will connect to real
// pages (Employee Module = Phase 4, Attendance = Phase 5, etc.)
export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-surface-muted">
      <aside className="w-60 shrink-0 bg-surface-dark text-slate-200 flex flex-col">
        <div className="px-5 py-5 text-white font-semibold text-lg border-b border-slate-700/50">
          HR Payroll
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <div
              key={item}
              className="px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shadow-card">
          <span className="text-sm text-slate-500">Industrial Fans India Private Limited</span>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
