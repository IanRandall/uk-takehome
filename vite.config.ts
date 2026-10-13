import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/uk-takehome/" : "/",
  test: {
    environment: "node",
  },
});
