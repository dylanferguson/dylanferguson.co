import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4322",
    colorScheme: "light",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm build && node tests/preview.mjs",
    url: "http://127.0.0.1:4322",
  },
});
