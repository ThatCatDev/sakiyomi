import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  const testEmail = `testprofile${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
  });

  test('should display profile page after signup and navigation', async ({ page }) => {
    // Sign up first
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('/');

    // Open user menu and navigate to profile
    await page.click('#user-menu-button');
    await page.click('#user-dropdown a[href="/profile"]');
    await expect(page).toHaveURL('/profile');

    // Check profile page content
    await expect(page.locator('h1').first()).toHaveText('Profile');
    await expect(page.locator('text=Manage your account settings')).toBeVisible();
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();
    await expect(page.locator('text=Account Created')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
    await expect(page.locator('text=Back to Home')).toBeVisible();
  });

  test('should navigate back to home from profile', async ({ page }) => {
    const email = `testback${Date.now()}@test.com`;

    // Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Go to profile
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');

    // Click back to home
    await page.click('text=Back to Home');
    await expect(page).toHaveURL('/');
  });

  test('should sign out from profile page', async ({ page }) => {
    const email = `testsignout${Date.now()}@test.com`;

    // Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Go to profile
    await page.goto('/profile');

    // Sign out
    await page.click('button:has-text("Sign out")');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Verify logged out - trying to access profile should redirect
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
  });

  test('should display user avatar with first letter of email', async ({ page }) => {
    const email = `avatartest${Date.now()}@test.com`;

    // Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Go to profile
    await page.goto('/profile');

    // Avatar should show 'A' (first letter of 'avatartest')
    const avatar = page.locator('.bg-indigo-600.rounded-full');
    await expect(avatar).toContainText('A');
  });
});
