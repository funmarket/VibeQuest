import { defineConfig } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "events.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3002",
    channel: "chrome",
    actionTimeout: 15000,
    navigationTimeout: 90000,
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command: "pnpm db:migrate && pnpm --filter @vq/api start",
      url: "http://127.0.0.1:4102/health/ready",
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        DATABASE_URL: "postgresql://vq_local@127.0.0.1:55439/vq_test",
        PORT: "4102",
        WEB_ORIGINS: "http://127.0.0.1:3002",
        MEDIA_LOCAL_ROOT: path.resolve(".local/events-browser-media"),
        NODE_ENV: "development",
      },
    },
    {
      command: "pnpm --filter @vq/web dev --port 3002",
      url: "http://127.0.0.1:3002/en/home",
      reuseExistingServer: false,
      timeout: 120000,
      env: { API_ORIGIN: "http://127.0.0.1:4102" },
    },
  ],
});
