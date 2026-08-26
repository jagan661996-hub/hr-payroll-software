import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Employee, MetaData } from "../types/employee";
import EmployeeFormModal from "../components/EmployeeFormModal";
import { useAuthStore } from "../store/authStore";

const STATUS_STYLES: Record<Employee["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  RESIGNED: "bg-amber-50 text-amber-700",
  TERMINATED: "bg-red-50 text-red-700"
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "HR";

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [employeesRes, metaRes] = await Promise.all([
        api.get("/employees"),
        api.get("/meta")
      ]);
      setEmployees(employeesRes.data);
      setMeta(metaRes.data);
    } catch {
      setLoadError("Could not load employee data. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAddModal() {
    setEditingEmployee(null);
    setShowModal(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setShowModal(true);
  }

  function handleSaved() {
    setShowModal(false);
    loadData();
  }

  async function handleExport() {
    const res = await api.get("/employees/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employees_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
              Export (Excel)
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
            >
              + Add Employee
            </button>
          </div>
        )}
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {loadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Designation</th>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Branch</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    No employees yet.
                  </td>
                </tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{emp.employee_code}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/employees/${emp.id}`} className="text-brand-600 hover:text-brand-800">
                      {emp.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.designation_title ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.department_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.branch_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.date_of_joining}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[emp.status]}`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link to={`/employees/${emp.id}`} className="text-brand-600 hover:text-brand-800 font-medium">
                      View Profile
                    </Link>
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(emp)}
                        className="text-slate-600 hover:text-slate-800 font-medium"
                      >
                        Quick Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && meta && (
        <EmployeeFormModal
          meta={meta}
          employee={editingEmployee}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
