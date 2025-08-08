import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "**/__tests__/**/*.test.tsx",
      "**/__tests__/**/*.test.ts",
    ],
    css: true,
  },
  resolve: {
    alias: {
      "@": "/Users/raffaelschaefer/Projekte/gc25/src",
    },
  },
});
