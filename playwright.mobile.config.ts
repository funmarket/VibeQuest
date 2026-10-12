import { defineConfig } from "@playwright/test";

const externalUrl = process.env.VQ_MOBILE_TEST_URL;
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "mobile-layout.spec.ts",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: externalUrl ?? "http://127.0.0.1:3000",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: externalUrl
    ? undefined
    : {
        command: "pnpm --filter @vq/web start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
      },
});
