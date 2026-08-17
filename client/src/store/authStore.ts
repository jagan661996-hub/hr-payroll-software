import { create } from "zustand";

export interface AuthUser {
  id: number;
  email: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = "hr_payroll_auth";

function loadPersisted(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const persisted = loadPersisted();

export const useAuthStore = create<AuthState>((set) => ({
  token: persisted?.token ?? null,
  user: persisted?.user ?? null,
  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null });
  }
}));
