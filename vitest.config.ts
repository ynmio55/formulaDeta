import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["__tests__/**/*.test.ts", "src/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
