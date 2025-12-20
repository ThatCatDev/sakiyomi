import { test, expect } from '@playwright/test';

// Helper to create a room via the modal
async function createRoom(page: import('@playwright/test').Page, name = 'Test Room') {
  await page.click('#create-room-btn');
  await page.fill('#room-name', name);
  await page.click('#create-modal button[type="submit"]');
  await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);
}

test.describe('Voting Flow', () => {
  // Use large viewport to see sidebar
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should show voting cards after joining room', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

    // Join the room
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');

    // Should see voting cards
    await expect(page.locator('#vote-cards-section')).toBeVisible();
    await expect(page.locator('.vote-card')).toHaveCount(10);
  });

  test('should display all story point values', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#vote-cards-section')).toBeVisible();

    // Check all vote values are present
    const expectedVotes = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
    for (const vote of expectedVotes) {
      await expect(page.locator(`.vote-card[data-vote="${vote}"]`)).toBeVisible();
    }
  });

  test('should show your vote display section', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');

    // Should see "Your vote" section
    await expect(page.locator('#your-vote-section')).toBeVisible();
    await expect(page.locator('#your-vote-display')).toHaveText('-');
  });

  test('should show status banner', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');

    // Should see status banner - initially waiting
    await expect(page.locator('#status-banner')).toBeVisible();
    await expect(page.locator('#status-banner[data-status="waiting"]')).toBeVisible();
  });

  test('should disable vote cards when not in voting state', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#vote-cards-section')).toBeVisible();

    // Vote cards should be in disabled state (opacity-50)
    await expect(page.locator('#vote-cards-section')).toHaveClass(/opacity-50/);
  });

  test('should show topic display', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Test Voter');
    await page.click('button:has-text("Join Room")');

    // Should see topic display
    await expect(page.locator('#current-topic-display')).toBeVisible();
    await expect(page.locator('#current-topic-display')).toHaveText('No topic set');
  });
});
