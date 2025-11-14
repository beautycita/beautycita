// Identify Small Touch Targets Test
const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../test-results/button-analysis');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

test.use({ ...devices['iPhone 12 Pro'] });

test('Identify all small buttons on homepage', async ({ page }) => {
  await page.goto('https://beautycita.com/');
  await page.waitForLoadState('networkidle');

  // Get ALL buttons and their details
  const buttonDetails = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]');
    const details = [];

    buttons.forEach((button, index) => {
      const box = button.getBoundingClientRect();
      const styles = window.getComputedStyle(button);

      // Get identifying information
      const id = button.id || '';
      const classes = button.className || '';
      const ariaLabel = button.getAttribute('aria-label') || '';
      const text = button.textContent?.trim().substring(0, 50) || '';
      const tag = button.tagName.toLowerCase();

      // Get parent context
      const parent = button.parentElement;
      const parentClasses = parent?.className || '';

      details.push({
        index: index,
        tag: tag,
        id: id,
        classes: classes,
        ariaLabel: ariaLabel,
        text: text,
        parentClasses: parentClasses,
        width: Math.round(box.width),
        height: Math.round(box.height),
        minWidth: styles.minWidth,
        minHeight: styles.minHeight,
        padding: styles.padding,
        isSmall: box.width < 44 || box.height < 44,
        x: Math.round(box.x),
        y: Math.round(box.y)
      });
    });

    return details;
  });

  // Filter only small buttons
  const smallButtons = buttonDetails.filter(b => b.isSmall);

  console.log(`\n==== BUTTON ANALYSIS ====`);
  console.log(`Total buttons found: ${buttonDetails.length}`);
  console.log(`Small buttons (< 44px): ${smallButtons.length}`);
  console.log(`\n==== SMALL BUTTONS DETAIL ====`);

  smallButtons.forEach((btn, idx) => {
    console.log(`\n${idx + 1}. [${btn.tag}] ${btn.width}x${btn.height}px`);
    console.log(`   ID: ${btn.id || 'none'}`);
    console.log(`   Classes: ${btn.classes || 'none'}`);
    console.log(`   Aria-Label: ${btn.ariaLabel || 'none'}`);
    console.log(`   Text: ${btn.text || 'none'}`);
    console.log(`   Parent Classes: ${btn.parentClasses || 'none'}`);
    console.log(`   Position: (${btn.x}, ${btn.y})`);
    console.log(`   CSS min-width: ${btn.minWidth}, min-height: ${btn.minHeight}`);
    console.log(`   Padding: ${btn.padding}`);
  });

  // Save full results
  fs.writeFileSync(
    path.join(resultsDir, 'all-buttons.json'),
    JSON.stringify(buttonDetails, null, 2)
  );

  fs.writeFileSync(
    path.join(resultsDir, 'small-buttons.json'),
    JSON.stringify(smallButtons, null, 2)
  );

  // Take screenshot
  await page.screenshot({
    path: path.join(resultsDir, 'homepage-annotated.png'),
    fullPage: true
  });

  console.log(`\n==== FILES CREATED ====`);
  console.log(`all-buttons.json: ${buttonDetails.length} buttons`);
  console.log(`small-buttons.json: ${smallButtons.length} small buttons`);
  console.log(`homepage-annotated.png: Screenshot`);
});
