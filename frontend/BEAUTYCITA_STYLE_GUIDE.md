# 💅 BeautyCita Official Style Guide

## 🎯 Brand Identity

**BeautyCita** is the Instagram of beauty bookings - trendy, feminine, and effortlessly beautiful.

**Target Audience:** Young women aged 18-30 who live on social media and expect polished, intuitive interfaces.

**Design Philosophy:**
- Instagram/TikTok-level polish
- Mobile-first always
- Smooth animations and delightful interactions
- Pink-to-purple gradients everywhere
- Clean, modern, feminine aesthetic

---

## 🎨 Color Palette

### Primary Gradient
```css
background: linear-gradient(to right, #ec4899, #9333ea);
/* Pink-500 (#ec4899) to Purple-600 (#9333ea) */
```

### Color Usage
- **Primary Pink:** `#ec4899` (pink-500)
- **Primary Purple:** `#9333ea` (purple-600)
- **Success Green:** `#10b981` (emerald-500)
- **Warning Yellow:** `#f59e0b` (amber-500)
- **Error Red:** `#ef4444` (red-500)

### Light Mode
- **Background:** `#f9fafb` (gray-50)
- **Surface:** `#ffffff` (white)
- **Text Primary:** `#111827` (gray-900)
- **Text Secondary:** `#6b7280` (gray-500)
- **Border:** `#e5e7eb` (gray-200)

### Dark Mode
- **Background:** `#0f0f0f` (near black)
- **Surface:** `#1a1a1a` (dark gray)
- **Elevated:** `#252525` (lighter dark gray)
- **Text Primary:** `#ffffff` (white)
- **Text Secondary:** `#d4d4d4` (light gray)
- **Border:** `#404040` (medium gray)

---

## 🔘 Buttons - THE DEFINITIVE GUIDE

### ✅ CORRECT: Pill Buttons (Rounded-Full)

**This is the BeautyCita style. ALWAYS use these:**

```tsx
// Primary Button (gradient background, white text)
<button className="btn btn-primary">
  Book Now
</button>

// CSS classes:
.btn {
  @apply inline-flex items-center justify-center gap-2
         px-6 py-3 text-sm font-semibold
         rounded-full /* ← PILL SHAPE - ALWAYS ROUNDED-FULL */
         transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply text-white focus:ring-pink-500;
  background: linear-gradient(to right, #ec4899, #9333ea);
}

.btn-primary:hover {
  background: linear-gradient(to right, #db2777, #7e22ce);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3);
}
```

### Button Variants

```css
/* Primary - Gradient pill */
.btn-primary {
  background: linear-gradient(to right, #ec4899, #9333ea);
  color: white;
  border-radius: 9999px; /* rounded-full */
}

/* Secondary - White with gradient border */
.btn-secondary {
  background: white;
  color: #ec4899;
  border: 2px solid transparent;
  border-radius: 9999px; /* rounded-full */
  background-clip: padding-box;
  position: relative;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  padding: 2px;
  background: linear-gradient(to right, #ec4899, #9333ea);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

/* Outline - Transparent with gradient border */
.btn-outline {
  background: transparent;
  color: #ec4899;
  border: 2px solid #ec4899;
  border-radius: 9999px; /* rounded-full */
}

/* Ghost - No border, subtle hover */
.btn-ghost {
  background: transparent;
  color: #6b7280;
  border: none;
  border-radius: 9999px; /* rounded-full */
}

.btn-ghost:hover {
  background: #f3f4f6;
}

/* Danger */
.btn-danger {
  background: #ef4444;
  color: white;
  border-radius: 9999px; /* rounded-full */
}
```

### Button Sizes

```css
.btn-sm {
  @apply px-4 py-2 text-xs;
}

.btn-md {
  @apply px-6 py-3 text-sm; /* default */
}

.btn-lg {
  @apply px-8 py-4 text-base;
}

.btn-xl {
  @apply px-10 py-5 text-lg;
}
```

### ❌ NEVER USE THESE:
- **Rectangular buttons** (rounded-lg, rounded-xl, rounded-2xl)
- **Square buttons** (rounded-none)
- **Sharp corners** (not BeautyCita style!)

---

## 📦 Cards

