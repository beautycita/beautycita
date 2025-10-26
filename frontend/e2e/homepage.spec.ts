import { test, expect } from '@playwright/test'

test.describe('HomePage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BeautyCita/)
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check navbar links exist
    await expect(page.locator('nav')).toBeVisible()
    
    // Test key navigation items
    const homeLink = page.getByRole('link', { name: /inicio|home/i })
    await expect(homeLink).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')
    
    // Hero section should be visible
    const hero = page.locator('[class*=hero]').first()
    await expect(hero).toBeVisible()
  })

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/')
    
    // Look for main CTA buttons
    const ctaButtons = page.getByRole('button', { name: /reservar|book|comenzar|get started/i })
    await expect(ctaButtons.first()).toBeVisible()
  })
})
