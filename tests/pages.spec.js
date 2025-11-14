// BeautyCita All Pages Testing
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../test-results/pages');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// All 82 pages from BEAUTYCITA_APP_HIERARCHY.md
const pages = {
  public: [
    { name: 'HomePage', url: '/' },
    { name: 'ServicesPage', url: '/services' },
    { name: 'StylistsPage', url: '/stylists' },
    { name: 'AboutPage', url: '/about' },
    { name: 'CareersPage', url: '/careers' },
    { name: 'PressPage', url: '/press' },
    { name: 'BlogPage', url: '/blog' },
    { name: 'HelpPage', url: '/help' },
    { name: 'ContactPage', url: '/contact' },
    { name: 'StatusPage', url: '/status' },
    { name: 'ReportPage', url: '/report' },
    { name: 'PrivacyPage', url: '/privacy' },
    { name: 'TermsPage', url: '/terms' },
    { name: 'CookiesPage', url: '/cookies' },
    { name: 'LicensesPage', url: '/licenses' },
    { name: 'ResourcesPage', url: '/resources' },
    { name: 'PoliciesPage', url: '/policies' },
    { name: 'CommissionsPage', url: '/commissions' },
    { name: 'VerifiedProfessionalsPage', url: '/verified-professionals' },
    { name: 'SecurePaymentsPage', url: '/secure-payments' },
    { name: 'DisputeResolutionPage', url: '/dispute-resolution' },
    { name: 'MoneyBackGuaranteePage', url: '/money-back-guarantee' },
    { name: 'ClientProtectionPage', url: '/client-protection' },
    { name: 'QrGeneratorPage', url: '/qr-generator' },
  ],
  auth: [
    { name: 'LoginPage', url: '/login' },
    { name: 'RegisterPage', url: '/register' },
    { name: 'ForgotPasswordPage', url: '/forgot-password' },
  ]
};

test.describe('Public Pages Testing', () => {
  for (const page of pages.public) {
    test(`Test ${page.name} (${page.url})`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.url);

      // Check page loaded
      expect(response.status()).toBeLessThan(400);

      // Wait for page to be fully loaded
      await browserPage.waitForLoadState('networkidle');

      // Take screenshot
      await browserPage.screenshot({
        path: path.join(resultsDir, `${page.name}.png`),
        fullPage: true
      });

      // Check for console errors
      const consoleErrors = [];
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Get page title
      const title = await browserPage.title();

      // Check if React app loaded
      const appLoaded = await browserPage.evaluate(() => {
        return document.getElementById('root') !== null;
      });

      // Document findings
      const findings = {
        name: page.name,
        url: page.url,
        status: response.status(),
        title: title,
        appLoaded: appLoaded,
        consoleErrors: consoleErrors,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(resultsDir, `${page.name}.json`),
        JSON.stringify(findings, null, 2)
      );

      console.log(`✅ Tested ${page.name}: ${response.status()} - ${title}`);
    });
  }
});

test.describe('Authentication Pages Testing', () => {
  for (const page of pages.auth) {
    test(`Test ${page.name} (${page.url})`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      await browserPage.waitForLoadState('networkidle');

      // Screenshot
      await browserPage.screenshot({
        path: path.join(resultsDir, `${page.name}.png`),
        fullPage: true
      });

      // Check for forms
      const forms = await browserPage.locator('form').count();
      const inputs = await browserPage.locator('input').count();
      const buttons = await browserPage.locator('button').count();

      const findings = {
        name: page.name,
        url: page.url,
        forms: forms,
        inputs: inputs,
        buttons: buttons,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(resultsDir, `${page.name}.json`),
        JSON.stringify(findings, null, 2)
      );

      console.log(`✅ Tested ${page.name}: ${forms} forms, ${inputs} inputs, ${buttons} buttons`);
    });
  }
});
