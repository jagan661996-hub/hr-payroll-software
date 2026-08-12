import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Electron loads the built client as file:// so base must be relative
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
