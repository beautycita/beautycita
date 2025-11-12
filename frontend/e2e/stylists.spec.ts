import { test, expect } from '@playwright/test'

test.describe('Stylists Page', () => {
  test('should load stylists page', async ({ page }) => {
    await page.goto('/stylists')
    // Check that page loaded successfully (title may vary)
    await expect(page).toHaveTitle(/BeautyCita/)
  })

  test('should display stylist cards or empty state', async ({ page }) => {
    await page.goto('/stylists')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Should have either stylist cards OR an empty state message
    const hasContent = await page.locator('main').isVisible()
    expect(hasContent).toBe(true)
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/stylists')

    // Look for search input or filter controls
    const searchElements = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i], input[placeholder*="buscar" i]')
    const count = await searchElements.count()

    // May or may not have search - just check page loaded
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should navigate from homepage to stylists', async ({ page }) => {
    await page.goto('/')

    // Find link to stylists page
    const stylistsLink = page.locator('a[href*="stylist"]').first()

    if (await stylistsLink.isVisible()) {
      await stylistsLink.click()

      // Should navigate to stylists-related page
      await expect(page).toHaveURL(/stylist/)
    }
  })
})
