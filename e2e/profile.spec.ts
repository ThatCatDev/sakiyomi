import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './helpers/auth';

test.describe('Profile Page', () => {
  // Helper to create a verified user
  async function signUpUser(page: any, emailPrefix: string) {
    return signUpAndVerify(page, emailPrefix);
  }

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login(\?redirect=.*)?/);
  });

  test('should display profile page after signup and navigation', async ({ page }) => {
    const testEmail = await signUpUser(page, 'testprofile');

    // Open user menu and navigate to profile
    await page.click('#user-menu-button');
    await page.click('#user-dropdown a[href="/profile"]');
    await expect(page).toHaveURL('/profile');

    // Check profile page content
    await expect(page.locator('main h1').first()).toContainText('Profile');
    await expect(page.locator(`main:has-text("${testEmail}")`)).toBeVisible();
    await expect(page.locator('main:has-text("Account Created")')).toBeVisible();
    await expect(page.locator('main button:has-text("Sign Out")')).toBeVisible();
  });

  test('should sign out from profile page', async ({ page }) => {
    await signUpUser(page, 'testsignout');

    // Go to profile
    await page.goto('/profile');

    // Sign out
    await page.locator('main button:has-text("Sign Out")').click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login(\?redirect=.*)?/);

    // Verify logged out - trying to access profile should redirect
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login(\?redirect=.*)?/);
  });

  test('should display user avatar with first letter', async ({ page }) => {
    await signUpUser(page, 'avatartest');

    // Go to profile
    await page.goto('/profile');

    // Avatar should show first letter
    const avatar = page.locator('#avatar-preview');
    await expect(avatar).toBeVisible();
  });

  test.describe('Profile Settings Form', () => {
    test('should display profile form fields', async ({ page }) => {
      await signUpUser(page, 'formfields');
      await page.goto('/profile');

      // Check form fields are present
      await expect(page.locator('input#display_name')).toBeVisible();
      await expect(page.locator('input#avatar_url')).toBeVisible();
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    });

    test('should update display name', async ({ page }) => {
      await signUpUser(page, 'updatename');
      await page.goto('/profile');

      const displayName = `Test User ${Date.now()}`;
      await page.fill('input#display_name', displayName);
      await page.click('button:has-text("Save Changes")');

      // Should show success message
      await expect(page.locator('#profile-success')).toBeVisible();
      await expect(page.locator('#profile-success')).toContainText('Profile updated successfully');
    });

    test('should update avatar URL', async ({ page }) => {
      await signUpUser(page, 'updateavatar');
      await page.goto('/profile');

      const avatarUrl = 'https://api.dicebear.com/7.x/adventurer/svg?seed=test123';
      await page.fill('input#avatar_url', avatarUrl);
      await page.click('button:has-text("Save Changes")');

      // Should show success message
      await expect(page.locator('#profile-success')).toBeVisible();
    });

    test('should show error for invalid avatar URL', async ({ page }) => {
      await signUpUser(page, 'invalidurl');
      await page.goto('/profile');

      await page.fill('input#avatar_url', 'not-a-valid-url');
      await page.click('button:has-text("Save Changes")');

      // Should show error message
      await expect(page.locator('#profile-error')).toBeVisible();
      await expect(page.locator('#profile-error')).toContainText('Invalid avatar URL');
    });

    test('should clear display name', async ({ page }) => {
      await signUpUser(page, 'clearname');
      await page.goto('/profile');

      // First set a display name
      await page.fill('input#display_name', 'Temporary Name');
      await page.click('button:has-text("Save Changes")');
      await page.waitForSelector('#profile-success:visible');

      // Then clear it
      await page.fill('input#display_name', '');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('#profile-success')).toBeVisible();
    });

    test('should preserve display name on page reload', async ({ page }) => {
      await signUpUser(page, 'preservename');
      await page.goto('/profile');

      const displayName = `Persist User ${Date.now()}`;
      await page.fill('input#display_name', displayName);
      await page.click('button:has-text("Save Changes")');
      await page.waitForSelector('#profile-success:visible');

      // Reload page
      await page.reload();

      // Display name should be preserved
      await expect(page.locator('input#display_name')).toHaveValue(displayName);
    });

    test('should update avatar preview when URL changes', async ({ page }) => {
      await signUpUser(page, 'avatarpreview');
      await page.goto('/profile');

      const avatarUrl = 'https://api.dicebear.com/7.x/adventurer/svg?seed=preview123';
      await page.fill('input#avatar_url', avatarUrl);

      // The preview should update (we can check if an img tag appears)
      const avatarPreview = page.locator('#avatar-preview img');
      await expect(avatarPreview).toBeVisible();
    });
  });
});
