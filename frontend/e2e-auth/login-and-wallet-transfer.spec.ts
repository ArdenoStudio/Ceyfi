import { expect, test } from "@playwright/test";

test("real persona login can call wallet transfer through the frontend proxy", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Nimal Fernando/i }).click();
  await expect(page).toHaveURL(/\/wallet/, { timeout: 15_000 });

  const token = await page.evaluate(() => localStorage.getItem("ceyfi_demo_token"));
  expect(token, "login should store a backend-issued demo token").toBeTruthy();

  const response = await page.request.post("/api/wallet/transfer", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      sender_account_id: "SEY-USR-001",
      recipient_account_id: "SEY-ACC-002",
      amount_lkr: 1000,
      corridor: "GBPLKR",
      allocation_rules: [
        { bucket_id: "school", pct: 40 },
        { bucket_id: "household", pct: 40 },
        { bucket_id: "savings", pct: 20 },
      ],
    },
  });

  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("COMPLETED");
  expect(body.buckets_credited).toHaveLength(3);
});
