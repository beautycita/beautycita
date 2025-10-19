// BeautyCita Social Beauty Theme - Based on Option-C
// Vibrant, TikTok-inspired design system for young beauty enthusiasts

export const socialBeautyTheme = {
  // Primary Colors - Vibrant gradients
  colors: {
    primary: {
      gradient: 'from-violet-500 via-purple-500 to-pink-500',
      gradientAlt: 'from-pink-500 to-purple-600',
      violet: '#8b5cf6', // violet-500
      purple: '#a855f7', // purple-500
      pink: '#ec4899',   // pink-500
      gradientText: 'from-pink-500 via-purple-600 to-blue-600'
    },

    // UI Colors
    background: {
      main: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500',
      card: 'bg-white/80 backdrop-blur-md',
      cardHover: 'bg-white/90 backdrop-blur-md',
      overlay: 'bg-black/50 backdrop-blur-sm'
    },

    // Text Colors
    text: {
      white: 'text-white',
      whiteSecondary: 'text-white/80',
      whiteSubtle: 'text-white/60',
      dark: 'text-gray-800',
      darkSecondary: 'text-gray-600',
      gradient: 'bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent'
    },

    // Button Styles
    buttons: {
      primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl',
      secondary: 'bg-white/20 backdrop-blur-md text-white border border-white/30',
      ghost: 'bg-white/10 text-white hover:bg-white/20',
      white: 'bg-white text-gray-800 hover:bg-gray-50'
    }
  },

  // Typography
  typography: {
    heading: {
      h1: 'text-4xl md:text-6xl font-black leading-tight',
      h2: 'text-3xl md:text-5xl font-bold',
      h3: 'text-xl md:text-2xl font-bold',
      h4: 'text-lg font-bold'
    },
    body: {
      large: 'text-lg md:text-xl font-medium',
      normal: 'text-base',
      small: 'text-sm',
      xs: 'text-xs'
    }
  },

  // Spacing & Layout
  spacing: {
    section: 'px-4 py-16',
    card: 'p-6',
    button: 'px-6 py-3',
    buttonLarge: 'px-8 py-4'
  },

  // Border Radius - Rounded, modern feel
  borderRadius: {
    small: 'rounded-full',
    medium: 'rounded-full',
    large: 'rounded-3xl',
    full: 'rounded-full'
  },

  // Shadows
  shadows: {
    card: 'shadow-lg hover:shadow-xl',
    button: 'shadow-lg hover:shadow-xl',
    overlay: 'shadow-2xl'
  },

  // Animations & Interactions
  animations: {
    fadeInUp: {
      initial: { y: 30, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.6 }
    },
    scaleOnHover: {
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 }
    },
    slideFromRight: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      transition: { type: 'spring', damping: 25, stiffness: 120 }
    }
  },

  // Glassmorphism Effects
  glass: {
    subtle: 'bg-white/10 backdrop-blur-sm border border-white/20',
    medium: 'bg-white/20 backdrop-blur-md border border-white/30',
    strong: 'bg-white/30 backdrop-blur-lg border border-white/40'
  }
}

// Utility Classes Generator
export const generateThemeClasses = () => ({
  // Background utilities
  backgroundMain: socialBeautyTheme.colors.background.main,
  backgroundCard: socialBeautyTheme.colors.background.card,

  // Button utilities
  buttonPrimary: `${socialBeautyTheme.colors.buttons.primary} ${socialBeautyTheme.borderRadius.medium} ${socialBeautyTheme.spacing.button} transition-all`,
  buttonSecondary: `${socialBeautyTheme.colors.buttons.secondary} ${socialBeautyTheme.borderRadius.full} ${socialBeautyTheme.spacing.button} transition-all`,

  // Text utilities
  headingPrimary: `${socialBeautyTheme.typography.heading.h1} ${socialBeautyTheme.colors.text.white}`,
  textGradient: socialBeautyTheme.colors.text.gradient,

  // Card utilities
  cardPrimary: `${socialBeautyTheme.colors.background.card} ${socialBeautyTheme.borderRadius.large} ${socialBeautyTheme.spacing.card} ${socialBeautyTheme.shadows.card}`,

  // Glass utilities
  glassCard: `${socialBeautyTheme.glass.medium} ${socialBeautyTheme.borderRadius.large} ${socialBeautyTheme.spacing.card}`
})

export default socialBeautyTheme