# SEO Implementation Guide - Page Titles & Meta Descriptions

## Quick Start

**Status:** ✅ Infrastructure Ready
- Custom hook created: `frontend/src/hooks/usePageMeta.ts`
- Meta config created: `frontend/src/config/pageMeta.ts`
- robots.txt created: `frontend/public/robots.txt`
- sitemap.xml created: `frontend/public/sitemap.xml`

**Next Step:** Add usePageMeta hook to each page component

---

## How to Add SEO to a Page

### 1. Import the Hook and Config

```typescript
import { usePageMeta } from '@/hooks/usePageMeta';
import { PAGE_META } from '@/config/pageMeta';
```

### 2. Call the Hook in Your Component

Add this line at the top of your component function:

```typescript
export default function HomePage() {
  usePageMeta(PAGE_META.home);

  // Rest of your component code...
}
```

---

## Examples for Key Pages

### HomePage.tsx

```typescript
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '@/hooks/usePageMeta'  // ADD THIS
import { PAGE_META } from '@/config/pageMeta'      // ADD THIS
// ... other imports

export default function HomePage() {
  usePageMeta(PAGE_META.home);  // ADD THIS LINE

  const { t } = useTranslation();
  // ... rest of component
}
```

**Result:**
- Title: "BeautyCita - Book Beauty Services with Top Stylists | Hair, Nails, Makeup"
- Description: "Find and book professional beauty services in your area..."
- Keywords: "beauty services, book stylist, hair salon..."

---

### StylistsPage.tsx

```typescript
import React from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';  // ADD THIS
import { PAGE_META } from '@/config/pageMeta';      // ADD THIS

export default function StylistsPage() {
  usePageMeta(PAGE_META.stylists);  // ADD THIS LINE

  // ... rest of component
}
```

**Result:**
- Title: "Find Professional Stylists Near You | BeautyCita"
- Description: "Browse verified beauty professionals in your area..."

---

### ServicesPage.tsx

```typescript
import React from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';  // ADD THIS
import { PAGE_META } from '@/config/pageMeta';      // ADD THIS

export default function ServicesPage() {
  usePageMeta(PAGE_META.services);  // ADD THIS LINE

  // ... rest of component
}
```

**Result:**
- Title: "Beauty Services & Pricing | BeautyCita"
- Description: "Explore our comprehensive catalog of beauty services..."

---

### LoginPage.tsx (auth/LoginPage.tsx)

```typescript
import React from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';  // ADD THIS
import { PAGE_META } from '@/config/pageMeta';      // ADD THIS

export default function LoginPage() {
  usePageMeta(PAGE_META.login);  // ADD THIS LINE

  // ... rest of component
}
```

---

## Complete Page Mapping

Use these exact keys from PAGE_META:

| Page File | Config Key | Title Preview |
|-----------|------------|---------------|
| `HomePage.tsx` | `PAGE_META.home` | "BeautyCita - Book Beauty Services..." |
| `StylistsPage.tsx` | `PAGE_META.stylists` | "Find Professional Stylists Near You" |
| `ServicesPage.tsx` | `PAGE_META.services` | "Beauty Services & Pricing" |
| `AboutPage.tsx` | `PAGE_META.about` | "About BeautyCita - Connecting Clients..." |
| `CareersPage.tsx` | `PAGE_META.careers` | "Careers at BeautyCita" |
| `PressPage.tsx` | `PAGE_META.press` | "Press & Media - BeautyCita News" |
| `BlogPage.tsx` | `PAGE_META.blog` | "Beauty Tips & Industry Insights" |
| `HelpPage.tsx` | `PAGE_META.help` | "Help Center - BeautyCita Support" |
| `ContactPage.tsx` | `PAGE_META.contact` | "Contact Us - BeautyCita" |
| `auth/LoginPage.tsx` | `PAGE_META.login` | "Login to Your Account" |
| `auth/RegisterPage.tsx` | `PAGE_META.register` | "Create Your Account" |
| `auth/ForgotPasswordPage.tsx` | `PAGE_META.forgotPassword` | "Reset Your Password" |
| `PrivacyPage.tsx` | `PAGE_META.privacy` | "Privacy Policy" |
| `TermsPage.tsx` | `PAGE_META.terms` | "Terms of Service" |
| `CookiesPage.tsx` | `PAGE_META.cookies` | "Cookie Policy" |
| `LicensesPage.tsx` | `PAGE_META.licenses` | "Open Source Licenses" |
| `ResourcesPage.tsx` | `PAGE_META.resources` | "Resources for Stylists" |
| `PoliciesPage.tsx` | `PAGE_META.policies` | "Platform Policies" |
| `CommissionsPage.tsx` | `PAGE_META.commissions` | "Commission Structure" |
| `VerifiedProfessionalsPage.tsx` | `PAGE_META.verifiedProfessionals` | "Verified Professionals Program" |
| `SecurePaymentsPage.tsx` | `PAGE_META.securePayments` | "Secure Payment Processing" |
| `DisputeResolutionPage.tsx` | `PAGE_META.disputeResolution` | "Dispute Resolution Process" |
| `MoneyBackGuaranteePage.tsx` | `PAGE_META.moneyBackGuarantee` | "Money-Back Guarantee" |
| `ClientProtectionPage.tsx` | `PAGE_META.clientProtection` | "Client Protection Policy" |
| `QrGeneratorPage.tsx` | `PAGE_META.qrGenerator` | "QR Code Generator for Stylists" |
| `StatusPage.tsx` | `PAGE_META.status` | "Platform Status" |
| `ReportPage.tsx` | `PAGE_META.report` | "Report an Issue" |

