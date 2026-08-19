import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import LeavePage from "./pages/LeavePage";
import PayrollPage from "./pages/PayrollPage";
import OnDutyPage from "./pages/OnDutyPage";
import ReportsPage from "./pages/ReportsPage";
import RequireAuth from "./components/RequireAuth";

// Phase 8 adds a real Reports page and wires the Dashboard to live
// data. Documents/Settings pages land in their own phases per
// docs/ROADMAP.md.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="on-duty" element={<OnDutyPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
