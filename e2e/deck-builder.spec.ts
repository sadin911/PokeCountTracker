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

  test('imports Limitless English decklist text into a new deck with live preview', async ({ page }) => {
    const importBtn = page.locator('button:has-text("นำเข้าเด็ค"), button[title*="นำเข้า"]').first();
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    // Click Import tab
    const importTab = modal.locator('button:has-text("นำเข้าเด็ค (Import)")');
    await importTab.click();

    // Paste Limitless English decklist text
    const sampleLimitlessText = `Pokémon: 10
4 Dreepy TWM 128
4 Drakloak TWM 129
2 Dragapult ex TWM 130
Trainer: 8
4 Buddy-Buddy Poffin TEF 144
4 Ultra Ball PAF 91
Energy: 4
4 Fire Energy MEE 2`;

    const textarea = modal.locator('textarea[placeholder*="ตัวอย่างจาก Limitless"]');
    await textarea.fill(sampleLimitlessText);

    // Verify live preview renders deck title, total count badge, breakdown badges
    await expect(modal.locator('text=Dragapult ex').first()).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=22 / 60 ใบ')).toBeVisible();
    await expect(modal.locator('text=โดราพัลท์ex').first()).toBeVisible();

    // Click submit import button
    const submitBtn = modal.locator('button:has-text("นำเข้าเด็ค \\"Dragapult ex\\"")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify modal closes and new deck appears in Deck Manager list
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Dragapult ex').first()).toBeVisible();
  });

  test('interactively maps an unmatched card via search picker modal and updates deck count', async ({ page }) => {
    const importBtn = page.locator('button:has-text("นำเข้าเด็ค"), button[title*="นำเข้า"]').first();
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    // Click Import tab
    const importTab = modal.locator('button:has-text("นำเข้าเด็ค (Import)")');
    await importTab.click();

    // Text with an unmatched card name
    const deckWithUnmatched = `4 Dreepy TWM 128
2 MysteryTrainerXYZ TEF 999`;

    const textarea = modal.locator('textarea[placeholder*="ตัวอย่างจาก Limitless"]');
    await textarea.fill(deckWithUnmatched);

    // Verify unmatched box appears with Map Card button
    await expect(modal.locator('text=ยังไม่พบการ์ดในระบบ 1 รายการ')).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('span:has-text("MysteryTrainerXYZ")')).toBeVisible();

    const mapBtn = modal.locator('button:has-text("จับคู่การ์ด")').first();
    await expect(mapBtn).toBeVisible();
    await mapBtn.click();

    // CardMappingPickerModal should open
    const pickerModal = page.locator('.fixed.inset-0.z-60');
    await expect(pickerModal).toBeVisible();
    await expect(pickerModal.locator('span:has-text("MysteryTrainerXYZ")')).toBeVisible();

    // Search for a Thai card, e.g. "คำสั่งของบอส"
    const searchInput = pickerModal.locator('input[placeholder*="ค้นหาชื่อการ์ด"]');
    await searchInput.fill('คำสั่งของบอส');
    await page.waitForTimeout(400);

    // Pick the first result
    const selectBtn = pickerModal.locator('button:has-text("เลือก")').first();
    await expect(selectBtn).toBeVisible();
    await selectBtn.click();

    // Picker modal should close, deck preview should now have 6 cards and 0 unmatched cards
    await expect(pickerModal).not.toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=6 / 60 ใบ')).toBeVisible();
    await expect(modal.locator('text=ยังไม่พบการ์ดในระบบ')).not.toBeVisible();
  });
});


