import { test, expect } from '@playwright/test';

test.describe('Rooms', () => {
  test('should create a room without authentication', async ({ page }) => {
    await page.goto('/');

    // Click Create Room (no login needed)
    await page.click('button:has-text("Create Room")');

    // Should redirect to room page
    await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);

    // Room page should show room name
    await expect(page.locator('h1').first()).toContainText('Planning Session');
  });

  test('should display share link on room page', async ({ page }) => {
    await page.goto('/');

    // Create room
    await page.click('button:has-text("Create Room")');
    await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);

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

    // Create room
    await page.click('button:has-text("Create Room")');
    await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);

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

    // Create room
    await page.click('button:has-text("Create Room")');
    await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);

    // Get room URL
    const roomUrl = page.url();

    // Open new browser context (different user)
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Visit room via shared link
    await newPage.goto(roomUrl);

    // Should be able to view room
    await expect(newPage.locator('h1').first()).toContainText('Planning Session');
    await expect(newPage.locator('#room-url')).toBeVisible();

    await newContext.close();
  });

  test('should redirect to 404 for non-existent room', async ({ page }) => {
    await page.goto('/room/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL('/404');
  });
});
