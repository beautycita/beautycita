import { test, expect } from '@playwright/test'

test.describe('Stylists Page', () => {
  test('should load stylists page', async ({ page }) => {
    await page.goto('/stylists')
    await expect(page).toHaveTitle(/Estilistas|Stylists/)
  })

  test('should display stylist cards', async ({ page }) => {
    await page.goto('/stylists')
    
    // Wait for stylists to load
    await page.waitForLoadState('networkidle')
    
    // Should have at least one stylist card (or empty state)
    const stylistCards = page.locator('[class*=stylist-card], [class*=card]')
    const emptyState = page.getByText(/no stylists|no estilistas/i)
    
    await expect(
      stylistCards.first().or(emptyState)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/stylists')
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/buscar|search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should navigate to stylist profile', async ({ page }) => {
    await page.goto('/stylists')
    await page.waitForLoadState('networkidle')
    
    // Click first stylist card
    const firstStylist = page.locator('[class*=stylist-card]').first()
    if (await firstStylist.isVisible()) {
      await firstStylist.click()
      
      // Should navigate to profile page
      await expect(page).toHaveURL(/\/stylist\/\d+/)
    }
  })
})
