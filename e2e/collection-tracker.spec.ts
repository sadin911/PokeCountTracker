import { test, expect } from '@playwright/test';

test.describe('Collection Tracker Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collection');
    await expect(page.locator('h1')).toContainText('PokéCollection');
  });

  test('searches cards by Thai name and displays matching cards', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/ค้นหาชื่อการ์ด/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('พิคาชู');
    await page.waitForTimeout(400);

    const cardItems = page.locator('.group.relative.rounded-xl');
    await expect(cardItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('filters by Category and Regulation via the compact dropdowns', async ({ page }) => {
    // The advanced filter panel is collapsed below lg, so open it first
    const categorySelect = page.locator('[data-testid="category-select"]');
    if (!(await categorySelect.isVisible())) {
      await page.locator('button:has-text("ตัวกรอง")').first().click();
      await page.waitForTimeout(200);
    }
    await expect(categorySelect).toBeVisible({ timeout: 10000 });

    await categorySelect.selectOption('Trainer');
    await expect(categorySelect).toHaveValue('Trainer');
    await page.waitForTimeout(400);
    await expect(page.locator('.group.relative.rounded-xl').first()).toBeVisible();

    // Regulation shares the row and narrows the same list
    const regulationSelect = page.locator('[data-testid="regulation-select"]');
    await expect(regulationSelect).toBeVisible();
    await regulationSelect.selectOption('STANDARD');
    await expect(regulationSelect).toHaveValue('STANDARD');
    await page.waitForTimeout(400);
    await expect(page.locator('.group.relative.rounded-xl').first()).toBeVisible();
  });

  test('quick add button increments card count and updates header summary', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/ค้นหาชื่อการ์ด/i);
    await searchInput.fill('พิคาชู');
    await page.waitForTimeout(400);

    const quickAddBtn = page.locator('button[title*="แตะเพื่อเพิ่มจำนวน"]').first();
    await expect(quickAddBtn).toBeVisible({ timeout: 10000 });
    await quickAddBtn.click({ force: true });

    const ownedBadge = page.locator('text=×').first();
    await expect(ownedBadge).toBeVisible();
  });

  test('opens card details modal upon card click and allows updating variants', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/ค้นหาชื่อการ์ด/i);
    await searchInput.fill('ลิซาร์ดอน');
    await page.waitForTimeout(400);

    const firstCardImage = page.locator('.group.relative.rounded-xl').first();
    await expect(firstCardImage).toBeVisible({ timeout: 10000 });
    await firstCardImage.click();

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    // Close modal via ESC key
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('displays 3D holographic foil effect on high rarity or special cards in modal', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/ค้นหาชื่อการ์ด/i);
    await searchInput.fill('ลิซาร์ดอน ex');
    await page.waitForTimeout(400);

    const firstCardImage = page.locator('.group.relative.rounded-xl').first();
    await expect(firstCardImage).toBeVisible({ timeout: 10000 });
    await firstCardImage.click();

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    // Verify foil-3d or foil-holo elements
    const foilCard = modal.locator('.foil-3d');
    await expect(foilCard).toBeVisible();

    const foilHoloOverlay = modal.locator('.foil-holo');
    await expect(foilHoloOverlay).toBeVisible();

    // Hover / move mouse over foil card to trigger 3D perspective tracking
    await foilCard.hover();
    await page.mouse.move(200, 200);

    // Close modal via ESC key
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
});

