import { test, expect } from '@playwright/test';
import { waitForEmail, extractVerificationLink } from './helpers/mailpit';

test.describe('Email Verification', () => {
  const testPassword = 'TestPassword123!';

  test('should send verification email on signup and allow verification', async ({ page }) => {
    const testEmail = `verify${Date.now()}@test.com`;

    // Go to signup page
    await page.goto('/signup');
    await expect(page.locator('h1')).toContainText('Sakiyomi');

    // Fill out signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);

    // Submit signup
    await page.click('button[type="submit"]');

    // Should show success message about checking email
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#success-message')).toContainText('Check your email');

    // Wait for verification email
    const email = await waitForEmail(testEmail, {
      timeout: 30000,
      subject: 'Confirm',
    });

    expect(email).toBeTruthy();
    expect(email.Subject.toLowerCase()).toContain('confirm');

    // Extract verification link
    const verificationLink = extractVerificationLink(email);
    expect(verificationLink).toBeTruthy();
    console.log('Verification link:', verificationLink);

    // Visit verification link
    await page.goto(verificationLink!);

    // After verification, user should be redirected and logged in
    // Wait for redirect to complete
    await page.waitForURL(/\/(login)?/, { timeout: 10000 });

    // If redirected to login, sign in
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Should now be on home page and logged in
    await expect(page.locator('text=Create Room')).toBeVisible({ timeout: 10000 });
  });

  test('should not allow login before email verification', async ({ page }) => {
    const testEmail = `noverify${Date.now()}@test.com`;

    // Sign up
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });

    // Try to login without verifying email
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show error about email not confirmed
    await expect(page.locator('#error-message')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('#error-message').textContent();
    expect(errorText?.toLowerCase()).toContain('confirm');
  });

  test('should send password reset email', async ({ page }) => {
    const testEmail = `reset${Date.now()}@test.com`;

    // First create and verify an account
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirm-password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for and verify email
    await expect(page.locator('#success-message')).toBeVisible({ timeout: 10000 });
    const verifyEmail = await waitForEmail(testEmail, { subject: 'Confirm' });
    const verifyLink = extractVerificationLink(verifyEmail);
    await page.goto(verifyLink!);

    // Wait for page to load after verification redirect
    await page.waitForLoadState('networkidle');

    // Sign out if logged in
    await page.goto('/');
    const userMenuButton = page.locator('#user-menu-button');
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.click('button:has-text("Sign Out")');
      await page.waitForURL(/\/login/);
    }

    // Go to forgot password page
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should show success container (not #success-message)
    await expect(page.locator('#success-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#success-container')).toContainText('Check your email');

    // Wait for reset email
    const resetEmail = await waitForEmail(testEmail, {
      timeout: 30000,
      subject: 'Reset',
    });

    expect(resetEmail).toBeTruthy();
    expect(resetEmail.Subject.toLowerCase()).toContain('reset');

    // Extract reset link
    const resetLink = extractVerificationLink(resetEmail);
    expect(resetLink).toBeTruthy();
    console.log('Reset link:', resetLink);
  });
});
