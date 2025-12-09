import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  css: {
    modules: {
      classNameStrategy: "non-scoped",
    },
  },
});