### Standard Card
```tsx
<div className="card">
  <div className="card-body">
    <h3 className="card-title">Card Title</h3>
    <p>Card content</p>
  </div>
</div>
```

```css
.card {
  @apply bg-white dark:bg-gray-800
         rounded-2xl /* ← Large rounded corners for cards */
         shadow-md
         border border-gray-200 dark:border-gray-700
         overflow-hidden;
}

.card-body {
  @apply p-6;
}

.card-title {
  @apply text-xl font-bold text-gray-900 dark:text-white mb-4;
}

.card-header {
  @apply flex items-center justify-between px-6 py-4
         border-b border-gray-200 dark:border-gray-700;
}
```

### Gradient Card (for CTAs)
```tsx
<div className="card-gradient">
  <div className="card-body">
    <h3>Special Offer</h3>
  </div>
</div>
```

```css
.card-gradient {
  @apply rounded-2xl p-6 text-white;
  background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
}
```

---

## 🎭 Typography

### Font Families
```css
font-family: {
  heading: "'Playfair Display', serif",
  body: "'Inter', sans-serif"
}
```

### Headings (Use Playfair Display)
```tsx
<h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
  Beautiful Heading
</h1>
```

### Body Text (Use Inter)
```tsx
<p className="text-base text-gray-700 dark:text-gray-300">
  Body text here
</p>
```

### Text Hierarchy
```css
.text-hero {
  @apply text-5xl md:text-6xl font-serif font-bold;
}

.text-page-title {
  @apply text-3xl md:text-4xl font-serif font-bold;
}

.text-section-title {
  @apply text-2xl md:text-3xl font-serif font-bold;
}

.text-card-title {
  @apply text-xl md:text-2xl font-bold;
}

.text-body-lg {
  @apply text-lg leading-relaxed;
}

.text-body {
  @apply text-base leading-normal;
}

.text-body-sm {
  @apply text-sm leading-normal;
}

.text-caption {
  @apply text-xs text-gray-500;
}
```

---

## 📐 Spacing & Layout

### Container
```css
.container-responsive {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}
```

### Spacing Scale (Tailwind Default)
- `space-2` = 8px (tight)
- `space-4` = 16px (normal)
- `space-6` = 24px (relaxed)
- `space-8` = 32px (loose)

### Common Patterns
```tsx
// Page wrapper
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="container-responsive py-8">
    {/* content */}
  </div>
</div>

// Section spacing
<section className="py-12 md:py-16 lg:py-20">

// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 🎨 Forms

### Input Fields
```tsx
<input
  type="text"
  className="input input-primary"
  placeholder="Enter your name"
/>
```

```css
.input {
  @apply w-full px-4 py-3
         rounded-full /* ← Pills for inputs too! */
         border border-gray-300 dark:border-gray-600
         bg-white dark:bg-gray-800
         text-gray-900 dark:text-white
         placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent
         transition-all duration-200;
}

.input-error {
  @apply border-red-500 focus:ring-red-500;
}
```

### Labels
```tsx
<label className="form-label">
  Email Address
</label>
```

```css
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}
```

---

## 🎯 Navigation

### Mobile Bottom Nav (48px touch targets)
```tsx
<nav className="bottom-nav">
  <Link to="/my" className="bottom-nav-item active">
    <HomeIcon className="h-6 w-6" />
    <span>Home</span>
  </Link>
</nav>
```

```css
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 z-50
         bg-white dark:bg-gray-800
         border-t border-gray-200 dark:border-gray-700
         shadow-lg;
  height: 64px;
}

.bottom-nav-item {
  @apply flex flex-col items-center justify-center gap-1
         text-gray-600 dark:text-gray-400
         transition-colors;
  min-height: 48px; /* Touch target */
  min-width: 48px;
}

.bottom-nav-item.active {
  @apply text-pink-600 dark:text-pink-400;
}
```

### Desktop Sidebar Nav
```css
.sidebar-nav-item {
  @apply flex gap-x-3 rounded-full /* ← Even nav items are pills */
         px-4 py-3 text-sm font-semibold
         transition-all;
}

