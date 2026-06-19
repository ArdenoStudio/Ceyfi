import { test, expect } from "@playwright/test";

test.describe("CEYFI demo path", () => {
  test("overview loads with health content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Good morning|Good afternoon|Good evening/i)).toBeVisible({
      timeout: 20000,
    });
  });

  test("intelligence page shows health score", async ({ page }) => {
    await page.goto("/intelligence");
    await expect(
      page.getByRole("heading", { name: "Explainable financial health" })
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Health score")).toBeVisible({ timeout: 30000 });
  });

  test("decisions page shows ranked recommendations", async ({ page }) => {
    await page.goto("/decisions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ranked financial recommendations" })
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Potential benefit").first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("scenarios page renders shock controls", async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.getByText("Model financial shocks")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Salary delay")).toBeVisible({ timeout: 20000 });
  });

  test("demo controls page is reachable", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText("Demo Controls")).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: /Trigger wallet spend/i })).toBeVisible({
      timeout: 20000,
    });
  });

  test("login page shows personas when auth enabled", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "CEYFI" })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText("A CEYFI financial intelligence demo")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText("Nimal Fernando")).toBeVisible({ timeout: 20000 });
  });
});
