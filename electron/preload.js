"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// No privileged APIs exposed yet. Later phases add things like
// contextBridge.exposeInMainWorld('app', { getVersion, printPayslip })
// as native-only features (printing, file dialogs) are needed.
electron_1.contextBridge.exposeInMainWorld("appInfo", {
    platform: process.platform
});
