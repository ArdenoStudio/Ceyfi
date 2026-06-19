import { expect, test } from "@playwright/test";

test("persona login uses the backend session and restores it after reload", async ({
  page,
}) => {
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );

  await page.goto("/login");
  await page
    .getByRole("button", {
      name: "Nimal Fernando Diaspora parent · sends money home Diaspora wallet",
      exact: true,
    })
    .click();

  await expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/wallet$/);
  await expect(
    page.getByRole("link", {
      name: "Nimal Fernando Diaspora profile",
    }),
  ).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem("ceyfi_demo_token"));
  expect(token).toMatch(/^[A-Za-z0-9._-]+$/);

  const meResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/me") &&
      response.request().method() === "GET",
  );
  await page.reload();

  await expect((await meResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/wallet$/);
  await expect(
    page.getByRole("link", {
      name: "Nimal Fernando Diaspora profile",
    }),
  ).toBeVisible();
});
