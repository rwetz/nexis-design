import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The gallery: every component, every theme, and the app templates, running in
// a plain browser (no Tauri needed). `pnpm dev`, then open the printed URL.
export default defineConfig({
  root: here("./gallery"),
  // Serves assets/cursors at /cursors and assets/brand at /brand — the same
  // paths a consuming app gets from `nexis-design-assets`.
  publicDir: here("./assets"),
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    // Templates import "@nexis/design" exactly as a real app would; here that
    // resolves to the source next door.
    alias: [
      { find: /^@nexis\/design\/(styles|ui|icon|theme|tokens)(.*)$/, replacement: here("./src/") + "$1$2" },
      { find: /^@nexis\/design$/, replacement: here("./src/index.ts") },
    ],
  },
  server: { port: 5199, strictPort: false },
  build: { outDir: here("./dist/gallery"), emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  test: {
    root: here("."),
    environment: "jsdom",
    setupFiles: [here("./test/setup.ts")],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    css: false,
  },
});
