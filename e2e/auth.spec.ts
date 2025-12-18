import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show home page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Story Poker')).toBeVisible();
    await expect(page.locator('text=Get Started Free')).toBeVisible();
  });

  test('should redirect unauthenticated users from profile to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toHaveText('Story Poker');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('h1')).toHaveText('Story Poker');
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm-password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Create account');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL('/signup');

    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('#error-message')).toBeVisible();
  });

  test('should show error for mismatched passwords on signup', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm-password"]', 'differentpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('#error-message')).toHaveText('Passwords do not match');
  });

  test('should require email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Browser validation should prevent submission
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});
