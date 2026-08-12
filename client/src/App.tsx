import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import RequireAuth from "./components/RequireAuth";

// Phase 3 scope: real login (RequireAuth actually checks a JWT now,
// not just a static route) plus the app shell from Phase 1. Employee/
// Attendance/Leave/Payroll pages land in their own phases per
// docs/ROADMAP.md.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
