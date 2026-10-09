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
