import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel auto-detects Vite. The static build output (dist/) is what gets
// served at /. The api/ folder is processed separately as Vercel Functions.
//
// In dev mode (npm run dev), requests to /api/* are proxied to the Vercel
// dev server so the React app can hit the Python functions locally.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
