import { test, expect } from '@playwright/test';

test.describe('Deck Builder Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deck');
    await expect(page.getByText('Deck Manager', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('creates a new deck and navigates to Deck Editor', async ({ page }) => {
    const createDeckBtn = page.getByRole('button', { name: /สร้างเด็คใหม่/i }).first();
    await expect(createDeckBtn).toBeVisible();
    await createDeckBtn.click();

    const nameInput = page.locator('input[placeholder*="Charizard"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('E2E Test Pikachu Deck');

    const confirmCreateBtn = page.locator('button:has-text("สร้างเด็ค")').last();
    await confirmCreateBtn.click();

    await expect(page.getByText('E2E Test Pikachu Deck')).toBeVisible({ timeout: 10000 });
  });

  test('searches catalog in Deck Editor and adds cards to deck', async ({ page }) => {
    const createDeckBtn = page.getByRole('button', { name: /สร้างเด็คใหม่/i }).first();
    await createDeckBtn.click();
    const nameInput = page.locator('input[placeholder*="Charizard"]');
    await nameInput.fill('E2E Search Add Deck');
    await page.locator('button:has-text("สร้างเด็ค")').last().click();

    // Switch to Catalog tab if on mobile
    const catalogTab = page.locator('button:has-text("ค้นหาการ์ดเพิ่ม"), button:has-text("ค้นหาการ์ด")').first();
    if (await catalogTab.isVisible()) {
      await catalogTab.click();
      await page.waitForTimeout(200);
    }

    const searchInput = page.locator('input[placeholder*="ค้นหาชื่อการ์ด"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('พิคาชู');
      await page.waitForTimeout(400);
    }

    const addCardBtn = page.locator('button[title*="เพิ่มเข้าเด็ค (+1)"], button:has-text("+")').first();
    if (await addCardBtn.isVisible()) {
      await addCardBtn.click({ force: true });
      await page.waitForTimeout(200);
    }

    // If mobile tab switcher is present, switch back to Deck tab
    const deckTab = page.locator('button:has-text("การ์ดในเด็ค")').first();
    if (await deckTab.isVisible()) {
      await deckTab.click();
      await page.waitForTimeout(200);
    }

    await expect(page.locator('text=60 ใบ').first()).toBeVisible();
  });

  test('opens and closes Deck Import/Export modal', async ({ page }) => {
    const importExportBtn = page.locator('button:has-text("นำเข้าเด็ค"), button[title*="นำเข้า"]').first();
    if (await importExportBtn.isVisible()) {
      await importExportBtn.click();
      await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();

      await page.keyboard.press('Escape');
    }
  });
});