.sidebar-nav-item.active {
  background: linear-gradient(to right, #ec4899, #9333ea);
  @apply text-white shadow-md;
}

.sidebar-nav-item:not(.active) {
  @apply text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700;
}
```

---

## ✨ Animations

### Standard Transitions
```css
/* All interactive elements */
.transition-all {
  transition: all 200ms ease-in-out;
}

/* Hover lift */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
```

### Framer Motion Variants (Already Created)
```tsx
import { cardAppear, staggerChildren, sparkleGrow } from '../design/animations'

// Use like this:
<motion.div
  variants={cardAppear}
  initial="hidden"
  animate="visible"
>
  {children}
</motion.div>
```

---

## 🎭 Badges & Tags

```tsx
// Status badges (pill-shaped)
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Cancelled</span>
```

```css
.badge {
  @apply inline-flex items-center px-3 py-1
         rounded-full /* ← Pills! */
         text-xs font-semibold;
}

.badge-success {
  @apply bg-emerald-100 text-emerald-800
         dark:bg-emerald-900 dark:text-emerald-200;
}

.badge-warning {
  @apply bg-amber-100 text-amber-800
         dark:bg-amber-900 dark:text-amber-200;
}

.badge-error {
  @apply bg-red-100 text-red-800
         dark:bg-red-900 dark:text-red-200;
}
```

---

## 📱 Mobile Optimization Rules

### Touch Targets
- **Minimum:** 48px × 48px
- **Preferred:** 56px × 56px for primary actions

### Responsive Breakpoints
```css
/* Mobile first, then scale up */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large */
```

### Common Patterns
```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">

// 1 col mobile, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="lg:hidden">
```

---

## 🎯 Component Examples

### Booking Card (Mobile-Optimized)
```tsx
<div className="card hover:shadow-lg transition-shadow">
  <div className="card-body">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
        JD
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
          Jane Doe
        </h4>
        <p className="text-sm text-gray-500 truncate">
          Balayage & Style
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">Tomorrow at 2:00 PM</span>
      <button className="btn btn-primary btn-sm">
        View Details
      </button>
    </div>
  </div>
</div>
```

### Search Bar (Pill-Shaped)
```tsx
<div className="relative">
  <input
    type="search"
    placeholder="Search stylists..."
    className="input pl-12 pr-4"
  />
  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
</div>
```

---

## ✅ Do's and ❌ Don'ts

### ✅ DO:
- Use pill-shaped buttons (`rounded-full`)
- Use gradient backgrounds for primary actions
- Use large rounded corners for cards (`rounded-2xl`)
- Keep touch targets ≥ 48px on mobile
- Use Playfair Display for headings
- Use Inter for body text
- Add smooth transitions to interactive elements
- Test on mobile first

### ❌ DON'T:
- Use rectangular buttons (`rounded-lg`, `rounded-xl`)
- Use sharp corners anywhere visible
- Use text smaller than 14px for body content
- Ignore dark mode variants
- Create custom components without checking this guide
- Mix font families randomly
- Forget hover/active states
- Skip mobile testing

---

## 🎨 Quick Reference

```tsx
// ✅ CORRECT BeautyCita Components
<button className="btn btn-primary rounded-full">Book Now</button>
<div className="card rounded-2xl">Card content</div>
<input className="input rounded-full" />
<span className="badge rounded-full">Status</span>
<nav className="sidebar-nav-item rounded-full">Navigation</nav>

// ❌ WRONG - Not BeautyCita Style
<button className="btn btn-primary rounded-lg">Book Now</button> ← NO
<div className="card rounded-xl">Card content</div> ← NO
<button className="px-4 py-2 bg-blue-500">Button</button> ← NO
```

---

## 📝 Notes for Developers

1. **All existing buttons need to be `rounded-full`** - not `rounded-lg` or `rounded-xl`
2. **Cards use `rounded-2xl`** for softer appearance
3. **Inputs also use `rounded-full`** for consistency
4. **The gradient is our signature:** `linear-gradient(to right, #ec4899, #9333ea)`
5. **Always provide dark mode variants** using `dark:` prefix
6. **Mobile first, always** - start with mobile layout, then scale up
7. **When in doubt, check this guide** - consistency is key

---

**Last Updated:** January 8, 2025
**Maintained By:** Your Loving Husband Co.
**For:** BeautyCita Platform
