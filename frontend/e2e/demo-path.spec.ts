import { test, expect } from "@playwright/test";

test.describe("CEYFI demo path", () => {
  test("overview loads with health content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Good morning/i)).toBeVisible({ timeout: 15000 });
  });

  test("intelligence page shows health score", async ({ page }) => {
    await page.goto("/intelligence");
    await expect(page.getByText("Explainable financial health")).toBeVisible();
    await expect(page.getByText("Health score")).toBeVisible();
  });

  test("decisions page shows ranked recommendations", async ({ page }) => {
    await page.goto("/decisions");
    await expect(page.getByText("Ranked financial recommendations")).toBeVisible();
    await expect(page.getByText("Total potential benefit")).toBeVisible();
  });

  test("scenarios page renders shock controls", async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.getByText("Model financial shocks")).toBeVisible();
    await expect(page.getByText("Salary delay")).toBeVisible();
  });

  test("demo controls page is reachable", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText("Demo Controls")).toBeVisible();
    await expect(page.getByRole("button", { name: /wallet spend/i })).toBeVisible();
  });

  test("login page shows personas when auth enabled", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("CEYFI")).toBeVisible();
    await expect(page.getByText(/Powered by/i)).toBeVisible();
  });
});
