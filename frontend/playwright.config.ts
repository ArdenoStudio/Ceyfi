import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "cd ../backend && python3 -m pip install -q -r requirements.txt && DEMO_AUTH_REQUIRED=false DEMO_SESSION_SECRET=e2e-test-secret python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "NEXT_PUBLIC_SKIP_AUTH=true NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000 npm run dev -- --port 3000",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
