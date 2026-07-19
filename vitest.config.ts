import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // supabase/functions/_shared modules import their runtime deps from esm.sh
      // (required for the Deno edge runtime). Under Vitest/Node, resolve the same
      // package from node_modules instead of hitting the network.
      "https://esm.sh/sanitize-html@2.17.0": "sanitize-html",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "supabase/functions/**/*.test.ts",
    ],
  },
});
