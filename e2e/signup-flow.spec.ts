import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './helpers/auth';
import { waitForEmail, extractVerificationLink } from './helpers/mailpit';

test.describe('Full Signup Flow', () => {
  const testPassword = 'TestPassword123!';

  test('should complete full signup and email verification flow', async ({ page }) => {
    const testEmail = `test${Date.now()}@test.com`;
    const displayName = 'Test User';

    // Step 1: Go to signup page
    await page.goto('/signup');
    await expect(page.locator('h1')).toHaveText('Sakiyomi');

    // Step 2: Fill out signup form
    await page.fill('input[name="display-name"]', displayName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);

    // Step 3: Submit signup
    await page.click('button[type="submit"]');

    // Step 4: Should see success message about checking email
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#success-message')).toContainText('Check your email');

    // Step 5: Wait for verification email
    const email = await waitForEmail(testEmail, {
      timeout: 30000,
      subject: 'Confirm',
    });

    expect(email).toBeTruthy();
    expect(email.Subject.toLowerCase()).toContain('confirm');

    // Step 6: Extract and visit verification link
    const verificationLink = extractVerificationLink(email);
    expect(verificationLink).toBeTruthy();

    await page.goto(verificationLink!);

    // Step 7: After verification, should be able to login
    await page.waitForURL(/\/(login)?/, { timeout: 10000 });

    // If redirected to login, sign in
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Step 8: Should now be logged in
    await expect(page.locator('text=Create Room')).toBeVisible();

    // Step 9: Display name should appear in the header
    await expect(page.locator('#user-menu-button')).toContainText(displayName);
  });

  test('should show error for unverified login attempt', async ({ page }) => {
    const testEmail = `unverified${Date.now()}@test.com`;

    // Sign up but don't verify
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });

    // Try to login without verifying
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show error about email not confirmed
    await expect(page.locator('#error-message')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('#error-message').textContent();
    expect(errorText?.toLowerCase()).toContain('confirm');
  });

  test('should complete full signup, login, and profile flow', async ({ page }) => {
    // Use the verified signup helper
    const email = await signUpAndVerify(page, 'testfull');

    // Should be logged in on home page
    await expect(page.locator('text=Create Room')).toBeVisible();

    // Open user menu and navigate to profile
    await page.click('#user-menu-button');
    await page.click('#user-dropdown a[href="/profile"]');
    await expect(page).toHaveURL('/profile');
    await expect(page.locator(`main:has-text("${email}")`)).toBeVisible();

    // Sign out from profile
    await page.locator('main button:has-text("Sign Out")').click();
    await expect(page).toHaveURL(/\/login(\?redirect=.*)?/);

    // Login again
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should be back on home page
    await page.waitForURL('/');
    await expect(page.locator('text=Create Room')).toBeVisible();
  });
});
