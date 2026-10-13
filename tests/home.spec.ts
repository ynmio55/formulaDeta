import { test, expect } from "@playwright/test";

test("has Formula Data title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Formula Data/);
});

test("desktop navigation links work independently of hover expansion", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("nav").first();
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('a[href="/"]')).toBeVisible();
  await expect(sidebar.locator('a[href="/season"]')).toBeVisible();
  await expect(sidebar.locator('a[href="/championship"]')).toBeVisible();
});

test("desktop navigation gives direct access to analysis tools", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.locator("nav").first();
  await expect(sidebar.locator('a[href="/compare"]')).toBeVisible();
  await expect(sidebar.locator('a[href="/track"]')).toBeVisible();
  await expect(sidebar.locator('a[href="/strategy"]')).toBeVisible();

  const pin = sidebar.getByRole("button", { name: "Pin sidebar" });
  await expect(pin).toBeVisible();
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
});
