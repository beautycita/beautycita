// BeautyCita Design System Extraction Tests
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Create results directory
const resultsDir = path.join(__dirname, '../test-results/design-system');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

test.describe('Design System Extraction', () => {

  test('Extract colors from homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(resultsDir, 'homepage-desktop.png'),
      fullPage: true
    });

    // Extract button colors
    const primaryButton = page.locator('button').first();
    if (await primaryButton.count() > 0) {
      const buttonStyles = await primaryButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily
        };
      });

      console.log('Primary Button Styles:', buttonStyles);

      // Save to file
      fs.writeFileSync(
        path.join(resultsDir, 'button-styles.json'),
        JSON.stringify(buttonStyles, null, 2)
      );
    }

    // Extract heading typography
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      const h1Styles = await h1.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight,
          color: styles.color,
          letterSpacing: styles.letterSpacing
        };
      });

      console.log('H1 Styles:', h1Styles);

      fs.writeFileSync(
        path.join(resultsDir, 'h1-styles.json'),
        JSON.stringify(h1Styles, null, 2)
      );
    }

    // Extract brand colors from gradients
    const gradientElements = await page.locator('[style*="gradient"]').all();
    const gradients = [];

    for (const el of gradientElements) {
      const style = await el.getAttribute('style');
      if (style && style.includes('gradient')) {
        gradients.push(style);
      }
    }

    console.log('Gradients found:', gradients.length);
    fs.writeFileSync(
      path.join(resultsDir, 'gradients.json'),
      JSON.stringify(gradients, null, 2)
    );

    // Extract navbar design
    const navbar = page.locator('nav').first();
    if (await navbar.count() > 0) {
      await navbar.screenshot({
        path: path.join(resultsDir, 'navbar.png')
      });

      const navStyles = await navbar.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          height: styles.height,
          padding: styles.padding,
          boxShadow: styles.boxShadow
        };
      });

      console.log('Navbar Styles:', navStyles);
      fs.writeFileSync(
        path.join(resultsDir, 'navbar-styles.json'),
        JSON.stringify(navStyles, null, 2)
      );
    }
  });

  test('Extract card component styles', async ({ page }) => {
    await page.goto('/stylists');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(resultsDir, 'stylists-page.png'),
      fullPage: true
    });

    // Find card components (likely has class with 'card' or specific structure)
    const cards = page.locator('[class*="card"], [class*="Card"]').first();

    if (await cards.count() > 0) {
      await cards.screenshot({
        path: path.join(resultsDir, 'card-component.png')
      });

      const cardStyles = await cards.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          boxShadow: styles.boxShadow,
          margin: styles.margin,
          border: styles.border
        };
      });

      console.log('Card Styles:', cardStyles);
      fs.writeFileSync(
        path.join(resultsDir, 'card-styles.json'),
        JSON.stringify(cardStyles, null, 2)
      );
    }
  });

  test('Extract input field styles', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(resultsDir, 'login-page.png')
    });

    const input = page.locator('input[type="email"], input[type="text"]').first();

    if (await input.count() > 0) {
      const inputStyles = await input.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          border: styles.border,
          fontSize: styles.fontSize,
          color: styles.color,
          height: styles.height
        };
      });

      console.log('Input Styles:', inputStyles);
      fs.writeFileSync(
        path.join(resultsDir, 'input-styles.json'),
        JSON.stringify(inputStyles, null, 2)
      );

      // Test focus state
      await input.focus();
      await page.waitForTimeout(500);

      const inputFocusStyles = await input.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          borderColor: styles.borderColor,
          outline: styles.outline,
          boxShadow: styles.boxShadow
        };
      });

      console.log('Input Focus Styles:', inputFocusStyles);
      fs.writeFileSync(
        path.join(resultsDir, 'input-focus-styles.json'),
        JSON.stringify(inputFocusStyles, null, 2)
      );
    }
  });

  test('Extract color palette from CSS', async ({ page }) => {
    await page.goto('/');

    // Get all computed colors from the page
    const colors = await page.evaluate(() => {
      const colorSet = new Set();
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);

        // Collect colors
        if (styles.color) colorSet.add(styles.color);
        if (styles.backgroundColor) colorSet.add(styles.backgroundColor);
        if (styles.borderColor) colorSet.add(styles.borderColor);
      });

      return Array.from(colorSet);
    });

    console.log('Total unique colors found:', colors.length);

    // Convert RGB to HEX
    const rgbToHex = (rgb) => {
      const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (!match) return rgb;

      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);

      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const hexColors = colors
      .filter(c => c.startsWith('rgb'))
      .map(c => ({ rgb: c, hex: rgbToHex(c) }));

    fs.writeFileSync(
      path.join(resultsDir, 'color-palette.json'),
      JSON.stringify(hexColors, null, 2)
    );
  });
});
