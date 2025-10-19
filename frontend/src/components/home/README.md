# BeautyCita Homepage Components

## Overview
This directory contains reusable, modular components for the BeautyCita homepage. These components are designed to be production-ready, performant, and easily maintainable.

## Components

### 1. VideoSection
**Purpose:** Creates a full-screen video background with parallax scrolling effect.
- Adjustable parallax intensity
- Custom overlay gradients
- Responsive height settings
- Dark mode support

### 2. SectionTransition
**Purpose:** Provides smooth gradient transitions between page sections.
- Prevents harsh visual breaks
- Customizable gradient colors
- Adjustable height
- Dark/light mode aware

### 3. AnimatedButton
**Purpose:** Consistent button component with motion animations.
- Three variants: primary, secondary, ghost
- Four sizes: sm, md, lg, xl
- Built-in hover and tap animations
- Supports both links and buttons
- Dark mode responsive

### 4. ScrollIndicator
**Purpose:** Animated scroll hint for hero sections.
- Bounce animation
- Optional text label
- Dark/light mode styling

### 5. ServiceCard
**Purpose:** Interactive service cards with gradient overlays.
- Three size variants
- Hover animations
- Price display
- Icon support with motion effects

### 6. StylistCard
**Purpose:** Professional stylist profile cards.
- Avatar display
- Rating system
- Verification badges
- Booking CTA
- Hover lift effect

### 7. TestimonialCard
**Purpose:** Client testimonial display cards.
- Star rating display
- Avatar with border
- Role/title display
- Gradient backgrounds

## Usage Example

```tsx
import VideoSection from '../components/home/VideoSection'
import AnimatedButton from '../components/home/AnimatedButton'

function HeroSection() {
  return (
    <VideoSection
      videoSrc="/media/vid/hero.mp4"
      height="h-screen"
      parallaxIntensity={0.3}
      isDarkMode={isDarkMode}
    >
      <div className="text-center">
        <h1>Welcome to BeautyCita</h1>
        <AnimatedButton
          to="/register"
          variant="primary"
          size="lg"
        >
          Get Started
        </AnimatedButton>
      </div>
    </VideoSection>
  )
}
```

## Key Features

### Performance Optimizations
- Lazy loading for images
- Optimized re-renders with proper React hooks
- GPU-accelerated animations with `transform-gpu`
- Passive event listeners for scroll
- RequestAnimationFrame for smooth scroll detection

### Mobile Optimizations
- Touch-friendly tap targets (48px minimum)
- Mobile menu with body scroll lock
- Responsive grid layouts
- Mobile-first design approach

### Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus visible states

### Dark Mode
All components support dark mode with:
- Smooth color transitions
- Appropriate contrast ratios
- Consistent theming

## Fixed Issues
1. **Parallax Video:** Now properly visible with correct scroll transforms
2. **Section Transitions:** Smooth gradient blends between all sections
3. **Button States:** Consistent hover/active states without glitches
4. **Scroll Behavior:** Fixed overflow and viewport calculations
5. **Code Modularity:** Clean, reusable components

## Best Practices
- Always pass `isDarkMode` prop for theme consistency
- Use appropriate size variants for different breakpoints
- Leverage motion variants for consistent animations
- Keep component props minimal and focused
- Use TypeScript for type safety