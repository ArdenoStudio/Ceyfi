import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-auth",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-auth",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "cd ../backend && python3 -m pip install -q -r requirements.txt && DATABASE_URL= DEMO_AUTH_REQUIRED=true DEMO_SESSION_SECRET=e2e-test-secret CORS_ORIGINS=http://localhost:3100 python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8100",
      url: "http://127.0.0.1:8100/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8100 npm run dev -- --port 3100",
      url: "http://localhost:3100/login",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
