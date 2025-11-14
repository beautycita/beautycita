// BeautyCita Mobile Device Testing
const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../test-results/mobile');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

test.use({ ...devices['iPhone 12 Pro'] });

test.describe('Mobile Device Testing', () => {

  test('Homepage mobile responsiveness', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(resultsDir, 'homepage-mobile.png'),
      fullPage: true
    });

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390);

    // Check mobile menu exists
    const mobileMenu = page.locator('[aria-label="Open menu"], button:has-text("Menu")');
    expect(await mobileMenu.count()).toBeGreaterThan(0);

    // Check touch targets are appropriate size (min 48px)
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();

    let smallButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box && (box.height < 44 || box.width < 44)) {
        smallButtons++;
      }
    }

    console.log(`Small touch targets found: ${smallButtons}/${Math.min(buttonCount, 10)}`);

    // Test results
    const results = {
      page: 'HomePage',
      viewport: viewport,
      mobileMenuPresent: await mobileMenu.count() > 0,
      buttonsChecked: Math.min(buttonCount, 10),
      smallButtonsFound: smallButtons,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(resultsDir, 'homepage-mobile.json'),
      JSON.stringify(results, null, 2)
    );
  });

  test('Mobile navigation menu functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click mobile menu button
    const menuButton = page.locator('button').filter({ hasText: /menu|☰/i }).first();

    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(resultsDir, 'mobile-menu-open.png')
      });

      // Check if menu items are visible
      const menuLinks = page.locator('nav a, [role="navigation"] a');
      const visibleLinks = await menuLinks.count();

      console.log(`Mobile menu links visible: ${visibleLinks}`);

      // Try clicking a link
      if (visibleLinks > 0) {
        const firstLink = menuLinks.first();
        const href = await firstLink.getAttribute('href');
        console.log(`First menu link: ${href}`);
      }

      fs.writeFileSync(
        path.join(resultsDir, 'mobile-menu.json'),
        JSON.stringify({
          menuButtonFound: true,
          menuLinksCount: visibleLinks,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    }
  });

  test('Login page mobile experience', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(resultsDir, 'login-mobile.png'),
      fullPage: true
    });

    // Check form inputs are touch-friendly
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const emailBox = await emailInput.boundingBox();
    const passwordBox = await passwordInput.boundingBox();

    // Check input height is at least 44px (iOS guideline)
    const emailHeight = emailBox?.height || 0;
    const passwordHeight = passwordBox?.height || 0;

    console.log(`Email input height: ${emailHeight}px`);
    console.log(`Password input height: ${passwordHeight}px`);

    // Check keyboard type for email
    const emailType = await emailInput.getAttribute('type');
    const emailInputMode = await emailInput.getAttribute('inputmode');

    fs.writeFileSync(
      path.join(resultsDir, 'login-mobile.json'),
      JSON.stringify({
        emailInputHeight: emailHeight,
        passwordInputHeight: passwordHeight,
        emailType: emailType,
        emailInputMode: emailInputMode,
        meetsMinimumHeight: emailHeight >= 44 && passwordHeight >= 44,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });

  test('Register page mobile experience', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(resultsDir, 'register-mobile.png'),
      fullPage: true
    });

    // Count form fields
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button[type="submit"]').count();

    // Check if form is scrollable on mobile
    const formHeight = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.scrollHeight : 0;
    });

    const viewportHeight = page.viewportSize()?.height || 0;

    console.log(`Form height: ${formHeight}px, Viewport: ${viewportHeight}px`);

    fs.writeFileSync(
      path.join(resultsDir, 'register-mobile.json'),
      JSON.stringify({
        inputCount: inputs,
        submitButtons: buttons,
        formHeight: formHeight,
        viewportHeight: viewportHeight,
        requiresScroll: formHeight > viewportHeight,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });

  test('Stylists page mobile grid layout', async ({ page }) => {
    await page.goto('/stylists');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(resultsDir, 'stylists-mobile.png'),
      fullPage: true
    });

    // Check grid layout
    const cards = page.locator('[class*="grid"] > *').first();
    const cardBox = await cards.boundingBox();

    const viewportWidth = page.viewportSize()?.width || 0;
    const cardWidth = cardBox?.width || 0;

    // On mobile, cards should be nearly full width (allowing for padding)
    const isFullWidth = cardWidth > viewportWidth * 0.8;

    console.log(`Card width: ${cardWidth}px, Viewport: ${viewportWidth}px`);
    console.log(`Is full-width on mobile: ${isFullWidth}`);

    fs.writeFileSync(
      path.join(resultsDir, 'stylists-mobile.json'),
      JSON.stringify({
        cardWidth: cardWidth,
        viewportWidth: viewportWidth,
        isFullWidthOnMobile: isFullWidth,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });

  test('Services page mobile scrolling', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(resultsDir, 'services-mobile-top.png')
    });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(resultsDir, 'services-mobile-middle.png')
    });

    // Check for sticky header
    const header = page.locator('header, nav').first();
    const headerPosition = await header.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        top: styles.top
      };
    });

    console.log('Header position:', headerPosition);

    fs.writeFileSync(
      path.join(resultsDir, 'services-mobile-scroll.json'),
      JSON.stringify({
        headerPosition: headerPosition,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });

  test('Mobile performance metrics', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];

      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,
        firstPaint: navigation ? navigation.responseEnd - navigation.requestStart : 0
      };
    });

    console.log('Performance metrics:', metrics);

    // Performance thresholds
    const results = {
      metrics: metrics,
      domContentLoadedOk: metrics.domContentLoaded < 3000,
      loadCompleteOk: metrics.loadComplete < 5000,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(resultsDir, 'performance-mobile.json'),
      JSON.stringify(results, null, 2)
    );

    expect(metrics.domContentLoaded).toBeLessThan(5000); // 5 seconds max
  });

  test('Touch gesture support', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test swipe gesture (if carousel exists)
    const carousel = page.locator('[class*="carousel"], [class*="slider"]').first();

    if (await carousel.count() > 0) {
      const box = await carousel.boundingBox();

      if (box) {
        // Simulate swipe
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2);
        await page.mouse.up();

        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(resultsDir, 'after-swipe.png')
        });

        console.log('Swipe gesture tested');
      }
    }

    // Test pinch zoom (should be disabled on most elements for app-like feel)
    const metaViewport = await page.locator('meta[name="viewport"]').getAttribute('content');

    console.log('Viewport meta:', metaViewport);

    fs.writeFileSync(
      path.join(resultsDir, 'touch-gestures.json'),
      JSON.stringify({
        carouselFound: await carousel.count() > 0,
        viewportMeta: metaViewport,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });

  test('Critical user flow: Browse stylists', async ({ page }) => {
    const flow = [];

    // Step 1: Land on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    flow.push({ step: 1, action: 'Loaded homepage', url: page.url() });

    // Step 2: Navigate to stylists
    const stylistsLink = page.locator('a[href="/stylists"]').first();
    if (await stylistsLink.count() > 0) {
      await stylistsLink.click();
      await page.waitForLoadState('networkidle');
      flow.push({ step: 2, action: 'Clicked stylists link', url: page.url() });

      await page.screenshot({
        path: path.join(resultsDir, 'flow-stylists-page.png'),
        fullPage: true
      });
    }

    // Step 3: Check if stylist cards are visible
    const stylistCards = page.locator('[class*="card"], .stylist, [data-testid*="stylist"]');
    const cardsCount = await stylistCards.count();
    flow.push({ step: 3, action: `Found ${cardsCount} stylist cards`, count: cardsCount });

    // Step 4: Click first stylist (if exists)
    if (cardsCount > 0) {
      const firstCard = stylistCards.first();
      await firstCard.click();
      await page.waitForTimeout(1000);
      flow.push({ step: 4, action: 'Clicked first stylist', url: page.url() });

      await page.screenshot({
        path: path.join(resultsDir, 'flow-stylist-detail.png'),
        fullPage: true
      });
    }

    fs.writeFileSync(
      path.join(resultsDir, 'user-flow-browse.json'),
      JSON.stringify(flow, null, 2)
    );

    console.log('User flow completed:', flow.length, 'steps');
  });

  test('Text readability on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check font sizes
    const textElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      const sizes = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        if (fontSize && el.textContent.trim()) {
          sizes.push({
            tag: el.tagName.toLowerCase(),
            fontSize: fontSize,
            textLength: el.textContent.trim().length
          });
        }
      });

      return sizes.slice(0, 50); // First 50 elements
    });

    // Find elements with font size less than 14px (hard to read on mobile)
    const smallText = textElements.filter(el => el.fontSize < 14);

    console.log(`Small text elements (< 14px): ${smallText.length}/${textElements.length}`);

    fs.writeFileSync(
      path.join(resultsDir, 'text-readability.json'),
      JSON.stringify({
        totalElements: textElements.length,
        smallTextCount: smallText.length,
        smallTextElements: smallText.slice(0, 10),
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  });
});
