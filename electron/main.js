"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const CLIENT_DIR = path_1.default.join(__dirname, "../client/dist");
const STATIC_PORT = 4311;
const MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".json": "application/json"
};
function startStaticServer() {
    return new Promise((resolve) => {
        const server = http_1.default.createServer((req, res) => {
            let filePath = path_1.default.join(CLIENT_DIR, req.url === "/" ? "index.html" : req.url || "");
            if (!fs_1.default.existsSync(filePath))
                filePath = path_1.default.join(CLIENT_DIR, "index.html");
            const ext = path_1.default.extname(filePath);
            fs_1.default.readFile(filePath, (err, data) => {
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
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 700,
        title: "HR Payroll Software",
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
        win.loadURL(devServerUrl);
    }
    else {
        win.loadURL(`http://localhost:${STATIC_PORT}/index.html`);
    }
}
electron_1.app.whenReady().then(async () => {
    if (!process.env.VITE_DEV_SERVER_URL) {
        await startStaticServer();
    }
    createWindow();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
