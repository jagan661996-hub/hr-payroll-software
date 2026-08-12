import axios from "axios";
import { useAuthStore } from "../store/authStore";

// The backend runs on a fixed local port started by Electron's main
// process (see electron/main.ts -> startBackendServer). Since the
// desktop app and its API always run on the same machine, a hardcoded
// localhost URL is fine here - no environment-specific config needed.
export const api = axios.create({
  baseURL: "http://localhost:4310/api"
});

// Attach the logged-in user's token to every request automatically,
// so individual pages never have to think about auth headers.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server ever says "your token is invalid/expired," clear the
// session so the route guard sends the user back to /login instead of
// them staring at a broken screen with silent failed requests.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
