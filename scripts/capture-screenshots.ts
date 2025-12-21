import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(__dirname, '../docs/src/assets/screenshots');
const BASE_URL = 'http://localhost:4321';

async function joinRoom(context: BrowserContext, roomUrl: string, name: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(roomUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Fill join form
  const joinForm = page.locator('#join-form');
  if (await joinForm.isVisible().catch(() => false)) {
    await page.fill('#name', name);
    await page.click('#join-form button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  return page;
}

async function captureScreenshots() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  // Create separate contexts for each user (isolated cookies/sessions)
  const aliceContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const bobContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const charlieContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  const alicePage = await aliceContext.newPage();

  // Alice creates the room
  console.log('Alice: Creating room...');
  await alicePage.goto(BASE_URL);
  await alicePage.waitForLoadState('networkidle');

  // Capture homepage
  await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'homepage.png') });

  // Create room
  await alicePage.click('#create-room-btn');
  await alicePage.waitForTimeout(300);
  await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'create-room-modal.png') });

  await alicePage.fill('#room-name', 'Sprint Planning');
  await alicePage.click('#create-room-form button[type="submit"]');

  await alicePage.waitForURL(/\/room\//, { timeout: 10000 });
  const roomUrl = alicePage.url();
  console.log('  Room URL:', roomUrl);

  await alicePage.waitForLoadState('networkidle');
  await alicePage.waitForTimeout(500);

  // Capture join form
  await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'join-form.png') });

  // Alice joins as manager
  console.log('Alice: Joining room...');
  await alicePage.fill('#name', 'Alice');
  await alicePage.click('#join-form button[type="submit"]');
  await alicePage.waitForLoadState('networkidle');
  await alicePage.waitForTimeout(1500);

  // Bob joins
  console.log('Bob: Joining room...');
  const bobPage = await joinRoom(bobContext, roomUrl, 'Bob');

  // Charlie joins
  console.log('Charlie: Joining room...');
  const charliePage = await joinRoom(charlieContext, roomUrl, 'Charlie');

  // Wait for realtime updates to sync
  await alicePage.waitForTimeout(2000);

  // Capture room with multiple participants
  console.log('Capturing room with participants...');
  await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'room-waiting.png') });

  // Capture participant sidebar with multiple users
  const sidebar = alicePage.locator('[data-participants-sidebar]');
  if (await sidebar.isVisible().catch(() => false)) {
    await sidebar.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-sidebar.png') });
  }

  // Capture individual participant row with action buttons (Bob's row from Alice's view)
  console.log('Capturing participant management buttons...');
  const bobRow = alicePage.locator('li[data-participant-id]').filter({ hasText: 'Bob' }).first();
  if (await bobRow.isVisible().catch(() => false)) {
    // Hover to highlight
    await bobRow.hover();
    await alicePage.waitForTimeout(200);

    // Capture the row with promote/kick buttons visible
    await bobRow.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-row-actions.png') });

    // Capture the promote button specifically
    const promoteBtn = bobRow.locator('.promote-btn');
    if (await promoteBtn.isVisible().catch(() => false)) {
      await promoteBtn.hover();
      await alicePage.waitForTimeout(100);
    }
  }

  // Capture manager controls
  const managerControls = alicePage.locator('#manager-controls');
  if (await managerControls.isVisible().catch(() => false)) {
    await managerControls.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manager-controls-waiting.png') });
  }

  // Alice starts voting
  console.log('Alice: Starting voting...');
  const topicInput = alicePage.locator('#topic-input');
  if (await topicInput.isVisible().catch(() => false)) {
    await topicInput.fill('User Authentication Story');
    await alicePage.click('#start-voting-btn');

    // Wait for voting to start
    await alicePage.waitForSelector('button[data-vote="5"]:not([disabled])', { timeout: 5000 }).catch(() => {});
    await alicePage.waitForTimeout(500);

    await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'room-voting.png') });
    await managerControls.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manager-controls-voting.png') });

    // Capture voting cards
    const votingCards = alicePage.locator('#vote-cards-section');
    if (await votingCards.isVisible().catch(() => false)) {
      await votingCards.screenshot({ path: path.join(SCREENSHOTS_DIR, 'voting-cards.png') });
    }

    // Each user votes
    console.log('Everyone voting...');

    // Alice votes 5
    await alicePage.locator('button[data-vote="5"]').click();
    await alicePage.waitForTimeout(300);

    // Bob votes 8
    await bobPage.waitForSelector('button[data-vote="8"]:not([disabled])', { timeout: 5000 }).catch(() => {});
    await bobPage.locator('button[data-vote="8"]').click().catch(() => {});
    await bobPage.waitForTimeout(300);

    // Charlie votes 5
    await charliePage.waitForSelector('button[data-vote="5"]:not([disabled])', { timeout: 5000 }).catch(() => {});
    await charliePage.locator('button[data-vote="5"]').click().catch(() => {});
    await charliePage.waitForTimeout(300);

    // Wait for votes to sync
    await alicePage.waitForTimeout(1500);

    // Capture voting cards with selection
    await votingCards.screenshot({ path: path.join(SCREENSHOTS_DIR, 'voting-cards-selected.png') });
    await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'room-voted.png') });

    // Capture sidebar showing everyone has voted
    await sidebar.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-sidebar-voted.png') });

    // Alice reveals votes
    console.log('Alice: Revealing votes...');
    const revealBtn = alicePage.locator('#reveal-votes-btn');
    if (await revealBtn.isVisible().catch(() => false)) {
      await revealBtn.click();
      await alicePage.waitForTimeout(1000);

      await alicePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'room-revealed.png') });
      await managerControls.screenshot({ path: path.join(SCREENSHOTS_DIR, 'manager-controls-revealed.png') });

      // Capture sidebar with revealed votes
      await sidebar.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-sidebar-revealed.png') });

      // Capture participant row with vote visible and action buttons
      const bobRowRevealed = alicePage.locator('li[data-participant-id]').filter({ hasText: 'Bob' }).first();
      if (await bobRowRevealed.isVisible().catch(() => false)) {
        await bobRowRevealed.hover();
        await alicePage.waitForTimeout(200);
        await bobRowRevealed.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-row-revealed.png') });
      }
    }
  }

  // Promote Bob to manager
  console.log('Alice: Promoting Bob to manager...');
  const promoteBtn = alicePage.locator('li[data-participant-id]').filter({ hasText: 'Bob' }).locator('.promote-btn');
  if (await promoteBtn.isVisible().catch(() => false)) {
    await promoteBtn.click();
    await alicePage.waitForTimeout(1000);

    // Capture sidebar showing Bob is now a manager
    await sidebar.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-sidebar-promoted.png') });

    // Capture Bob's row showing demote button instead
    const bobManagerRow = alicePage.locator('li[data-participant-id]').filter({ hasText: 'Bob' }).first();
    if (await bobManagerRow.isVisible().catch(() => false)) {
      await bobManagerRow.hover();
      await alicePage.waitForTimeout(200);
      await bobManagerRow.screenshot({ path: path.join(SCREENSHOTS_DIR, 'participant-row-demote.png') });
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${SCREENSHOTS_DIR}`);

  const files = fs.readdirSync(SCREENSHOTS_DIR);
  console.log('Files created:');
  files.forEach(f => console.log(`  - ${f}`));
}

captureScreenshots().catch(console.error);
