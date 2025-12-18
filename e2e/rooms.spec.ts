import { test, expect } from '@playwright/test';

// Helper to create a room via the modal
async function createRoom(page: import('@playwright/test').Page, name: string, isPermanent = false) {
  await page.click('#create-room-btn');
  await expect(page.locator('#create-modal')).toBeVisible();

  await page.fill('#room-name', name);

  if (isPermanent) {
    await page.check('#is-permanent');
  }

  await page.click('#create-modal button[type="submit"]');
  await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);
}

test.describe('Rooms', () => {
  test('should open create room modal', async ({ page }) => {
    await page.goto('/');

    await page.click('#create-room-btn');

    // Modal should be visible
    await expect(page.locator('#create-modal')).toBeVisible();
    await expect(page.locator('#room-name')).toBeVisible();
    await expect(page.locator('#is-permanent')).toBeVisible();
  });

  test('should close create room modal on cancel', async ({ page }) => {
    await page.goto('/');

    await page.click('#create-room-btn');
    await expect(page.locator('#create-modal')).toBeVisible();

    await page.click('#cancel-create-btn');

    await expect(page.locator('#create-modal')).toBeHidden();
  });

  test('should create a room with custom name', async ({ page }) => {
    await page.goto('/');

    await createRoom(page, 'Sprint Planning');

    // Room page should show custom room name
    await expect(page.locator('h1').first()).toContainText('Sprint Planning');
  });

  test('should create a permanent room', async ({ page }) => {
    await page.goto('/');

    await createRoom(page, 'Permanent Room', true);

    // Room should be created
    await expect(page.locator('h1').first()).toContainText('Permanent Room');
  });

  test('should display share link on room page', async ({ page }) => {
    await page.goto('/');

    await createRoom(page, 'Test Room');

    // Should show share link input
    const shareInput = page.locator('#room-url');
    await expect(shareInput).toBeVisible();

    // Share link should contain room URL
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toMatch(/\/room\/[a-f0-9-]+/);
  });

  test('should copy share link to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');

    await createRoom(page, 'Test Room');

    // Get the share URL
    const shareInput = page.locator('#room-url');
    const shareUrl = await shareInput.inputValue();

    // Click copy button
    await page.click('#copy-btn');

    // Icon should change to checkmark
    await expect(page.locator('#check-icon')).toBeVisible();
    await expect(page.locator('#copy-icon')).not.toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(shareUrl);

    // Icons should reset after 2 seconds
    await expect(page.locator('#copy-icon')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#check-icon')).not.toBeVisible();
  });

  test('should allow sharing room link with others', async ({ page, browser }) => {
    await page.goto('/');

    await createRoom(page, 'Shared Room');

    // Get room URL
    const roomUrl = page.url();

    // Open new browser context (different user)
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Visit room via shared link
    await newPage.goto(roomUrl);

    // Should be able to view room
    await expect(newPage.locator('h1').first()).toContainText('Shared Room');
    await expect(newPage.locator('#room-url')).toBeVisible();

    await newContext.close();
  });

  test('should redirect to 404 for non-existent room', async ({ page }) => {
    await page.goto('/room/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL('/404');
  });
});
