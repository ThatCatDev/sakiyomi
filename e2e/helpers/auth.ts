/**
 * Auth testing helper
 * Provides verified user signup for e2e tests with email confirmation enabled
 */

import type { Page } from '@playwright/test';
import { waitForEmail, extractVerificationLink } from './mailpit';

const TEST_PASSWORD = 'TestPassword123!';

/**
 * Sign up a user and verify their email
 * Returns the test email address
 */
export async function signUpAndVerify(
  page: Page,
  emailPrefix: string
): Promise<string> {
  const testEmail = `${emailPrefix}${Date.now()}@test.com`;

  // Go to signup page
  await page.goto('/signup');

  // Fill out signup form
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.fill('input[name="confirm-password"]', TEST_PASSWORD);

  // Submit signup
  await page.click('button[type="submit"]');

  // Wait for success message about checking email
  await page.waitForSelector('#success-message', { timeout: 10000 });

  // Wait for verification email
  const email = await waitForEmail(testEmail, {
    timeout: 30000,
    subject: 'Confirm',
  });

  // Extract and visit verification link
  const verificationLink = extractVerificationLink(email);
  if (!verificationLink) {
    throw new Error('Could not extract verification link from email');
  }

  await page.goto(verificationLink);

  // Wait for redirect to complete - middleware handles PKCE code exchange
  await page.waitForURL('/', { timeout: 10000 });

  // If redirected to login (shouldn't happen with working middleware), sign in
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  }

  return testEmail;
}

/**
 * Sign up a user without verification (for testing unverified user scenarios)
 * Returns the test email address
 */
export async function signUpWithoutVerify(
  page: Page,
  emailPrefix: string
): Promise<string> {
  const testEmail = `${emailPrefix}${Date.now()}@test.com`;

  await page.goto('/signup');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.fill('input[name="confirm-password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for success message
  await page.waitForSelector('#success-message', { timeout: 10000 });

  return testEmail;
}

export { TEST_PASSWORD };
