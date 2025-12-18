import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.describe('Unauthenticated', () => {
    test('should display landing page content', async ({ page }) => {
      await page.goto('/');

      // Header
      await expect(page.locator('text=Story Poker').first()).toBeVisible();

      // Hero section
      await expect(page.locator('text=Estimate stories')).toBeVisible();
      await expect(page.locator('span.text-indigo-400:has-text("together")')).toBeVisible();
      await expect(page.locator('text=A simple, real-time planning poker tool')).toBeVisible();

      // CTAs for guests
      await expect(page.locator('text=Get Started Free')).toBeVisible();
      await expect(page.locator('a.px-8:has-text("Sign In")')).toBeVisible();

      // Features section
      await expect(page.locator('text=How it works')).toBeVisible();
      await expect(page.locator('text=Create a Room')).toBeVisible();
      await expect(page.locator('text=Vote Together')).toBeVisible();
      await expect(page.locator('text=Reveal & Discuss')).toBeVisible();
    });

    test('should show sign in and sign up links in navigation', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('nav a:has-text("Sign in")')).toBeVisible();
      await expect(page.locator('nav a:has-text("Sign up")')).toBeVisible();
    });

    test('should navigate to signup from Get Started button', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Get Started Free');
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate to login from Sign In button', async ({ page }) => {
      await page.goto('/');
      await page.click('a.px-8:has-text("Sign In")');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Authenticated', () => {
    const testPassword = 'TestPassword123!';

    test('should show Create Room and Join Room buttons when logged in', async ({ page }) => {
      const email = `testhome${Date.now()}@test.com`;

      // Sign up
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirm-password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Check authenticated home page
      await expect(page.locator('text=Create Room')).toBeVisible();
      await expect(page.locator('text=Join Room')).toBeVisible();

      // Should NOT show guest CTAs
      await expect(page.locator('text=Get Started Free')).not.toBeVisible();
    });

    test('should show user menu dropdown when logged in', async ({ page }) => {
      const email = `testnav${Date.now()}@test.com`;

      // Sign up
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirm-password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Should see user menu button
      const menuButton = page.locator('#user-menu-button');
      await expect(menuButton).toBeVisible();

      // Should NOT show sign in/up links
      await expect(page.locator('nav a:has-text("Sign in")')).not.toBeVisible();
      await expect(page.locator('nav a:has-text("Sign up")')).not.toBeVisible();
    });

    test('should open dropdown and navigate to profile', async ({ page }) => {
      const email = `testdropdown${Date.now()}@test.com`;

      // Sign up
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirm-password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Click user menu button to open dropdown
      await page.click('#user-menu-button');

      // Dropdown should be visible
      const dropdown = page.locator('#user-dropdown');
      await expect(dropdown).toBeVisible();

      // Click profile link
      await page.click('#user-dropdown a[href="/profile"]');
      await expect(page).toHaveURL('/profile');
    });

    test('should sign out from dropdown menu', async ({ page }) => {
      const email = `testsignout${Date.now()}@test.com`;

      // Sign up
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirm-password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Click user menu button to open dropdown
      await page.click('#user-menu-button');

      // Click sign out
      await page.click('#user-dropdown button[type="submit"]');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should close dropdown when clicking outside', async ({ page }) => {
      const email = `testclose${Date.now()}@test.com`;

      // Sign up
      await page.goto('/signup');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirm-password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      // Open dropdown
      await page.click('#user-menu-button');
      await expect(page.locator('#user-dropdown')).toBeVisible();

      // Click outside
      await page.click('body', { position: { x: 10, y: 10 } });

      // Dropdown should be hidden
      await expect(page.locator('#user-dropdown')).not.toBeVisible();
    });
  });
});
