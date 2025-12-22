import { test, expect } from '@playwright/test';

test.describe('Teams Feature', () => {
  const testPassword = 'TestPassword123!';

  // Helper to create a unique user and sign up
  async function signUpUser(page: any, emailPrefix: string) {
    const email = `${emailPrefix}${Date.now()}@test.com`;
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    return email;
  }

  test.describe('Teams Page Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/teams');
      await expect(page).toHaveURL(/\/login\?redirect=/);
    });

    test('should show teams page for authenticated users', async ({ page }) => {
      await signUpUser(page, 'teamaccess');
      await page.goto('/teams');
      await expect(page).toHaveURL('/teams');
      await expect(page.getByRole('heading', { name: 'Your Teams' })).toBeVisible();
    });
  });

  test.describe('Create Team', () => {
    test('should display create team button', async ({ page }) => {
      await signUpUser(page, 'createteam');
      await page.goto('/teams');
      await expect(page.locator('main button:has-text("Create Team")')).toBeVisible();
    });

    test('should open create team modal', async ({ page }) => {
      await signUpUser(page, 'createmodal');
      await page.goto('/teams');
      await page.locator('main button:has-text("Create Team")').click();
      await expect(page.locator('#create-team-modal')).toBeVisible();
      await expect(page.locator('#create-team-modal-title')).toContainText('Create a Team');
    });

    test('should create a team successfully', async ({ page }) => {
      await signUpUser(page, 'newteam');
      await page.goto('/teams');
      await page.locator('main button:has-text("Create Team")').click();

      const teamName = `Test Team ${Date.now()}`;
      const teamSlug = `test-team-${Date.now()}`;

      await page.fill('input[name="name"]', teamName);
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');

      // Should redirect to team page or show in list
      await expect(page).toHaveURL(new RegExp(`/teams/${teamSlug}`));
      await expect(page.locator(`main:has-text("${teamName}")`)).toBeVisible();
    });

    test('should show error for duplicate team slug', async ({ page }) => {
      await signUpUser(page, 'dupslug');
      await page.goto('/teams');

      // Create first team
      await page.locator('main button:has-text("Create Team")').click();
      const slug = `dup-slug-${Date.now()}`;
      await page.fill('input[name="name"]', 'First Team');
      await page.fill('input[name="slug"]', slug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Wait for redirect to team page after creation
      await page.waitForURL(new RegExp(`/teams/${slug}`));

      // Try to create second team with same slug
      await page.goto('/teams');
      await page.locator('main button:has-text("Create Team")').click();
      await page.fill('input[name="name"]', 'Second Team');
      await page.fill('input[name="slug"]', slug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Should show error
      await expect(page.locator('#create-team-error')).toContainText('already taken');
    });

    test('should validate team slug format', async ({ page }) => {
      await signUpUser(page, 'slugvalidate');
      await page.goto('/teams');
      await page.locator('main button:has-text("Create Team")').click();

      const slugInput = page.locator('input[name="slug"]');

      // Test that only lowercase, numbers, and hyphens are allowed
      await page.fill('input[name="name"]', 'Test Team');
      await page.fill('input[name="slug"]', 'UPPERCASE');

      // The pattern attribute should prevent invalid slugs
      await expect(slugInput).toHaveAttribute('pattern');
    });
  });

  test.describe('Team Navigation', () => {
    test('should navigate to teams from header menu', async ({ page }) => {
      await signUpUser(page, 'teamnav');
      await page.goto('/');

      // Open user menu and click teams
      await page.click('#user-menu-button');
      await page.click('a[href="/teams"]');
      await expect(page).toHaveURL('/teams');
    });
  });

  test.describe('Team Details Page', () => {
    test('should display team information', async ({ page }) => {
      await signUpUser(page, 'teamdetails');
      await page.goto('/teams');

      // Create a team first
      await page.locator('main button:has-text("Create Team")').click();
      const teamName = `Details Team ${Date.now()}`;
      const teamSlug = `details-team-${Date.now()}`;
      await page.fill('input[name="name"]', teamName);
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Should redirect to team page after creation
      await expect(page).toHaveURL(new RegExp(`/teams/${teamSlug}`));
      // Team name should be visible on the page
      await expect(page.locator(`text=${teamName}`).first()).toBeVisible();
    });
  });

  test.describe('Team Members', () => {
    test('should show current user as owner', async ({ page }) => {
      const email = await signUpUser(page, 'teamowner');
      await page.goto('/teams');

      // Create a team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `owner-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Owner Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Wait for redirect to team page after creation
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Navigate to members page
      await page.goto(`/teams/${teamSlug}/members`);

      // Should show the owner badge
      await expect(page.locator('main:has-text("Owner")')).toBeVisible();
      await expect(page.locator(`main:has-text("${email}")`)).toBeVisible();
    });
  });

  test.describe('Team Settings', () => {
    test('should allow owner to access settings', async ({ page }) => {
      await signUpUser(page, 'teamsettings');
      await page.goto('/teams');

      // Create a team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `settings-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Settings Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Wait for redirect to team page after creation
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Navigate to settings page
      await page.goto(`/teams/${teamSlug}/settings`);
      await expect(page.locator('main h1')).toContainText('Settings');
    });
  });

  test.describe('Team Invitations', () => {
    test('should show invite button for owner', async ({ page }) => {
      await signUpUser(page, 'teaminvite');
      await page.goto('/teams');

      // Create a team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `invite-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Invite Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Wait for redirect to team page after creation
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Navigate to members page
      await page.goto(`/teams/${teamSlug}/members`);

      // Should show invite button (exact match to avoid matching "Invite Link" etc.)
      await expect(page.getByRole('button', { name: 'Invite', exact: true })).toBeVisible();
    });

    test('should open invite modal', async ({ page }) => {
      await signUpUser(page, 'invitemodal');
      await page.goto('/teams');

      // Create a team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `modal-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Modal Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();

      // Wait for redirect to team page after creation
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Navigate to members page and click invite
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();

      // Should show invite modal
      await expect(page.locator('#invite-modal-title')).toBeVisible();
    });
  });
});
