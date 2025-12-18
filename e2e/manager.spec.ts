import { test, expect } from '@playwright/test';

test.describe('Manager Controls', () => {
  // Use large viewport to see sidebar
  test.use({ viewport: { width: 1280, height: 720 } });

  test('room creator should be assigned manager role', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await page.click('button:has-text("Create Room")');
    await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);

    // Join the room
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#vote-cards-section')).toBeVisible({ timeout: 10000 });

    // Should see manager badge
    await expect(page.locator('text=Manager').first()).toBeVisible();

    // Should see manager controls
    await expect(page.locator('#manager-controls')).toBeVisible();
  });

  test('should show manager controls with start voting button', async ({ page }) => {
    await page.goto('/');

    // Create and join room as manager
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Should see topic input and start voting button
    await expect(page.locator('#topic-input')).toBeVisible();
    await expect(page.locator('#start-voting-btn')).toBeVisible();
  });

  test('second user should be assigned member role', async ({ page, browser }) => {
    await page.goto('/');

    // Create and join room as manager
    await page.click('button:has-text("Create Room")');
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Team Member');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Second user should NOT see manager controls
    await expect(page2.locator('#manager-controls')).not.toBeVisible();

    // Second user should not have manager badge in their "You" section
    const youSection = page2.locator('.border-b.border-slate-800').first();
    await expect(youSection.locator('text=Manager')).not.toBeVisible();

    await context2.close();
  });

  test('manager can start voting with a topic', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Enter topic and start voting
    await page.fill('#topic-input', 'User Story #123');
    await page.click('#start-voting-btn');

    // Should show voting in progress status
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Topic should be displayed
    await expect(page.locator('#current-topic-display')).toHaveText('User Story #123', { timeout: 10000 });

    // Vote cards should be enabled
    await expect(page.locator('#vote-cards-section')).not.toHaveClass(/opacity-50/);
  });

  test('manager can start voting without a topic', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Start voting without topic
    await page.click('#start-voting-btn');

    // Should show voting in progress status
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });
  });

  test('manager controls should change during voting', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Initially should see start voting controls
    await expect(page.locator('#manager-waiting')).toBeVisible();
    await expect(page.locator('#manager-voting')).not.toBeVisible();

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Should now see reveal/reset controls
    await expect(page.locator('#manager-waiting')).not.toBeVisible();
    await expect(page.locator('#manager-voting')).toBeVisible();
    await expect(page.locator('#reveal-votes-btn')).toBeVisible();
    await expect(page.locator('#reset-votes-btn')).toBeVisible();
  });

  test('participants can vote when voting is active', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Click on a vote card
    await page.click('.vote-card[data-vote="5"]');

    // Your vote should update
    await expect(page.locator('#your-vote-display')).toHaveText('5');

    // Vote card should be selected
    await expect(page.locator('.vote-card[data-vote="5"]')).toHaveClass(/border-indigo-500/);
  });

  test('manager can reveal votes', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Cast a vote
    await page.click('.vote-card[data-vote="8"]');
    await expect(page.locator('#your-vote-display')).toHaveText('8');

    // Reveal votes
    await page.click('#reveal-votes-btn');

    // Should show revealed status
    await expect(page.locator('#status-revealed')).toBeVisible({ timeout: 10000 });

    // Results section should be visible
    await expect(page.locator('#results-section')).toBeVisible();
  });

  test('results section shows vote distribution and average', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting and vote
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="5"]');

    // Reveal votes
    await page.click('#reveal-votes-btn');
    await expect(page.locator('#status-revealed')).toBeVisible({ timeout: 10000 });

    // Check results section - wait a bit for realtime to propagate
    await page.waitForTimeout(500);
    await expect(page.locator('#results-section')).toBeVisible({ timeout: 15000 });
    // Wait for results to be populated (the vote-results div contains vote result items)
    await expect(page.locator('#vote-results').locator('div').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#vote-average')).toHaveText(/\d/, { timeout: 15000 });
  });

  test('manager can reset votes', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Cast a vote
    await page.click('.vote-card[data-vote="5"]');
    await expect(page.locator('#your-vote-display')).toHaveText('5');

    // Reset votes
    await page.click('#reset-votes-btn');

    // Should go back to waiting status
    await expect(page.locator('#status-waiting')).toBeVisible({ timeout: 10000 });

    // Vote cards should be disabled again
    await expect(page.locator('#vote-cards-section')).toHaveClass(/opacity-50/);
  });

  test('manager can start a new round after revealing', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting, vote, and reveal
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="5"]');
    await page.click('#reveal-votes-btn');
    await expect(page.locator('#status-revealed')).toBeVisible({ timeout: 10000 });

    // Should see new round controls
    await expect(page.locator('#manager-revealed')).toBeVisible();
    await expect(page.locator('#next-topic-input')).toBeVisible();
    await expect(page.locator('#new-round-btn')).toBeVisible();

    // Start new round with new topic
    await page.fill('#next-topic-input', 'User Story #456');
    await page.click('#new-round-btn');

    // Should be back in voting state
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#current-topic-display')).toHaveText('User Story #456');
  });

  test('vote indicator shows in participant list during voting', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });

    // Vote indicator should show "?" before voting
    const voteIndicator = page.locator('#participants-list .vote-indicator').first();
    await expect(voteIndicator).toContainText('?');

    // Cast a vote
    await page.click('.vote-card[data-vote="5"]');

    // Vote indicator should now show checkmark (or update)
    await expect(voteIndicator.locator('svg')).toBeVisible({ timeout: 5000 });
  });

  test('manager can toggle show votes setting', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Toggle should be visible and unchecked by default
    const toggle = page.locator('#show-votes-toggle');
    await expect(toggle).not.toBeChecked();

    // Click the label (since the checkbox is sr-only)
    await page.locator('label:has(#show-votes-toggle)').click();

    // Toggle should now be checked
    await expect(toggle).toBeChecked({ timeout: 5000 });

    // Description should update
    await expect(page.locator('#show-votes-description')).toContainText('All participants can see who voted what');
  });

  test('manager always sees who voted what after reveal', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // DO NOT enable show votes - manager should still see

    // Start voting and vote
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-voting')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="8"]');

    // Reveal votes
    await page.click('#reveal-votes-btn');
    await expect(page.locator('#status-revealed')).toBeVisible({ timeout: 10000 });

    // Manager should still see vote next to participant name
    await expect(page.locator('.vote-display')).toContainText('voted 8');
  });

  test('show votes toggle changes description text', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await page.click('button:has-text("Create Room")');
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Initial state - votes are anonymous
    await expect(page.locator('#show-votes-description')).toContainText('Votes are shown anonymously');

    // Enable show votes
    await page.locator('label:has(#show-votes-toggle)').click();
    await expect(page.locator('#show-votes-toggle')).toBeChecked({ timeout: 5000 });

    // Description should update
    await expect(page.locator('#show-votes-description')).toContainText('All participants can see who voted what');

    // Toggle back
    await page.locator('label:has(#show-votes-toggle)').click();
    await expect(page.locator('#show-votes-toggle')).not.toBeChecked({ timeout: 5000 });

    // Description should revert
    await expect(page.locator('#show-votes-description')).toContainText('Votes are shown anonymously');
  });
});
