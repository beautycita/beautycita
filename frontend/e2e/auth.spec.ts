import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Click login button/link in navbar
    const loginButton = page.locator('a[href*="login"]').first()
    await loginButton.click()

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login|\/auth/)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')

    // Click to expand password form
    await page.getByText(/or sign in with email & password/i).click()

    // Wait for form to expand
    await page.waitForTimeout(500)

    // Form should have email and password fields (use name attribute for specificity)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()

    // Submit button should be visible  
    await expect(page.getByRole('button', { name: /sign in|iniciar/i }).last()).toBeVisible()
  })

  test('should validate empty form submission', async ({ page }) => {
    await page.goto('/login')

    // Expand password form
    await page.getByText(/or sign in with email & password/i).click()
    await page.waitForTimeout(1000)

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|iniciar/i }).last()
    await submitButton.click()

    // Wait for validation to trigger
    await page.waitForTimeout(500)

    // Should show validation errors (Email is required, Password is required, etc.)
    const errorMessage = page.getByText(/required|requerido|requerida|obligatorio/i).first()
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')

    // Click register link
    const registerLink = page.getByRole('link', { name: /registrar|register|sign up/i })
    await registerLink.click()

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/)
  })
})
