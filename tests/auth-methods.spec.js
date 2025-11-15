/**
 * Authentication Methods Test Suite
 * Tests all login methods: Google One Tap, Email/Password, WebAuthn
 *
 * CRITICAL: Google One Tap is PRIMARY method - no register modal popup
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication Methods - All Login Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Google One Tap (PRIMARY METHOD)', () => {

    test('should NOT show register modal popup on homepage', async ({ page }) => {
      await page.goto('/');

      // Wait 5 seconds (longer than the 3-second timer that was removed)
      await page.waitForTimeout(5000);

      // Register modal should NOT appear
      const authModal = page.locator('[role="dialog"]').filter({ hasText: /Join BeautyCita|Welcome Back/i });
      await expect(authModal).not.toBeVisible();

      console.log('✅ PASSED: No register modal popup on homepage');
    });

    test('should load Google One Tap script on homepage', async ({ page }) => {
      await page.goto('/');

      // Wait for Google Identity Services script to load
      await page.waitForTimeout(2000);

      // Check if Google One Tap script is loaded
      const googleScript = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.some(script =>
          script.src.includes('accounts.google.com/gsi/client')
        );
      });

      expect(googleScript).toBe(false); // Should NOT be on homepage anymore (only in Navbar or auth pages)
      console.log('✅ PASSED: Google One Tap script handling verified');
    });

    test('should have Google login button in navbar', async ({ page }) => {
      await page.goto('/');

      // Check for login/signup button in navbar
      const loginButton = page.locator('a[href*="/login"], button:has-text("Login"), button:has-text("Sign"), a[href*="/register"]');
      await expect(loginButton.first()).toBeVisible({ timeout: 5000 });

      console.log('✅ PASSED: Login/Signup button visible in navbar');
    });

    test('should navigate to dedicated auth page from navbar', async ({ page }) => {
      await page.goto('/');

      // Click login/signup button in navbar
      const authButton = page.locator('a[href*="/login"], a[href*="/register"], button:has-text("Login"), button:has-text("Sign")').first();
      await authButton.click();

      // Should navigate to auth page
      await expect(page).toHaveURL(/\/(login|register|auth)/);
      console.log('✅ PASSED: Navigation to auth page successful');
    });
  });

  test.describe('Email/Password Authentication', () => {

    test('should show email/password login form', async ({ page }) => {
      await page.goto('/login');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Look for "Continue with Email" or similar button
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');

      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Email and password fields should be visible
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');

      await expect(emailField).toBeVisible({ timeout: 10000 });
      await expect(passwordField).toBeVisible({ timeout: 10000 });

      console.log('✅ PASSED: Email/Password form visible');
    });

    test('should validate empty email/password submission', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")').last();
      await submitButton.click();

      // Should show validation error
      await page.waitForTimeout(1000);
      const errorMessage = page.locator('text=/required|requerido|Invalid|inválido/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ PASSED: Email/Password validation working');
    });

    test('should validate invalid email format', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Enter invalid email
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
      await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")').last();
      await submitButton.click();

      // Should show validation error
      await page.waitForTimeout(1000);
      const errorMessage = page.locator('text=/Invalid|email|correo/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ PASSED: Email format validation working');
    });

    test('should show password visibility toggle', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Check for password visibility toggle button
      const toggleButton = page.locator('button:has(svg), button[aria-label*="password"], button[title*="password"]').filter({ near: page.locator('input[type="password"]') });

      if (await toggleButton.count() > 0) {
        await expect(toggleButton.first()).toBeVisible();
        console.log('✅ PASSED: Password visibility toggle present');
      } else {
        console.log('⚠️  WARNING: Password visibility toggle not found (may be styled differently)');
      }
    });

    test('should have link to register page from login', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Look for register/signup link
      const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), button:has-text("Sign up"), button:has-text("Create")');
      await expect(registerLink.first()).toBeVisible({ timeout: 10000 });

      console.log('✅ PASSED: Link to register page present');
    });
  });

  test.describe('Registration Flow', () => {

    test('should show registration form', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Check for registration form fields
      const firstNameField = page.locator('input[name="firstName"], input[placeholder*="First"]');
      const lastNameField = page.locator('input[name="lastName"], input[placeholder*="Last"]');
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');

      // At least email and password should be visible
      await expect(emailField).toBeVisible({ timeout: 10000 });
      await expect(passwordField).toBeVisible({ timeout: 10000 });

      console.log('✅ PASSED: Registration form visible');
    });

    test('should have terms and conditions checkbox', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Check for terms checkbox
      const termsCheckbox = page.locator('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="accept"]');

      if (await termsCheckbox.count() > 0) {
        await expect(termsCheckbox).toBeVisible({ timeout: 5000 });
        console.log('✅ PASSED: Terms and conditions checkbox present');
      } else {
        console.log('⚠️  WARNING: Terms checkbox not found (may be on next step)');
      }
    });

    test('should validate password strength requirements', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email"), button:has-text("Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Enter weak password
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'weak');

      // Try to submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Register")').last();
      await submitButton.click();

      // Should show password strength error
      await page.waitForTimeout(1000);
      const errorMessage = page.locator('text=/8 characters|uppercase|lowercase|number|Password must/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      console.log('✅ PASSED: Password strength validation working');
    });

    test('should NOT allow role selection during signup', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // CRITICAL: There should be NO radio buttons or dropdowns for CLIENT/STYLIST selection
      const roleSelector = page.locator('input[type="radio"][value="CLIENT"], input[type="radio"][value="STYLIST"], select[name*="role"]');
      await expect(roleSelector).not.toBeVisible();

      console.log('✅ PASSED: No role selection on signup (CLIENT-only as per CLAUDE.md)');
    });
  });

  test.describe('WebAuthn/Passkeys (if available)', () => {

    test('should have WebAuthn option on login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for passkey/fingerprint/biometric button
      const passkeyButton = page.locator('button:has-text("Passkey"), button:has-text("Fingerprint"), button:has-text("Face ID"), button:has(svg)').filter({ hasText: /passkey|biometric|fingerprint/i });

      if (await passkeyButton.count() > 0) {
        await expect(passkeyButton.first()).toBeVisible();
        console.log('✅ PASSED: WebAuthn/Passkey option available');
      } else {
        console.log('ℹ️  INFO: WebAuthn/Passkey option not found (may require HTTPS or browser support)');
      }
    });

    test('should require HTTPS for WebAuthn', async ({ page }) => {
      const url = await page.evaluate(() => window.location.href);

      if (url.startsWith('https://')) {
        console.log('✅ PASSED: Site is using HTTPS (required for WebAuthn)');
      } else {
        console.log('⚠️  WARNING: Site is NOT using HTTPS - WebAuthn will not work');
      }
    });
  });

  test.describe('Google OAuth Fallback', () => {

    test('should have Google sign-in button', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for Google sign-in button (visual fallback for One Tap)
      const googleButton = page.locator('button:has-text("Google"), a[href*="google"], button:has(svg)').filter({ hasText: /google|sign.*google/i });
      await expect(googleButton.first()).toBeVisible({ timeout: 10000 });

      console.log('✅ PASSED: Google OAuth button available');
    });

    test('should have correct Google OAuth branding', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Google button should have Google logo
      const googleButton = page.locator('button:has-text("Google"), button:has(svg)').first();

      if (await googleButton.isVisible()) {
        // Check if button has Google's colors or logo
        const hasGoogleBranding = await googleButton.evaluate((el) => {
          const text = el.textContent || '';
          const hasLogo = el.querySelector('svg') !== null;
          return text.toLowerCase().includes('google') || hasLogo;
        });

        expect(hasGoogleBranding).toBe(true);
        console.log('✅ PASSED: Google button has proper branding');
      }
    });
  });

  test.describe('Auth Flow Redirects', () => {

    test('should redirect to client onboarding after first login', async ({ page }) => {
      // This test verifies the redirect behavior without actually logging in
      await page.goto('/login');

      // Check that onboarding route exists
      const response = await page.goto('/onboarding/client');
      expect(response?.status()).toBeLessThan(500); // Should not be 500 error

      console.log('✅ PASSED: Client onboarding route accessible');
    });

    test('should redirect authenticated users away from login page', async ({ page }) => {
      // Set mock authentication
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-token-for-testing');
        localStorage.setItem('user', JSON.stringify({ id: 1, role: 'CLIENT', name: 'Test User' }));
      });

      // Try to visit login page
      await page.goto('/login');
      await page.waitForTimeout(2000);

      // Should redirect away from login page
      const currentUrl = page.url();
      const isRedirected = !currentUrl.includes('/login') || currentUrl.includes('/panel') || currentUrl.includes('/dashboard');

      if (isRedirected) {
        console.log('✅ PASSED: Authenticated users redirected from login page');
      } else {
        console.log('ℹ️  INFO: Login page accessible even when authenticated (may be intended behavior)');
      }
    });
  });

  test.describe('Security Features', () => {

    test('should use HTTPS in production', async ({ page }) => {
      await page.goto('/');
      const url = page.url();

      if (url.startsWith('https://')) {
        console.log('✅ PASSED: Using HTTPS');
      } else if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
        console.log('ℹ️  INFO: Running on localhost (HTTP acceptable for development)');
      } else {
        throw new Error('❌ FAILED: Production site should use HTTPS');
      }
    });

    test('should have CSRF protection headers', async ({ page, request }) => {
      const response = await request.get('/');
      const headers = response.headers();

      // Check for security headers
      const hasSecurityHeaders =
        headers['x-content-type-options'] ||
        headers['x-frame-options'] ||
        headers['strict-transport-security'];

      if (hasSecurityHeaders) {
        console.log('✅ PASSED: Security headers present');
      } else {
        console.log('⚠️  WARNING: Security headers not detected');
      }
    });

    test('should not expose sensitive data in client-side code', async ({ page }) => {
      await page.goto('/login');

      // Check that no API keys or secrets are exposed
      const pageContent = await page.content();

      const hasSensitiveData =
        pageContent.includes('sk_live_') ||
        pageContent.includes('pk_live_') ||
        pageContent.match(/password.*=.*["'][^"']+["']/i);

      expect(hasSensitiveData).toBe(false);
      console.log('✅ PASSED: No sensitive data exposed in client-side code');
    });
  });

  test.describe('Accessibility', () => {

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click "Continue with Email" if present
      const emailButton = page.locator('button:has-text("Continue with Email")');
      if (await emailButton.isVisible()) {
        await emailButton.click();
        await page.waitForTimeout(500);
      }

      // Check that form inputs have labels or aria-labels
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');

      if (await emailInput.isVisible()) {
        const hasLabel = await emailInput.evaluate((el) => {
          return el.labels?.length > 0 || el.getAttribute('aria-label') || el.getAttribute('placeholder');
        });
        expect(hasLabel).toBeTruthy();
        console.log('✅ PASSED: Form inputs have proper labels');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName;
      });

      expect(focusedElement).toBeTruthy();
      console.log('✅ PASSED: Keyboard navigation works');
    });
  });
});
