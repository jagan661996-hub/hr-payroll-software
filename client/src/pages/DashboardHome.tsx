const CARDS = [
  { label: "Present Today", value: "--" },
  { label: "On Leave", value: "--" },
  { label: "Late Coming", value: "--" },
  { label: "Pending Approvals", value: "--" }
];

// Static placeholder cards. Real numbers (today's attendance, leave
// requests, payroll status, charts) get wired up once the Attendance
// and Leave APIs exist (Phase 5 / Phase 6) and again after Payroll
// (Phase 7) for the payroll-status widget.
export default function DashboardHome() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h2>
      <div className="grid grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <div key={c.label} className="bg-white rounded-xl2 shadow-card p-4">
            <div className="text-2xl font-semibold text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
