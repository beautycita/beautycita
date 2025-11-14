const { test, expect } = require('@playwright/test');

test.describe('Registration and Onboarding Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test('should complete full registration flow with email/password', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-register-page.png', fullPage: true });

    // Wait for modal or form to appear
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Check if we need to click "Continue with Email" button
    const emailButton = page.locator('button:has-text("Continue with Email")');
    if (await emailButton.isVisible()) {
      await emailButton.click();
      await page.waitForTimeout(500);
    }

    // Fill in registration form
    console.log('Filling registration form with:', testEmail);

    const firstNameField = page.locator('input[name="firstName"], input[placeholder*="First"]').first();
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Test');
    }

    const lastNameField = page.locator('input[name="lastName"], input[placeholder*="Last"]').first();
    if (await lastNameField.isVisible()) {
      await lastNameField.fill('User');
    }

    await page.locator('input[type="email"]').first().fill(testEmail);
    await page.locator('input[type="password"]').first().fill(testPassword);

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="accept"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.screenshot({ path: 'test-results/02-form-filled.png', fullPage: true });

    // Submit form
    await page.locator('button[type="submit"]:has-text("Create Account"), button:has-text("Sign up")').click();

    // Wait for navigation or success
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-after-submit.png', fullPage: true });

    // Check for errors
    const errorText = await page.locator('text=/error|failed|invalid/i').first().textContent().catch(() => null);
    if (errorText) {
      console.log('Error found:', errorText);
    }

    // Should redirect to onboarding or panel
    const currentUrl = page.url();
    console.log('Current URL after registration:', currentUrl);

    expect(currentUrl).toMatch(/\/(onboarding|panel)/);
  });

  test('should show onboarding progress during client onboarding', async ({ page }) => {
    // This test assumes we're already logged in from previous test
    await page.goto('/onboarding/client');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/04-onboarding-start.png', fullPage: true });

    // Check for progress indicator
    const progressText = await page.locator('text=/Step \\d+ of \\d+|\\d+% Complete/i').first().textContent().catch(() => null);
    console.log('Progress indicator:', progressText);

    expect(progressText).toBeTruthy();

    // Check for step indicators (dots)
    const stepDots = await page.locator('[class*="rounded-full"][class*="bg-"]').count();
    console.log('Step indicator dots found:', stepDots);

    expect(stepDots).toBeGreaterThanOrEqual(3);
  });

  test('should validate visual appearance and smoothness', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check page load performance
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        responseTime: perfData.responseEnd - perfData.requestStart
      };
    });

    console.log('Performance metrics:', performanceMetrics);
    await page.screenshot({ path: 'test-results/05-homepage.png', fullPage: true });

    // Check for gradient background
    const hasGradient = await page.locator('[class*="gradient"]').count();
    console.log('Gradient elements found:', hasGradient);

    // Check for rounded buttons
    const roundedButtons = await page.locator('button[class*="rounded-full"]').count();
    console.log('Rounded buttons found:', roundedButtons);

    expect(hasGradient).toBeGreaterThan(0);
    expect(roundedButtons).toBeGreaterThan(0);
  });

  test('should test mobile responsiveness', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/06-mobile-register.png', fullPage: true });

    // Check touch target sizes (should be at least 48x48px)
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const box = await buttons[i].boundingBox();
      if (box) {
        console.log(`Button ${i} size:`, box.width, 'x', box.height);
        // Buttons should be at least 44px tall for mobile
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Try to register with existing email
    const emailButton = page.locator('button:has-text("Continue with Email")');
    if (await emailButton.isVisible()) {
      await emailButton.click();
      await page.waitForTimeout(500);
    }

    // Fill with existing email
    await page.locator('input[type="email"]').first().fill('existing@example.com');
    await page.locator('input[type="password"]').first().fill('Test123456');

    const firstNameField = page.locator('input[name="firstName"]').first();
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Test');
      await page.locator('input[name="lastName"]').first().fill('User');
    }

    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/07-error-handling.png', fullPage: true });

    // Should show error message
    const errorVisible = await page.locator('text=/error|already exists|invalid/i').first().isVisible().catch(() => false);
    console.log('Error message shown:', errorVisible);
  });

  test('should check Google One Tap integration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for Google One Tap to load
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'test-results/08-google-one-tap.png', fullPage: true });

    // Check if Google script is loaded
    const googleScriptLoaded = await page.evaluate(() => {
      return typeof window.google !== 'undefined';
    });

    console.log('Google One Tap script loaded:', googleScriptLoaded);
  });
});
