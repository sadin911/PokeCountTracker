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

  test('opens Collection Text Import modal and imports cards via text', async ({ page }) => {
    // Click visible Import button in header
    const importBtn = page.locator('[data-testid="text-import-button"]');
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify modal appears
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Card Text Import/i }).first();
    await expect(modal).toBeVisible();

    // Fill in text
    const textarea = modal.locator('textarea');
    await textarea.fill('Set SC1a\n1,3\n20,5\n21');
    await page.waitForTimeout(300);

    // Verify live preview displays parsed counts
    await expect(modal).toContainText('9 ใบ');
    await expect(modal).toContainText('3 แบบ');

    // Click Import button
    const submitBtn = modal.locator('button:has-text("นำเข้า 9 ใบ")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success feedback
    await expect(modal.locator('text=นำเข้าสำเร็จ!')).toBeVisible();
  });

  test('imports Pokillionaire JSON format seamlessly', async ({ page }) => {
    const importBtn = page.locator('[data-testid="text-import-button"]');
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Card Text Import/i }).first();
    await expect(modal).toBeVisible();

    const jsonSnippet = JSON.stringify({
      version: '1.0',
      collections: {
        thai: {
          ownedCards: [
            { setId: 'sc1a', cardNumber: '001', cardName: '1 สไตรค์', quantity: 2 },
            { setId: 'sc1a', cardNumber: '020', cardName: '20 เอเลซัน', quantity: 3 },
          ],
        },
      },
    });

    const textarea = modal.locator('textarea');
    await textarea.fill(jsonSnippet);
    await page.waitForTimeout(300);

    await expect(modal).toContainText('5 ใบ');
    await expect(modal).toContainText('2 แบบ');

    const submitBtn = modal.locator('button:has-text("นำเข้า 5 ใบ")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(modal.locator('text=นำเข้าสำเร็จ!')).toBeVisible();
  });

  test('persists draft in Import Modal across modal close and allows clearing form', async ({ page }) => {
    const importBtn = page.locator('[data-testid="text-import-button"]');
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Card Text Import/i }).first();
    await expect(modal).toBeVisible();

    // Fill in draft text
    const textarea = modal.locator('textarea');
    await textarea.fill('SV8a 025 2\nSV8a 026 1');

    // Switch to Excel / CSV tab
    const excelTabBtn = modal.locator('button:has-text("Excel / CSV")');
    await excelTabBtn.click();
    await expect(modal.locator('text=ลากไฟล์ Excel')).toBeVisible();

    // Close modal via close button
    const closeBtn = modal.locator('button[aria-label="Close"]');
    await closeBtn.click();
    await expect(modal).toBeHidden();

    // Reopen modal - verify tab and draft were persisted in localStorage!
    await importBtn.click();
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=ลากไฟล์ Excel')).toBeVisible();

    // Switch back to text tab and verify text is still there
    const textTabBtn = modal.locator('button:has-text("ข้อความ / Text")');
    await textTabBtn.click();
    await expect(textarea).toHaveValue('SV8a 025 2\nSV8a 026 1');

    // Clear draft via "ล้างฟอร์ม"
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const clearDraftBtn = modal.locator('button:has-text("ล้างฟอร์ม")');
    await clearDraftBtn.click();
    await expect(textarea).toHaveValue('');
  });

  test.describe.skip('Camera scanner feature (temporarily disabled per user request)', () => {
    test('opens continuous live camera OCR scanner modal and displays viewfinder & controls', async ({ page }) => {
      const cameraBtn = page.locator('[data-testid="camera-scan-button"]');
      await expect(cameraBtn).toBeVisible();
      await cameraBtn.click();

      // Camera scanner modal appears
      const scannerModal = page.locator('[data-testid="camera-scanner-modal"]');
      await expect(scannerModal).toBeVisible();

      // Verify header and binder selector exist
      await expect(scannerModal.locator('text=สแกนกล้องต่อเนื่อง')).toBeVisible();
      await expect(scannerModal.locator('text=บันทึกลง:')).toBeVisible();

      // Close scanner modal
      const closeScannerBtn = scannerModal.locator('button[aria-label="Close"]').or(scannerModal.locator('button:has-text("✕")')).first();
      await closeScannerBtn.click();
      await expect(scannerModal).toBeHidden();
    });

    test('allows quick manual code input fallback in camera scanner modal', async ({ page }) => {
      const cameraBtn = page.locator('[data-testid="camera-scan-button"]');
      await expect(cameraBtn).toBeVisible();
      await cameraBtn.click();

      const scannerModal = page.locator('[data-testid="camera-scanner-modal"]');
      await expect(scannerModal).toBeVisible();

      // Fill quick code input
      const codeInput = scannerModal.locator('input[placeholder*="SV8a 025"]');
      await expect(codeInput).toBeVisible();
      await codeInput.fill('SV8a 025');

      // Click submit button
      const addBtn = scannerModal.locator('button:has-text("+ เพิ่มทันที")');
      await expect(addBtn).toBeEnabled();
      await addBtn.click();

      // Verify card added into horizontal feed
      await expect(scannerModal.locator('text=รายการที่เพิ่มแล้วในรอบนี้ (1 ใบ)')).toBeVisible();

      // Close modal
      const closeBtn = scannerModal.locator('button:has-text("✕")').first();
      await closeBtn.click();
      await expect(scannerModal).toBeHidden();
    });
  });
});



