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

    // The theme control lives in the account menu now, not loose in the top bar
    await page.locator('[data-testid="account-button"]').click();
    const segmented = page.locator('[data-testid="theme-segmented"]');
    await expect(segmented).toBeVisible();

    await segmented.getByRole('button', { name: /สว่าง/ }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await segmented.getByRole('button', { name: /มืด/ }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await segmented.getByRole('button', { name: /อัตโนมัติ/ }).click();
    await expect(segmented.getByRole('button', { name: /อัตโนมัติ/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
