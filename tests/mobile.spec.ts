import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile navigation exposes analysis tools", async ({ page }) => {
  await page.goto("/");
  const more = page.getByRole("button", { name: "More Formula Data tools" });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.getByRole("dialog", { name: "More tools" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Telemetry" })).toBeVisible();
  await more.click();
  await expect(page.getByRole("dialog", { name: "More tools" })).toHaveCount(0);
});
