/**
 * BeautyCita Design System - Animation Variants
 * Framer Motion reusable animations
 */

import { Variants } from 'framer-motion'

// Card appearance
export const cardAppear: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

// Stagger children
export const staggerChildren: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Sparkle grow animation
export const sparkleGrow: Variants = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    transition: { duration: 0.8, ease: 'easeInOut' }
  }
}

// Glow pulse
export const glowPulse: Variants = {
  initial: { opacity: 0.7 },
  animate: {
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
}

// Slide and fade
export const slideAndFade: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' }
  })
}

// Button morph to success
export const morphButton: Variants = {
  idle: {
    scale: 1,
    backgroundColor: 'var(--primary-color)'
  },
  loading: {
    scale: [1, 0.95, 1],
    transition: { repeat: Infinity, duration: 0.6 }
  },
  success: {
    scale: [1, 1.05, 1],
    backgroundColor: 'var(--success-color)',
    transition: { duration: 0.4 }
  }
}

// Modal appear
export const modalAppear: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
}

// Drawer slide
export const drawerSlide: Variants = {
  hidden: {
    x: '100%',
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  visible: {
    x: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
}

// List item stagger
export const listItemStagger: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  })
}

// Confetti celebration
export const confetti: Variants = {
  initial: { scale: 0, rotate: 0, y: 0 },
  animate: {
    scale: [0, 1, 1, 0],
    rotate: [0, 180, 360, 540],
    y: [0, -50, -100, -150],
    x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50],
    transition: { duration: 1.5, ease: 'easeOut' }
  }
}
