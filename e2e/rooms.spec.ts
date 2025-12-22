import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './helpers/auth';

// Helper to create a room via the modal
async function createRoom(page: import('@playwright/test').Page, name: string, isPermanent = false) {
  await page.click('#create-room-btn');
  await expect(page.locator('#create-modal')).toBeVisible();

  await page.fill('#room-name', name);

  if (isPermanent) {
    // Click the label for the styled checkbox since the input is sr-only
    await page.locator('label[for="is-permanent"]').click();
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

test.describe('Auto-Join for Signed-In Users', () => {
  // Helper to create a verified user
  async function signUpUser(page: import('@playwright/test').Page, emailPrefix: string) {
    return signUpAndVerify(page, emailPrefix);
  }

  test('signed-in user should be auto-joined to room without name prompt', async ({ page, browser }) => {
    // First, create a room with an anonymous user
    await page.goto('/');
    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Auto Join Test Room');
    await page.click('#create-modal button[type="submit"]');
    await page.waitForURL(/\/room\//);

    // Get room URL
    const roomUrl = page.url();

    // Open new browser context for signed-in user
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Sign up new user
    await signUpUser(newPage, 'autojoin');

    // Visit the room
    await newPage.goto(roomUrl);

    // Should NOT see join form (auto-joined)
    await expect(newPage.locator('#join-form')).not.toBeVisible();

    // Should see voting interface directly
    await expect(newPage.locator('#your-vote-section')).toBeVisible();

    await newContext.close();
  });

  test('signed-in user should appear in participants list with email as name', async ({ page, browser }) => {
    // Create a room with an anonymous user
    await page.goto('/');
    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Participant Test Room');
    await page.click('#create-modal button[type="submit"]');
    await page.waitForURL(/\/room\//);

    const roomUrl = page.url();

    // Open new browser context for signed-in user
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Sign up new user
    const email = await signUpUser(newPage, 'participant');

    // Visit the room
    await newPage.goto(roomUrl);

    // Should see themselves in participants list
    await expect(newPage.locator(`text=${email}`).first()).toBeVisible();

    await newContext.close();
  });

  test('signed-in user with display name should use display name in room', async ({ page, browser }) => {
    // Create a room with an anonymous user
    await page.goto('/');
    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Display Name Test Room');
    await page.click('#create-modal button[type="submit"]');
    await page.waitForURL(/\/room\//);

    const roomUrl = page.url();

    // Open new browser context for signed-in user
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Sign up and set display name
    await signUpUser(newPage, 'displayname');

    const displayName = `Test User ${Date.now()}`;
    await newPage.goto('/profile');
    await newPage.fill('input#display_name', displayName);
    await newPage.click('button:has-text("Save Changes")');
    await newPage.waitForSelector('#profile-success:visible');

    // Visit the room
    await newPage.goto(roomUrl);

    // Should see display name in participants list
    await expect(newPage.locator(`text=${displayName}`).first()).toBeVisible();

    await newContext.close();
  });

  test('anonymous user should still see join form', async ({ page, browser }) => {
    // Create a room
    await page.goto('/');
    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Anonymous Join Test');
    await page.click('#create-modal button[type="submit"]');
    await page.waitForURL(/\/room\//);

    const roomUrl = page.url();

    // Open new browser context (anonymous user)
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Visit the room as anonymous
    await newPage.goto(roomUrl);

    // Should see join form
    await expect(newPage.locator('#join-form')).toBeVisible();
    await expect(newPage.locator('input[name="name"]')).toBeVisible();

    await newContext.close();
  });

  test('creator of room should still be manager even when signed in', async ({ page }) => {
    // Sign up user
    await signUpUser(page, 'roomcreator');

    // Create a room
    await page.goto('/');
    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Creator Manager Test');
    await page.click('#create-modal button[type="submit"]');
    await page.waitForURL(/\/room\//);

    // Should see manager controls
    await expect(page.locator('#manager-controls')).toBeVisible();
  });
});
