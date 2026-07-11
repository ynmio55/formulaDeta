import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OpenF1 Data Platform/);
});

test('navigation renders correctly', async ({ page }) => {
  await page.goto('/');
  
  // Sidebar should have the logo text
  const logo = page.locator('h1', { hasText: 'OpenF1' });
  await expect(logo).toBeVisible();
  
  // Navigation links should be visible
  await expect(page.locator('a', { hasText: 'Overview' })).toBeVisible();
  await expect(page.locator('a', { hasText: 'Season' })).toBeVisible();
  await expect(page.locator('a', { hasText: 'API Explorer' })).toBeVisible();
});
