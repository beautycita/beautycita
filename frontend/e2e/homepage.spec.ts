import { test, expect } from '@playwright/test'

test.describe('HomePage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BeautyCita/)
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // Check navbar exists
    await expect(page.locator('nav')).toBeVisible()

    // Check for navigation links (case-insensitive)
    const hasNavLinks = await page.locator('nav a').count()
    expect(hasNavLinks).toBeGreaterThan(0)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    // Hero section should contain main heading with app name
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/')

    // Look for main CTA buttons or links
    const ctaElements = page.locator('a, button').filter({ hasText: /reservar|book|comenzar|get started|find|buscar/i })
    await expect(ctaElements.first()).toBeVisible()
  })
})
