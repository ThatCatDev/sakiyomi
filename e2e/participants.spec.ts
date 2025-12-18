import { test, expect } from '@playwright/test';

// Helper to create a room via the modal
async function createRoom(page: import('@playwright/test').Page, name = 'Test Room') {
  await page.click('#create-room-btn');
  await page.fill('#room-name', name);
  await page.click('#create-modal button[type="submit"]');
  await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);
}

test.describe('Room Participants', () => {
  // Use large viewport to see sidebar
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should show join form when entering a room', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    // Should see join form
    await expect(page.locator('#join-section')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('button:has-text("Join Room")')).toBeVisible();

    // Should show empty participants list in sidebar
    await expect(page.locator('#no-participants')).toBeVisible();
  });

  test('should join room with name', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    // Fill in name and join
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button:has-text("Join Room")');

    // Should show voting interface (join form hidden)
    await expect(page.locator('#join-section')).not.toBeVisible();
    await expect(page.locator('#vote-cards-section')).toBeVisible();

    // Sidebar should show current user
    await expect(page.locator('#current-user-name')).toHaveText('Test User');

    // Should appear in participants list
    await expect(page.locator('#participants-list')).toBeVisible();
    await expect(page.locator('#participants-list li')).toHaveCount(1);
    await expect(page.locator('text=(you)')).toBeVisible();
  });

  test('should show error when joining with empty name', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    // Try to submit empty form (browser validation should prevent)
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('should persist participant across page reloads', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    const roomUrl = page.url();

    // Join the room
    await page.fill('input[name="name"]', 'Persistent User');
    await page.click('button:has-text("Join Room")');

    // Wait for the page to reload and show voting interface
    await expect(page.locator('#vote-cards-section')).toBeVisible();

    // Reload the page
    await page.goto(roomUrl);

    // Should still show as joined (no join form)
    await expect(page.locator('#join-section')).not.toBeVisible();
    await expect(page.locator('#current-user-name')).toHaveText('Persistent User');
  });

  test('should show multiple participants from different browsers', async ({ page, browser }) => {
    // Ensure large viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Create a room
    await createRoom(page);

    const roomUrl = page.url();

    // First user joins
    await page.fill('input[name="name"]', 'User One');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#vote-cards-section')).toBeVisible();

    // Second user in new context with large viewport
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    // Should see first user in participants list
    await expect(page2.locator('#participants-list li')).toHaveCount(1);
    await expect(page2.locator('#participants-list')).toContainText('User One');

    // Second user joins
    await page2.fill('input[name="name"]', 'User Two');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Second user should see both participants
    await expect(page2.locator('#participants-list li')).toHaveCount(2);

    // Reload first user's page to see updated list
    await page.reload();
    await expect(page.locator('#participants-list li')).toHaveCount(2);
    await expect(page.locator('#participants-list')).toContainText('User Two');

    await context2.close();
  });

  test('should show participant count in sidebar', async ({ page, browser }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    const roomUrl = page.url();

    // Should show 0 participants initially
    await expect(page.locator('#participant-count')).toHaveText('0');

    // Join room
    await page.fill('input[name="name"]', 'Counter Test');
    await page.click('button:has-text("Join Room")');

    // Should show 1 participant
    await expect(page.locator('#participant-count')).toHaveText('1');

    // Add another user
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);
    await page2.fill('input[name="name"]', 'Counter Test 2');
    await page2.click('button:has-text("Join Room")');

    // Wait for second user to fully join
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Reload first page
    await page.reload();
    await expect(page.locator('#participant-count')).toHaveText('2');

    await context2.close();
  });

  test('should display participant avatar with initial', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);

    await page.fill('input[name="name"]', 'Alice');
    await page.click('button:has-text("Join Room")');

    // Should show avatar with "A" initial in sidebar
    const avatar = page.locator('#participants-list .bg-indigo-600\\/80');
    await expect(avatar).toBeVisible();
    await expect(avatar).toContainText('A');
  });
});
