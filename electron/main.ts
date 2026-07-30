import { app, BrowserWindow } from "electron";
import path from "path";

// Phase 1: window shell only. Starting the embedded Express server
// as a child process (or in-process import) and pointing DB_PATH at
// app.getPath('userData') happens in Phase 2/3 once auth + DB are in
// place, so the packaged app writes its SQLite file under
// %APPDATA%/HR Payroll Software instead of the install directory.
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "HR Payroll Software",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, "../client/dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
