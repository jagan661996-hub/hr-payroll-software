import { app, BrowserWindow } from "electron";
import path from "path";
import http from "http";
import fs from "fs";

const CLIENT_DIR = path.join(__dirname, "../client/dist");
const STATIC_PORT = 4311;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json"
};

function startStaticServer(): Promise<void> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(CLIENT_DIR, req.url === "/" ? "index.html" : req.url || "");
      if (!fs.existsSync(filePath)) filePath = path.join(CLIENT_DIR, "index.html");
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(STATIC_PORT, "127.0.0.1", () => resolve());
  });
}

function configureServerEnvironment() {
  const dbPath = path.join(app.getPath("userData"), "hrms.db");
  process.env.DB_PATH = dbPath;
  process.env.UPLOADS_DIR = path.join(app.getPath("userData"), "uploads", "employee-documents");
  process.env.EMPLOYEE_PHOTOS_DIR = path.join(app.getPath("userData"), "uploads", "employee-photos");
}

function startBackendServer() {
  require(path.join(__dirname, "../server/dist/index.js"));
}

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
    win.loadURL(`http://localhost:${STATIC_PORT}/index.html`);
  }
}

app.whenReady().then(async () => {
  configureServerEnvironment();
  startBackendServer();

  if (!process.env.VITE_DEV_SERVER_URL) {
    await startStaticServer();
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
