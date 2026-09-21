import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Tests run in UTC — the zone production servers render in. A laptop in
// Asia/Dhaka hides code that reads the browser's clock where the ORGANIZATION's
// calendar belongs (lib/org-calendar.ts). Set before the worker pool starts so
// every worker inherits it. CLAUDE.md → "Timezones".
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@ui": path.resolve(__dirname, "./ui"),
      "@/services/api": path.resolve(__dirname, "./services/api"),
      "@repo/shared-types": path.resolve(__dirname, "./types/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    env: { TZ: "UTC" },
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    css: false,
  },
});
