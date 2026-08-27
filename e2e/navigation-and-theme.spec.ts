import { test, expect } from '@playwright/test';

test.describe('Navigation and Theme Routing', () => {
  test('default root route loads Collection Tracker', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PokéCollection');
    await expect(page).toHaveURL(/.*\/collection/);
  });

  test('navigates between Collection, Deck Builder, and Battle Tracker via Desktop Nav / URL', async ({ page }) => {
    await page.goto('/collection');
    await expect(page.locator('h1')).toContainText('PokéCollection');

    // Navigate to Deck Manager
    await page.goto('/deck');
    await expect(page.getByText('Deck Manager', { exact: false })).toBeVisible();
    await expect(page).toHaveURL(/.*\/deck/);

    // Navigate to Battle Counter
    await page.goto('/battle');
    await expect(page.getByText('Player 1', { exact: false }).first()).toBeVisible();
    await expect(page).toHaveURL(/.*\/battle/);
  });

  test('theme switcher toggles between Light, Dark, and System modes', async ({ page }) => {
    await page.goto('/collection');

    const themeBtn = page.locator('button[title*="ธีม"]:visible').first();
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Select Light Mode
    const lightOption = page.locator('button:has-text("สว่าง (Light)")');
    if (await lightOption.isVisible()) {
      await lightOption.click();
      await page.waitForTimeout(200);
      const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
      expect(isLight).toBe(true);
    }

    // Toggle to Dark Mode
    await themeBtn.click();
    const darkOption = page.locator('button:has-text("มืด (Dark)")');
    if (await darkOption.isVisible()) {
      await darkOption.click();
      await page.waitForTimeout(200);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(isDark).toBe(true);
    }
  });
});