---

## Dynamic Titles (Advanced)

For pages with dynamic content (e.g., stylist profiles, service details), use custom metadata:

### StylistProfilePage.tsx (Example)

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function StylistProfilePage() {
  const { id } = useParams();
  const [stylist, setStylist] = useState(null);

  useEffect(() => {
    // Fetch stylist data...
    fetch(`/api/stylists/${id}`)
      .then(res => res.json())
      .then(data => setStylist(data));
  }, [id]);

  // Dynamic meta based on stylist data
  usePageMeta({
    title: stylist
      ? `${stylist.businessName} - Professional Stylist | BeautyCita`
      : 'Stylist Profile | BeautyCita',
    description: stylist
      ? `Book ${stylist.businessName} for ${stylist.specialties?.join(', ')}. ${stylist.bio?.substring(0, 100)}...`
      : 'View stylist profile and book beauty services.',
    keywords: stylist
      ? `${stylist.businessName}, ${stylist.specialties?.join(', ')}, stylist in ${stylist.location_city}`
      : 'stylist profile, beauty services'
  });

  // ... rest of component
}
```

---

## Custom Meta for Other Pages

For pages not in PAGE_META, use inline metadata:

```typescript
usePageMeta({
  title: 'My Custom Page | BeautyCita',
  description: 'Description for my custom page',
  keywords: 'keyword1, keyword2, keyword3'
});
```

---

## Testing SEO Changes

### 1. Build the Frontend

```bash
cd frontend
npm run build
```

### 2. Check Title in Browser

Open the page and look at the browser tab title. It should be unique per page.

### 3. View Page Source

Right-click → View Page Source, then search for:
- `<title>` tag
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`

### 4. Test with SEO Tools

- **Google Search Console:** Submit sitemap.xml
- **Screaming Frog:** Crawl site and check titles/descriptions
- **Facebook Debugger:** Test Open Graph tags
- **Twitter Card Validator:** Test Twitter cards

---

## SEO Checklist

After adding usePageMeta to all pages:

- [ ] All 27+ public pages have unique titles
- [ ] All titles are 50-60 characters
- [ ] All descriptions are 150-160 characters
- [ ] Keywords are relevant and specific
- [ ] robots.txt is deployed
- [ ] sitemap.xml is deployed
- [ ] Google Search Console configured
- [ ] Google Analytics tracking titles
- [ ] No duplicate titles (check with Screaming Frog)
- [ ] Mobile-friendly (check with Google Mobile-Friendly Test)

---

## Priority Order (Recommended)

Implement in this order for maximum SEO impact:

**High Priority (Immediate):**
1. ✅ HomePage.tsx
2. ✅ StylistsPage.tsx
3. ✅ ServicesPage.tsx
4. ✅ AboutPage.tsx
5. ✅ LoginPage.tsx
6. ✅ RegisterPage.tsx

**Medium Priority (Week 1):**
7. ✅ HelpPage.tsx
8. ✅ ContactPage.tsx
9. ✅ BlogPage.tsx
10. ✅ CareersPage.tsx
11. ✅ PrivacyPage.tsx
12. ✅ TermsPage.tsx

**Lower Priority (Week 2):**
13. ✅ All remaining public pages
14. ✅ Dynamic pages (stylist profiles, service details)
15. ✅ Dashboard/authenticated pages

---

## Automated Implementation Script

For faster implementation, you can use this bash script:

```bash
#!/bin/bash

# Add usePageMeta to all page files
pages=(
  "HomePage.tsx:home"
  "StylistsPage.tsx:stylists"
  "ServicesPage.tsx:services"
  "AboutPage.tsx:about"
  "CareersPage.tsx:careers"
  "PressPage.tsx:press"
  "BlogPage.tsx:blog"
  "HelpPage.tsx:help"
  "ContactPage.tsx:contact"
  "PrivacyPage.tsx:privacy"
  "TermsPage.tsx:terms"
  "CookiesPage.tsx:cookies"
)

for page in "${pages[@]}"; do
  IFS=":" read -r file key <<< "$page"

  # Add imports at top of file
  sed -i "1a import { usePageMeta } from '@/hooks/usePageMeta';\nimport { PAGE_META } from '@/config/pageMeta';" "frontend/src/pages/$file"

  # Add hook call (after function declaration)
  sed -i "/^export default function/a \  usePageMeta(PAGE_META.$key);" "frontend/src/pages/$file"
done
```

---

## Expected SEO Results

After implementation:

**Before:**
- All pages: "BeautyCita - Tu plataforma de belleza"
- No unique meta descriptions
- Poor Google ranking

**After:**
- Each page: Unique, keyword-rich title
- Compelling meta descriptions
- Improved click-through rate (CTR)
- Better Google rankings within 2-4 weeks
- Rich social media previews (Facebook, Twitter)

**Estimated Impact:**
- +30% CTR from search results
- +20% organic traffic within 30 days
- +50% social media engagement
- Better brand recognition

---

## Next Steps

1. Start with high-priority pages (HomePage, StylistsPage, ServicesPage)
2. Test each page after adding usePageMeta
3. Build and deploy frontend
4. Submit sitemap.xml to Google Search Console
5. Monitor Google Analytics for improved metrics
6. Continue with remaining pages

---

**Questions?** Check the hook implementation at `frontend/src/hooks/usePageMeta.ts`

**Need to add more pages?** Edit `frontend/src/config/pageMeta.ts`
