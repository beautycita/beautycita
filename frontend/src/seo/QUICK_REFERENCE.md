# BeautyCita SEO - Quick Reference Card

## 🚀 Quick Start

### Import Everything
```tsx
import {
  // Meta Tags
  MetaTags, StylistProfileMeta, BlogPostMeta,

  // Structured Data
  StylistBusinessStructuredData, BlogPostStructuredData,

  // Performance
  OptimizedImage, reportWebVitals,

  // Social Sharing
  ShareMenu, FloatingShareBar,

  // Blog
  BlogPostList, BlogPostView,

  // Local SEO
  LocalBusinessStructuredData, NAPInfo
} from '@/seo';
```

---

## 📄 Meta Tags

```tsx
// Homepage
<MetaTags
  title="BeautyCita"
  description="Find beauty professionals"
  ogImage="https://beautycita.com/og.jpg"
/>

// Stylist Profile (auto-configured)
<StylistProfileMeta stylist={stylistData} />

// Blog Post (auto-configured)
<BlogPostMeta post={postData} />
```

---

## 🏗️ Structured Data

```tsx
// Stylist profile
<StylistBusinessStructuredData stylist={data} />

// Blog post
<BlogPostStructuredData post={data} />

// Breadcrumbs
<BreadcrumbStructuredData
  items={[
    { name: "Home", url: "/" },
    { name: "Stylists", url: "/stylists" }
  ]}
/>
```

---

## ⚡ Performance

```tsx
// Optimized images
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  priority={true}  // For above-the-fold
  width={800}
  height={600}
/>

// Prevent layout shift
<AspectRatioBox ratio={16/9}>
  <img src={dynamicSrc} />
</AspectRatioBox>

// Lazy render
<LazyRender height={300}>
  <HeavyComponent />
</LazyRender>

// Track vitals
reportWebVitals(sendToAnalytics);
```

---

## 📱 Social Sharing

```tsx
const shareData = {
  url: "https://beautycita.com/stylist/jane",
  title: "Check out Jane's portfolio!",
  description: "Amazing stylist",
  image: "https://...",
  hashtags: ["beauty"]
};

// Share menu
<ShareMenu
  shareData={shareData}
  platforms={['facebook', 'twitter', 'linkedin']}
  variant="horizontal"
  showLabels={true}
/>

// Floating bar
<FloatingShareBar
  shareData={shareData}
  position="left"
/>
```

---

## 📝 Blog System

```tsx
// Blog listing
<BlogPostList
  posts={posts}
  category="hair-trends"
/>

// Single post
<BlogPostView post={post} />

// Category sidebar
<BlogCategoriesSidebar />
```

---

## 📍 Local SEO

```tsx
// Business schema
<LocalBusinessStructuredData location={data} />

// Contact info
<NAPInfo
  location={data}
  variant="full"  // or "compact" or "footer"
/>

// Business hours
<BusinessHoursDisplay hours={hoursData} />

// Google Map
<GoogleMapEmbed
  location={data}
  height="400px"
/>
```

---

## 🗺️ Sitemap Setup

```typescript
// backend/server.ts
import { setupSitemapRoutes } from './utils/sitemap-generator';

setupSitemapRoutes(app, db);

// Auto-regenerate daily
import cron from 'node-cron';
cron.schedule('0 2 * * *', async () => {
  await generateAndSaveSitemaps(db, './public');
});
```

---

## 📋 Checklist for New Pages

- [ ] Add `<MetaTags>` component
- [ ] Add structured data (JSON-LD)
- [ ] Optimize images with `<OptimizedImage>`
- [ ] Add social sharing buttons
- [ ] Test meta tags with Facebook Debugger
- [ ] Verify structured data with Rich Results Test
- [ ] Check Core Web Vitals with PageSpeed Insights
- [ ] Add to sitemap (auto-generated from DB)

---

## 🧪 Testing Tools

**Meta Tags:**
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator

**Structured Data:**
- Rich Results: https://search.google.com/test/rich-results
- Schema.org: https://validator.schema.org/

**Performance:**
- PageSpeed: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

---

## 📁 File Locations

```
/frontend/src/seo/
├── MetaTags.tsx
├── StructuredData.tsx
├── CoreWebVitals.tsx
├── SocialSharing.tsx
├── BlogSystem.tsx
├── LocalSEO.tsx
├── index.ts
├── SEO_COMPLETE_GUIDE.md
├── SEO_DEPLOYMENT_SUMMARY.md
└── QUICK_REFERENCE.md

/backend/utils/
└── sitemap-generator.ts

/public/
└── robots.txt
```

---

## 🎯 Performance Targets

- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1
- **PageSpeed Mobile:** 90+
- **PageSpeed Desktop:** 95+

---

## 📞 Need Help?

1. Check `SEO_COMPLETE_GUIDE.md` for full documentation
2. Review inline code comments
3. Test with validation tools listed above

---

**Quick Ref Version 1.0**
All 8 SEO features ready to use!
