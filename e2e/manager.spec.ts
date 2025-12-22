import { test, expect } from '@playwright/test';

// Helper to create a room via the modal
async function createRoom(page: import('@playwright/test').Page, name = 'Test Room') {
  await page.click('#create-room-btn');
  await page.fill('#room-name', name);
  await page.click('#create-modal button[type="submit"]');
  await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/);
}

test.describe('Manager Controls', () => {
  // Use large viewport to see sidebar
  test.use({ viewport: { width: 1280, height: 720 } });

  test('room creator should be assigned manager role', async ({ page }) => {
    await page.goto('/');

    // Create a room
    await createRoom(page);

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
    await createRoom(page);
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
    await createRoom(page);
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
    const youSection = page2.locator('[data-participants-sidebar]').first();
    await expect(youSection.locator('text=Manager')).not.toBeVisible();

    await context2.close();
  });

  test('manager can start voting with a topic', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Enter topic and start voting
    await page.fill('#topic-input', 'User Story #123');
    await page.click('#start-voting-btn');

    // Should show voting in progress status
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Topic should be displayed
    await expect(page.locator('#current-topic-display')).toHaveText('User Story #123', { timeout: 10000 });

    // Vote cards should be enabled
    await expect(page.locator('#vote-cards-section')).not.toHaveClass(/opacity-50/);
  });

  test('manager can start voting without a topic', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Start voting without topic
    await page.click('#start-voting-btn');

    // Should show voting in progress status
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });
  });

  test('manager controls should change during voting', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Initially should see start voting controls
    await expect(page.locator('#manager-waiting')).toBeVisible();
    await expect(page.locator('#manager-voting')).not.toBeVisible();

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Should now see reveal/reset controls
    await expect(page.locator('#manager-waiting')).not.toBeVisible();
    await expect(page.locator('#manager-voting')).toBeVisible();
    await expect(page.locator('#reveal-votes-btn')).toBeVisible();
    await expect(page.locator('#reset-votes-btn')).toBeVisible();
  });

  test('participants can vote when voting is active', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Click on a vote card
    await page.click('.vote-card[data-vote="5"]');

    // Your vote should update
    await expect(page.locator('#your-vote-display')).toHaveText('5');

    // Vote card should be selected
    await expect(page.locator('.vote-card[data-vote="5"]')).toHaveClass(/border-brand/);
  });

  test('manager can reveal votes', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Cast a vote
    await page.click('.vote-card[data-vote="8"]');
    await expect(page.locator('#your-vote-display')).toHaveText('8');

    // Reveal votes
    await page.click('#reveal-votes-btn');

    // Should show revealed status
    await expect(page.locator('#status-banner[data-status="revealed"]')).toBeVisible({ timeout: 10000 });

    // Results section should be visible
    await expect(page.locator('#results-section')).toBeVisible();
  });

  test('results section shows vote distribution and average', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting and vote
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="5"]');

    // Reveal votes
    await page.click('#reveal-votes-btn');
    await expect(page.locator('#status-banner[data-status="revealed"]')).toBeVisible({ timeout: 10000 });

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
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Cast a vote
    await page.click('.vote-card[data-vote="5"]');
    await expect(page.locator('#your-vote-display')).toHaveText('5');

    // Reset votes
    await page.click('#reset-votes-btn');

    // Should go back to waiting status
    await expect(page.locator('#status-banner[data-status="waiting"]')).toBeVisible({ timeout: 10000 });

    // Vote cards should be disabled again
    await expect(page.locator('#vote-cards-section')).toHaveClass(/opacity-50/);
  });

  test('manager can start a new round after revealing', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting, vote, and reveal
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="5"]');
    await page.click('#reveal-votes-btn');
    await expect(page.locator('#status-banner[data-status="revealed"]')).toBeVisible({ timeout: 10000 });

    // Should see new round controls
    await expect(page.locator('#manager-revealed')).toBeVisible();
    await expect(page.locator('#next-topic-input')).toBeVisible();
    await expect(page.locator('#new-round-btn')).toBeVisible();

    // Start new round with new topic
    await page.fill('#next-topic-input', 'User Story #456');
    await page.click('#new-round-btn');

    // Should be back in voting state
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#current-topic-display')).toHaveText('User Story #456');
  });

  test('vote indicator shows in participant list during voting', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');

    // Start voting
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });

    // Vote indicator should show "-" before voting (no vote yet)
    const voteIndicator = page.locator('#participants-list .vote-indicator').first();
    await expect(voteIndicator).toContainText('-');

    // Wait for vote cards to be enabled
    await expect(page.locator('.vote-card[data-vote="5"]')).toBeEnabled({ timeout: 10000 });

    // Cast a vote
    await page.click('.vote-card[data-vote="5"]');

    // Vote indicator should now show the vote value (manager sees actual votes)
    await expect(voteIndicator).toContainText('5', { timeout: 5000 });
  });

  test('manager can toggle show votes setting in settings modal', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Open settings modal
    await page.click('#open-settings-btn');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Toggle should be visible and unchecked by default
    const toggle = page.locator('#settings-show-votes');
    await expect(toggle).not.toBeChecked();

    // Click the label (since the checkbox is sr-only)
    await page.locator('label:has(#settings-show-votes)').click();

    // Toggle should now be checked
    await expect(toggle).toBeChecked({ timeout: 5000 });

    // Description should update
    await expect(page.locator('#settings-show-votes-description')).toContainText('Vote indicators visible in sidebar');

    // Close modal using the Modal component's close button
    await page.click('#settings-modal .close-modal-btn');
    await expect(page.locator('#settings-modal')).toBeHidden();
  });

  test('manager always sees vote values in sidebar', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // DO NOT enable show votes - manager should still see vote values

    // Start voting and vote
    await page.click('#start-voting-btn');
    await expect(page.locator('#status-banner[data-status="voting"]')).toBeVisible({ timeout: 10000 });
    await page.click('.vote-card[data-vote="8"]');

    // Manager should see vote value in the vote indicator (not just checkmark)
    const voteIndicator = page.locator('#participants-list .vote-indicator').first();
    await expect(voteIndicator).toContainText('8', { timeout: 5000 });
  });

  test('settings modal show votes toggle changes description text', async ({ page }) => {
    await page.goto('/');

    // Create and join room
    await createRoom(page);
    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Open settings modal
    await page.click('#open-settings-btn');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Initial state - vote indicators hidden
    await expect(page.locator('#settings-show-votes-description')).toContainText('Vote indicators hidden in sidebar');

    // Enable show votes
    await page.locator('label:has(#settings-show-votes)').click();
    await expect(page.locator('#settings-show-votes')).toBeChecked({ timeout: 5000 });

    // Description should update
    await expect(page.locator('#settings-show-votes-description')).toContainText('Vote indicators visible in sidebar');

    // Toggle back
    await page.locator('label:has(#settings-show-votes)').click();
    await expect(page.locator('#settings-show-votes')).not.toBeChecked({ timeout: 5000 });

    // Description should revert
    await expect(page.locator('#settings-show-votes-description')).toContainText('Vote indicators hidden in sidebar');
  });

  test('manager role should transfer to another user when manager leaves', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'New Manager');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Second user should NOT see manager controls initially
    await expect(page2.locator('#manager-controls')).not.toBeVisible();

    // Manager leaves the room
    await page.click('#leave-room-btn');
    await expect(page.locator('#leave-modal')).toBeVisible();
    await page.click('#confirm-leave-btn');

    // Wait for page to reload (leave redirects/reloads)
    await expect(page.locator('#join-section')).toBeVisible({ timeout: 10000 });

    // Second user should now have manager controls
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Second user should see Manager badge
    await expect(page2.locator('text=Manager').first()).toBeVisible();

    await context2.close();
  });

  test('manager role should transfer to oldest participant when manager leaves', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins first
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);
    await page2.fill('input[name="name"]', 'First Joiner');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Third user joins second
    const context3 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page3 = await context3.newPage();
    await page3.goto(roomUrl);
    await page3.fill('input[name="name"]', 'Second Joiner');
    await page3.click('button:has-text("Join Room")');
    await expect(page3.locator('#vote-cards-section')).toBeVisible();

    // Neither should have manager controls
    await expect(page2.locator('#manager-controls')).not.toBeVisible();
    await expect(page3.locator('#manager-controls')).not.toBeVisible();

    // Manager leaves
    await page.click('#leave-room-btn');
    await expect(page.locator('#leave-modal')).toBeVisible();
    await page.click('#confirm-leave-btn');
    await expect(page.locator('#join-section')).toBeVisible({ timeout: 10000 });

    // First joiner (oldest) should become manager
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Second joiner should NOT have manager controls
    await expect(page3.locator('#manager-controls')).not.toBeVisible();

    await context2.close();
    await context3.close();
  });

  test('manager can promote another user to manager', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Team Member');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Second user should NOT see manager controls initially
    await expect(page2.locator('#manager-controls')).not.toBeVisible();

    // Wait for realtime to sync participant list
    await page.waitForTimeout(500);

    // Manager clicks promote button for Team Member
    const participantItem = page.locator('#participants-list li').filter({ hasText: 'Team Member' });
    await expect(participantItem).toBeVisible();
    const promoteBtn = participantItem.locator('.promote-btn');
    await expect(promoteBtn).toBeVisible();
    await promoteBtn.click();

    // Second user should now have manager controls
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Second user should see Manager badge
    await expect(page2.locator('text=Manager').first()).toBeVisible();

    // Manager badge (text-brand) should appear next to Team Member in the participants list
    await expect(participantItem.locator('.text-brand')).toBeVisible({ timeout: 5000 });

    await context2.close();
  });

  test('manager can demote another manager', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Second Manager');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Wait for realtime to sync
    await page.waitForTimeout(500);

    // First promote the second user
    const participantItem = page.locator('#participants-list li').filter({ hasText: 'Second Manager' });
    await participantItem.locator('.promote-btn').click();

    // Wait for promotion to complete
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Now demote button should appear instead of promote button
    await expect(participantItem.locator('.demote-btn')).toBeVisible({ timeout: 5000 });

    // Click demote
    await participantItem.locator('.demote-btn').click();

    // Second user should lose manager controls
    await expect(page2.locator('#manager-controls')).not.toBeVisible({ timeout: 10000 });

    // Manager badge (text-brand) should be removed from participant list
    await expect(participantItem.locator('.text-brand')).not.toBeVisible({ timeout: 5000 });

    await context2.close();
  });

  test('manager can demote themselves', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Team Member');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Wait for realtime sync
    await page.waitForTimeout(500);

    // First promote the second user so there are two managers
    const teamMemberItem = page.locator('#participants-list li').filter({ hasText: 'Team Member' });
    await teamMemberItem.locator('.promote-btn').click();
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Now original manager can demote themselves
    // Find own participant item (has current-user-indicator star)
    const ownItem = page.locator('#participants-list li:has(.current-user-indicator)');
    await expect(ownItem.locator('.demote-btn')).toBeVisible({ timeout: 5000 });
    await ownItem.locator('.demote-btn').click();

    // Original manager should lose manager controls
    await expect(page.locator('#manager-controls')).not.toBeVisible({ timeout: 10000 });

    // Manager badge should be removed from "You" section
    const youSection = page.locator('[data-participants-sidebar]').first();
    await expect(youSection.locator('.bg-brand-light')).not.toBeVisible({ timeout: 5000 });

    await context2.close();
  });

  test('cannot demote the last manager', async ({ page }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);

    await page.fill('input[name="name"]', 'Solo Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Find own participant item (has current-user-indicator star)
    const ownItem = page.locator('#participants-list li:has(.current-user-indicator)');

    // Demote button should be visible (manager can try to demote themselves)
    await expect(ownItem.locator('.demote-btn')).toBeVisible();

    // Handle the alert dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Cannot demote the last manager');
      await dialog.accept();
    });

    // Click demote
    await ownItem.locator('.demote-btn').click();

    // Wait for error alert
    await page.waitForTimeout(500);

    // Manager should still have manager controls (demotion failed)
    await expect(page.locator('#manager-controls')).toBeVisible();
  });

  test('promoted user sees promote/demote buttons for other participants', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Original Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'New Manager');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Third user joins
    const context3 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page3 = await context3.newPage();
    await page3.goto(roomUrl);

    await page3.fill('input[name="name"]', 'Team Member');
    await page3.click('button:has-text("Join Room")');
    await expect(page3.locator('#vote-cards-section')).toBeVisible();

    // Wait for realtime sync
    await page.waitForTimeout(500);

    // Second user should NOT see any promote buttons (not a manager yet)
    await expect(page2.locator('.promote-btn')).not.toBeVisible();

    // Promote second user
    const newManagerItem = page.locator('#participants-list li').filter({ hasText: 'New Manager' });
    await newManagerItem.locator('.promote-btn').click();

    // Wait for promotion
    await expect(page2.locator('#manager-controls')).toBeVisible({ timeout: 10000 });

    // Now second user should see promote buttons for third user
    await page2.waitForTimeout(500);
    const teamMemberItemPage2 = page2.locator('#participants-list li').filter({ hasText: 'Team Member' });
    await expect(teamMemberItemPage2.locator('.promote-btn')).toBeVisible({ timeout: 5000 });

    // And demote button for the original manager
    const originalManagerItemPage2 = page2.locator('#participants-list li').filter({ hasText: 'Original Manager' });
    await expect(originalManagerItemPage2.locator('.demote-btn')).toBeVisible({ timeout: 5000 });

    await context2.close();
    await context3.close();
  });

  test('manager can kick another user', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Kicked User');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Wait for realtime sync
    await page.waitForTimeout(500);

    // Manager clicks kick button
    const participantItem = page.locator('#participants-list li').filter({ hasText: 'Kicked User' });
    await expect(participantItem).toBeVisible();

    const kickBtn = participantItem.locator('.kick-btn');
    await expect(kickBtn).toBeVisible();
    await kickBtn.click();

    // Kick confirmation modal should appear
    await expect(page.locator('#kick-modal')).toBeVisible();

    // Second user should be kicked - handle alert on page2
    page2.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('removed from this room');
      await dialog.accept();
    });

    // Confirm kick
    await page.click('#confirm-kick-btn');

    // Wait for kick to process
    await page2.waitForTimeout(1000);

    // Participant should be removed from manager's list
    await expect(participantItem).not.toBeVisible({ timeout: 10000 });

    // Participant count should decrease
    await expect(page.locator('#participant-count')).toHaveText('1');

    await context2.close();
  });

  test('manager cannot kick themselves', async ({ page }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);

    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Find own participant item (has current-user-indicator star)
    const ownItem = page.locator('#participants-list li:has(.current-user-indicator)');

    // Kick button should NOT be visible for self
    await expect(ownItem.locator('.kick-btn')).not.toBeVisible();
  });

  test('kicked user sees alert and is redirected to join form', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Kicked User');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Wait for realtime sync
    await page.waitForTimeout(500);

    // Handle alert on page2
    page2.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('removed from this room');
      await dialog.accept();
    });

    // Manager clicks kick button
    const participantItem = page.locator('#participants-list li').filter({ hasText: 'Kicked User' });
    await participantItem.locator('.kick-btn').click();

    // Confirm kick in modal
    await expect(page.locator('#kick-modal')).toBeVisible();
    await page.click('#confirm-kick-btn');

    // Kicked user should see join form again after page reload
    await expect(page2.locator('#join-section')).toBeVisible({ timeout: 15000 });

    await context2.close();
  });

  test('non-manager cannot see kick button', async ({ page, browser }) => {
    await page.goto('/');

    // Create room and join as manager
    await createRoom(page);
    const roomUrl = page.url();

    await page.fill('input[name="name"]', 'Room Manager');
    await page.click('button:has-text("Join Room")');
    await expect(page.locator('#manager-controls')).toBeVisible();

    // Second user joins as non-manager
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto(roomUrl);

    await page2.fill('input[name="name"]', 'Team Member');
    await page2.click('button:has-text("Join Room")');
    await expect(page2.locator('#vote-cards-section')).toBeVisible();

    // Non-manager should NOT see kick buttons
    await expect(page2.locator('.kick-btn')).not.toBeVisible();

    await context2.close();
  });
});
