import { contextBridge } from "electron";

// No privileged APIs exposed yet. Later phases add things like
// contextBridge.exposeInMainWorld('app', { getVersion, printPayslip })
// as native-only features (printing, file dialogs) are needed.
contextBridge.exposeInMainWorld("appInfo", {
  platform: process.platform
});
