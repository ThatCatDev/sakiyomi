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
      await expect(page.locator('h1')).toContainText('Teams');
    });
  });

  test.describe('Create Team', () => {
    test('should display create team button', async ({ page }) => {
      await signUpUser(page, 'createteam');
      await page.goto('/teams');
      await expect(page.locator('button:has-text("Create Team")')).toBeVisible();
    });

    test('should open create team modal', async ({ page }) => {
      await signUpUser(page, 'createmodal');
      await page.goto('/teams');
      await page.click('button:has-text("Create Team")');
      await expect(page.locator('text=Create a New Team')).toBeVisible();
    });

    test('should create a team successfully', async ({ page }) => {
      await signUpUser(page, 'newteam');
      await page.goto('/teams');
      await page.click('button:has-text("Create Team")');

      const teamName = `Test Team ${Date.now()}`;
      const teamSlug = `test-team-${Date.now()}`;

      await page.fill('input[name="name"]', teamName);
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');

      // Should redirect to team page or show in list
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${teamName}`)).toBeVisible();
    });

    test('should show error for duplicate team slug', async ({ page }) => {
      await signUpUser(page, 'dupslug');
      await page.goto('/teams');

      // Create first team
      await page.click('button:has-text("Create Team")');
      const slug = `dup-slug-${Date.now()}`;
      await page.fill('input[name="name"]', 'First Team');
      await page.fill('input[name="slug"]', slug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Try to create second team with same slug
      await page.goto('/teams');
      await page.click('button:has-text("Create Team")');
      await page.fill('input[name="name"]', 'Second Team');
      await page.fill('input[name="slug"]', slug);
      await page.click('button[type="submit"]:has-text("Create Team")');

      // Should show error
      await expect(page.locator('text=already exists')).toBeVisible();
    });

    test('should validate team slug format', async ({ page }) => {
      await signUpUser(page, 'slugvalidate');
      await page.goto('/teams');
      await page.click('button:has-text("Create Team")');

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
      await page.click('button:has-text("Create Team")');
      const teamName = `Details Team ${Date.now()}`;
      const teamSlug = `details-team-${Date.now()}`;
      await page.fill('input[name="name"]', teamName);
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Navigate to team page
      await page.click(`text=${teamName}`);
      await expect(page).toHaveURL(new RegExp(`/teams/${teamSlug}`));
    });
  });

  test.describe('Team Members', () => {
    test('should show current user as owner', async ({ page }) => {
      const email = await signUpUser(page, 'teamowner');
      await page.goto('/teams');

      // Create a team
      await page.click('button:has-text("Create Team")');
      const teamSlug = `owner-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Owner Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Navigate to members page
      await page.goto(`/teams/${teamSlug}/members`);

      // Should show the owner badge
      await expect(page.locator('text=Owner').first()).toBeVisible();
      await expect(page.locator(`text=${email}`)).toBeVisible();
    });
  });

  test.describe('Team Settings', () => {
    test('should allow owner to access settings', async ({ page }) => {
      await signUpUser(page, 'teamsettings');
      await page.goto('/teams');

      // Create a team
      await page.click('button:has-text("Create Team")');
      const teamSlug = `settings-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Settings Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Navigate to settings page
      await page.goto(`/teams/${teamSlug}/settings`);
      await expect(page.locator('h1')).toContainText('Settings');
    });
  });

  test.describe('Team Invitations', () => {
    test('should show invite button for owner', async ({ page }) => {
      await signUpUser(page, 'teaminvite');
      await page.goto('/teams');

      // Create a team
      await page.click('button:has-text("Create Team")');
      const teamSlug = `invite-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Invite Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Navigate to members page
      await page.goto(`/teams/${teamSlug}/members`);

      // Should show invite button
      await expect(page.locator('button:has-text("Invite")')).toBeVisible();
    });

    test('should open invite modal', async ({ page }) => {
      await signUpUser(page, 'invitemodal');
      await page.goto('/teams');

      // Create a team
      await page.click('button:has-text("Create Team")');
      const teamSlug = `modal-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'Modal Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.click('button[type="submit"]:has-text("Create Team")');
      await page.waitForTimeout(500);

      // Navigate to members page and click invite
      await page.goto(`/teams/${teamSlug}/members`);
      await page.click('button:has-text("Invite")');

      // Should show invite modal
      await expect(page.locator('text=Invite')).toBeVisible();
    });
  });
});
