import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";

interface CompanySettings {
  company_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  financial_year_start_month: number;
}

interface UserRow {
  id: number;
  email: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  is_active: number;
  created_at: string;
}

interface AuditLogRow {
  id: number;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  created_at: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Tab = "company" | "users" | "backup" | "audit";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>

      <div className="flex gap-4 mb-4 border-b border-slate-200">
        {(
          [
            ["company", "Company"],
            ["users", "Users"],
            ["backup", "Backup & Restore"],
            ["audit", "Audit Log"]
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`pb-2 text-sm font-medium border-b-2 ${
              tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "company" && <CompanyTab />}
      {tab === "users" && <UsersTab />}
      {tab === "backup" && <BackupTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function CompanyTab() {
  const [form, setForm] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get("/settings/company").then((res) => setForm(res.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put("/settings/company", form);
      setForm(res.data);
      setMessage("Saved.");
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-card p-6 max-w-lg space-y-4">
      {message && <div className="text-sm text-emerald-600">{message}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
        <input
          required
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <input
          value={form.address ?? ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input
            value={form.city ?? ""}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <input
            value={form.state ?? ""}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Financial Year Start Month
        </label>
        <select
          value={form.financial_year_start_month}
          onChange={(e) =>
            setForm({ ...form, financial_year_start_month: Number(e.target.value) })
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "HR" | "EMPLOYEE">("HR");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function loadUsers() {
    setLoading(true);
    api
      .get("/settings/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await api.post("/settings/users", { email, password, role });
      setEmail("");
      setPassword("");
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-xl2 shadow-card overflow-hidden h-fit">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl2 shadow-card p-6 space-y-4 h-fit">
        <div className="text-sm font-semibold text-slate-700">Add User</div>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ADMIN">Admin</option>
            <option value="HR">HR</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
        >
          {creating ? "Creating…" : "Create User"}
        </button>
      </form>
    </div>
  );
}

function BackupTab() {
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleBackup() {
    const res = await api.get("/settings/backup", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hrms-backup-${new Date().toISOString().slice(0, 10)}.db`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !confirm(
        "This will REPLACE all current data with the backup file. This cannot be undone. Continue?"
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setRestoring(true);
    setMessage(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/settings/restore", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Restore failed.");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6 max-w-2xl">
      <div className="bg-white rounded-xl2 shadow-card p-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">Download Backup</div>
        <p className="text-xs text-slate-500 mb-4">
          Downloads a complete copy of the database file, including every employee, attendance
          record, payslip, and setting.
        </p>
        <button
          onClick={handleBackup}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
        >
          Download Backup
        </button>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">Restore from Backup</div>
        <p className="text-xs text-slate-500 mb-4">
          Replaces all current data with a previously downloaded backup file. This cannot be
          undone.
        </p>
        {message && <div className="text-sm text-emerald-600 mb-2">{message}</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <label className="inline-block px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium cursor-pointer">
          {restoring ? "Restoring…" : "Choose Backup File"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            className="hidden"
            onChange={handleRestoreFile}
            disabled={restoring}
          />
        </label>
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/settings/audit-logs", { params: { limit: 100 } })
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3 font-medium">When</th>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Action</th>
            <th className="text-left px-4 py-3 font-medium">Entity</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                Loading…
              </td>
            </tr>
          )}
          {!loading && logs.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                No activity recorded yet.
              </td>
            </tr>
          )}
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {new Date(l.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-slate-700">{l.user_email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-900 font-medium">{l.action}</td>
              <td className="px-4 py-3 text-slate-500">
                {l.entity ? `${l.entity}${l.entity_id ? ` #${l.entity_id}` : ""}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
