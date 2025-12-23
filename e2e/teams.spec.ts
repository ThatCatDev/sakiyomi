import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './helpers/auth';

test.describe('Teams Feature', () => {
  // Helper to create a verified user
  async function signUpUser(page: any, emailPrefix: string) {
    return signUpAndVerify(page, emailPrefix);
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

    test('should generate invite link', async ({ page }) => {
      await signUpUser(page, 'genlink');
      await page.goto('/teams');

      // Create a team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `genlink-team-${Date.now()}`;
      await page.fill('input[name="name"]', 'GenLink Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Navigate to members page and open invite modal
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();

      // Generate invite link
      await page.click('#generate-link-btn');

      // Should show the invite link input
      await expect(page.locator('#invite-link-input')).toBeVisible();
      const inviteLink = await page.locator('#invite-link-input').inputValue();
      expect(inviteLink).toContain('/invite/');
    });

    test('should show sign in prompt for unauthenticated users on invite page', async ({ page }) => {
      // First create a team and get invite link as authenticated user
      await signUpUser(page, 'inviteauth');
      await page.goto('/teams');

      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `auth-invite-${Date.now()}`;
      await page.fill('input[name="name"]', 'Auth Invite Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();
      await page.click('#generate-link-btn');
      await expect(page.locator('#invite-link-input')).toBeVisible();
      const inviteLink = await page.locator('#invite-link-input').inputValue();

      // Close the modal first
      await page.click('[data-modal-close]');
      await expect(page.locator('#invite-modal')).toHaveClass(/hidden/);

      // Sign out
      await page.click('#user-menu-button');
      await page.click('button:has-text("Sign out")');
      await page.waitForURL('/login');

      // Visit invite link as unauthenticated user
      await page.goto(inviteLink);

      // Should show team name and sign in prompt
      await expect(page.locator('text=Auth Invite Team')).toBeVisible();
      await expect(page.locator('text=Sign In to Accept')).toBeVisible();
      await expect(page.locator('main a:has-text("Sign up")')).toBeVisible();
    });

    test('should allow authenticated user to accept invite', async ({ browser }) => {
      // Create team owner context
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      await signUpUser(ownerPage, 'inviteowner');
      await ownerPage.goto('/teams');

      await ownerPage.locator('main button:has-text("Create Team")').click();
      const teamSlug = `accept-invite-${Date.now()}`;
      const teamName = 'Accept Invite Team';
      await ownerPage.fill('input[name="name"]', teamName);
      await ownerPage.fill('input[name="slug"]', teamSlug);
      await ownerPage.locator('#create-team-modal button[type="submit"]').click();
      await ownerPage.waitForURL(new RegExp(`/teams/${teamSlug}`));

      await ownerPage.goto(`/teams/${teamSlug}/members`);
      await ownerPage.getByRole('button', { name: 'Invite', exact: true }).click();
      await ownerPage.click('#generate-link-btn');
      await expect(ownerPage.locator('#invite-link-input')).toBeVisible();
      const inviteLink = await ownerPage.locator('#invite-link-input').inputValue();

      // Close owner context
      await ownerContext.close();

      // Create new user context for member
      const memberContext = await browser.newContext();
      const memberPage = await memberContext.newPage();

      await signUpUser(memberPage, 'invitemember');

      // Visit invite link
      await memberPage.goto(inviteLink);

      // Should show team info and accept button
      await expect(memberPage.getByRole('heading', { name: `Join ${teamName}` })).toBeVisible();
      await expect(memberPage.locator('#accept-invite-btn')).toBeVisible();

      // Accept invite
      await memberPage.click('#accept-invite-btn');

      // Wait for redirect to team page (with longer timeout)
      await memberPage.waitForURL(new RegExp(`/teams/${teamSlug}`), { timeout: 20000 });

      // Verify we're on the team page
      await expect(memberPage.locator(`text=${teamName}`).first()).toBeVisible();

      // Clean up
      await memberContext.close();
    });

    test('should show already member message if user is already in team', async ({ page }) => {
      await signUpUser(page, 'alreadymember');
      await page.goto('/teams');

      // Create a team (user is automatically owner/member)
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `already-member-${Date.now()}`;
      await page.fill('input[name="name"]', 'Already Member Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Generate invite link
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();
      await page.click('#generate-link-btn');
      await expect(page.locator('#invite-link-input')).toBeVisible();
      const inviteLink = await page.locator('#invite-link-input').inputValue();

      // Visit the invite link as the same user (already a member)
      await page.goto(inviteLink);

      // Should show "Already a Member" message
      await expect(page.getByRole('heading', { name: 'Already a Member' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Go to Team' })).toBeVisible();
    });

    test('should show error for invalid invite token', async ({ page }) => {
      await page.goto('/invite/invalid-token-12345');

      // Should show error message
      await expect(page.locator('text=Invalid Invitation')).toBeVisible();
      await expect(page.locator('text=invalid or has expired')).toBeVisible();
    });

    test('should redirect to signup with correct redirect URL', async ({ page }) => {
      // First create a team and get invite link
      await signUpUser(page, 'signupredirect');
      await page.goto('/teams');

      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `signup-redirect-${Date.now()}`;
      await page.fill('input[name="name"]', 'Signup Redirect Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();
      await page.click('#generate-link-btn');
      await expect(page.locator('#invite-link-input')).toBeVisible();
      const inviteLink = await page.locator('#invite-link-input').inputValue();
      const inviteToken = inviteLink.split('/invite/')[1];

      // Close the modal first
      await page.click('[data-modal-close]');
      await expect(page.locator('#invite-modal')).toHaveClass(/hidden/);

      // Sign out
      await page.click('#user-menu-button');
      await page.click('button:has-text("Sign out")');
      await page.waitForURL('/login');

      // Visit invite link and click sign up (use the one in the invite content, not header)
      await page.goto(inviteLink);
      await page.locator('main a:has-text("Sign up")').click();

      // Should redirect to signup with invite token in redirect param
      await expect(page).toHaveURL(new RegExp(`/signup\\?redirect=/invite/${inviteToken}`));
    });
  });

  test.describe('Email Invitations', () => {
    test('should send email invitation', async ({ page }) => {
      await signUpUser(page, 'emailinviteowner');
      await page.goto('/teams');

      // Create team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `email-invite-${Date.now()}`;
      await page.fill('input[name="name"]', 'Email Invite Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Go to members and open invite modal
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();

      // Switch to email tab
      await page.click('[data-tab="email"]');

      // Enter email address
      const inviteEmail = `invited-${Date.now()}@test.local`;
      await page.fill('#invite-email', inviteEmail);
      await page.keyboard.press('Enter'); // Create pill

      // Submit
      await page.click('#email-invite-form button[type="submit"]');

      // Should show success message
      await expect(page.locator('#email-invite-success')).toBeVisible();
    });

    test('should create email invitation with token for invite link', async ({ page }) => {
      await signUpUser(page, 'emailtoken');
      await page.goto('/teams');

      // Create team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `email-token-${Date.now()}`;
      await page.fill('input[name="name"]', 'Email Token Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Go to members and send email invite
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();
      await page.click('[data-tab="email"]');

      const inviteEmail = `tokentest-${Date.now()}@test.local`;
      await page.fill('#invite-email', inviteEmail);
      await page.keyboard.press('Enter');
      await page.click('#email-invite-form button[type="submit"]');
      await expect(page.locator('#email-invite-success')).toBeVisible();

      // Close modal and reload to see new invitation
      await page.click('[data-modal-close]');
      await page.reload();

      // Check invitation appears in list with a link
      await expect(page.locator(`text=${inviteEmail}`)).toBeVisible();

      // Click on the invitation to view details
      await page.click(`[data-invitation-email="${inviteEmail}"]`);

      // Should show invite URL (not the "no link" message)
      await expect(page.locator('#invitation-url-section')).toBeVisible();
      const inviteUrl = await page.locator('#invitation-url-input').inputValue();
      expect(inviteUrl).toContain('/invite/');
    });

    test('should allow accepting email invitation via link', async ({ browser }) => {
      // Owner creates team and sends email invite
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      await signUpUser(ownerPage, 'emailowner2');
      await ownerPage.goto('/teams');

      await ownerPage.locator('main button:has-text("Create Team")').click();
      const teamSlug = `email-accept-${Date.now()}`;
      const teamName = 'Email Accept Team';
      await ownerPage.fill('input[name="name"]', teamName);
      await ownerPage.fill('input[name="slug"]', teamSlug);
      await ownerPage.locator('#create-team-modal button[type="submit"]').click();
      await ownerPage.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Send email invite
      await ownerPage.goto(`/teams/${teamSlug}/members`);
      await ownerPage.getByRole('button', { name: 'Invite', exact: true }).click();
      await ownerPage.click('[data-tab="email"]');

      const inviteEmail = `accepttest-${Date.now()}@test.local`;
      await ownerPage.fill('#invite-email', inviteEmail);
      await ownerPage.keyboard.press('Enter');
      await ownerPage.click('#email-invite-form button[type="submit"]');
      await expect(ownerPage.locator('#email-invite-success')).toBeVisible();

      // Get invite URL from the invitation list
      await ownerPage.click('[data-modal-close]');
      await ownerPage.reload();
      await ownerPage.click(`[data-invitation-email="${inviteEmail}"]`);
      await expect(ownerPage.locator('#invitation-url-input')).toBeVisible();
      const inviteLink = await ownerPage.locator('#invitation-url-input').inputValue();

      await ownerContext.close();

      // Member signs up and accepts invite
      const memberContext = await browser.newContext();
      const memberPage = await memberContext.newPage();

      await signUpUser(memberPage, 'emailmember2');

      // Visit invite link
      await memberPage.goto(inviteLink);

      // Should show team name and accept button
      await expect(memberPage.locator(`text=${teamName}`)).toBeVisible();
      await expect(memberPage.locator('#accept-invite-btn')).toBeVisible();

      // Accept invite
      await memberPage.click('#accept-invite-btn');

      // Should redirect to team page
      await memberPage.waitForURL(new RegExp(`/teams/${teamSlug}`));
      await expect(memberPage.locator(`h1:has-text("${teamName}")`)).toBeVisible();

      await memberContext.close();
    });

    test('should allow resending email invitation', async ({ page }) => {
      await signUpUser(page, 'emailresend');
      await page.goto('/teams');

      // Create team
      await page.locator('main button:has-text("Create Team")').click();
      const teamSlug = `email-resend-${Date.now()}`;
      await page.fill('input[name="name"]', 'Email Resend Team');
      await page.fill('input[name="slug"]', teamSlug);
      await page.locator('#create-team-modal button[type="submit"]').click();
      await page.waitForURL(new RegExp(`/teams/${teamSlug}`));

      // Send email invite
      await page.goto(`/teams/${teamSlug}/members`);
      await page.getByRole('button', { name: 'Invite', exact: true }).click();
      await page.click('[data-tab="email"]');

      const inviteEmail = `resendtest-${Date.now()}@test.local`;
      await page.fill('#invite-email', inviteEmail);
      await page.keyboard.press('Enter');
      await page.click('#email-invite-form button[type="submit"]');
      await expect(page.locator('#email-invite-success')).toBeVisible();

      // Close modal, reload, and click on invitation
      await page.click('[data-modal-close]');
      await page.reload();
      await page.click(`[data-invitation-email="${inviteEmail}"]`);

      // Should show resend button for email invitations
      await expect(page.locator('#resend-invitation-btn')).toBeVisible();

      // Click resend
      await page.click('#resend-invitation-btn');

      // Should show success alert
      await expect(page.locator('text=Email Sent')).toBeVisible();
    });
  });
});
