import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    // Filtra logs do dotenv para não poluir saída de teste
    onConsoleLog(log) {
      if (log.includes("[dotenv@")) return false;
    },
  },
});
