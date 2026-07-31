import axios from "axios";

// The backend runs on a fixed local port started by Electron's main
// process (see electron/main.ts -> startBackendServer). Since the
// desktop app and its API always run on the same machine, a hardcoded
// localhost URL is fine here - no environment-specific config needed.
export const api = axios.create({
  baseURL: "http://localhost:4310/api"
});
