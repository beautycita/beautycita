import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    // Click login button/link
    const loginButton = page.getByRole('link', { name: /iniciar sesión|login|sign in/i })
    await loginButton.click()
    
    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    
    // Form should have email and password fields
    await expect(page.getByLabel(/email|correo/i)).toBeVisible()
    await expect(page.getByLabel(/password|contraseña/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /iniciar sesión|login|sign in/i })).toBeVisible()
  })

  test('should validate empty form submission', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/required|requerido|obligatorio/i).first()).toBeVisible()
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
