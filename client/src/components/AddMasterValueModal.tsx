import { useState } from "react";
import { api } from "../services/api";

type MasterType = "department" | "designation" | "branch" | "shift";

interface Props {
  type: MasterType;
  onClose: () => void;
  onCreated: (value: { id: number; label: string }) => void;
}

const TITLES: Record<MasterType, string> = {
  department: "Add Department",
  designation: "Add Designation",
  branch: "Add Branch",
  shift: "Add Shift"
};

export default function AddMasterValueModal({ type, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("18:30");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let res;
      if (type === "department") {
        res = await api.post("/meta/departments", { name });
        onCreated({ id: res.data.id, label: res.data.name });
      } else if (type === "designation") {
        res = await api.post("/meta/designations", { title: name });
        onCreated({ id: res.data.id, label: res.data.title });
      } else if (type === "branch") {
        res = await api.post("/meta/branches", { name });
        onCreated({ id: res.data.id, label: res.data.name });
      } else {
        res = await api.post("/meta/shifts", { name, start_time: startTime, end_time: endTime });
        onCreated({ id: res.data.id, label: res.data.name });
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not create this.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{TITLES[type]}</h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {type === "designation" ? "Title" : "Name"}
            </label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {type === "shift" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
