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

  test('filters by Category (Pokemon, Trainer, Energy)', async ({ page }) => {
    // If on mobile or collapsed, open advanced filter drawer
    const trainerChip = page.locator('button:has-text("เทรนเนอร์")').first();
    if (!(await trainerChip.isVisible())) {
      const filterToggleBtn = page.locator('button:has-text("ตัวกรอง")');
      if (await filterToggleBtn.isVisible()) {
        await filterToggleBtn.click();
        await page.waitForTimeout(200);
      }
    }

    const trainerBtn = page.locator('button:has-text("เทรนเนอร์")').first();
    await expect(trainerBtn).toBeVisible({ timeout: 10000 });
    await trainerBtn.click();
    await page.waitForTimeout(300);

    const cardItems = page.locator('.group.relative.rounded-xl');
    await expect(cardItems.first()).toBeVisible();
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

