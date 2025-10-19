/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        neon: {
          pink: '#ff0080',
          purple: '#8000ff',
          blue: '#0080ff',
          green: '#00ff80',
          yellow: '#ffff00',
          orange: '#ff8000',
        },
        beauty: {
          // Soft pastels for young women
          'blush': '#ffb3ba',
          'lavender': '#bae1ff',
          'mint': '#bffcc6',
          'peach': '#ffffba',
          'coral': '#ffdfba',
          'lilac': '#e6b3ff',

          // Rich beauty tones
          'rose-gold': '#e8b4a0',
          'dusty-rose': '#dcae96',
          'champagne': '#f7e7ce',
          'mauve': '#e0aaff',
          'sage': '#c9ada7',
          'cream': '#f8edeb',

          // Vibrant accents
          'hot-pink': '#ff006e',
          'electric-purple': '#8338ec',
          'ocean-blue': '#3a86ff',
          'lime-green': '#06ffa5',
          'sunset-orange': '#ffbe0b',

          // Instagram/TikTok inspired
          'insta-pink': '#e4405f',
          'insta-purple': '#833ab4',
          'insta-orange': '#fd5949',
          'tiktok-red': '#ff0050',
          'tiktok-blue': '#25f4ee',
          'tiktok-black': '#161823',

          // Glassmorphism support
          'glass-white': 'rgba(255, 255, 255, 0.25)',
          'glass-pink': 'rgba(255, 182, 193, 0.25)',
          'glass-purple': 'rgba(147, 112, 219, 0.25)',
          'glass-blue': 'rgba(173, 216, 230, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'sparkle': 'sparkle 0.8s ease-in-out infinite',
        'sparkle-mobile': 'sparkleMobile 0.6s ease-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'flip': 'flip 0.6s ease-in-out',

        // Beauty-specific animations
        'heart-beat': 'heartBeat 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'lipstick-swipe': 'lipstickSwipe 0.6s ease-out',
        'makeup-brush': 'makeupBrush 1.2s ease-in-out infinite',
        'nail-polish': 'nailPolish 0.8s ease-out',
        'beauty-pulse': 'beautyPulse 2s ease-in-out infinite',
        'glitter': 'glitter 3s ease-in-out infinite',
        'rose-bloom': 'roseBloom 1s ease-out',
        'mirror-flip': 'mirrorFlip 0.6s ease-in-out',
        'beauty-glow': 'beautyGlow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)', color: 'inherit' },
          '25%': { transform: 'rotateY(90deg)', color: '#ec4899' },
          '50%': { transform: 'rotateY(180deg)', color: '#9333ea' },
          '75%': { transform: 'rotateY(270deg)', color: '#3b82f6' },
          '100%': { transform: 'rotateY(360deg)', color: 'inherit' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        sparkle: {
          '0%, 100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '1',
            willChange: 'transform, opacity'
          },
          '50%': {
            transform: 'scale(1.15) rotate(180deg)',
            opacity: '0.7'
          },
        },
        sparkleMobile: {
          '0%, 100%': {
            transform: 'scale3d(1, 1, 1)',
            opacity: '1',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity'
          },
          '50%': {
            transform: 'scale3d(1.1, 1.1, 1)',
            opacity: '0.8'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 0, 128, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 0, 128, 0.8)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },

        // Beauty-specific keyframes
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1.15)' },
          '75%': { transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        lipstickSwipe: {
          '0%': { transform: 'translateX(-100%) rotate(-45deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%) rotate(-45deg)', opacity: '0' },
        },
        makeupBrush: {
          '0%, 100%': { transform: 'rotate(-5deg) translateY(0px)' },
          '50%': { transform: 'rotate(5deg) translateY(-5px)' },
        },
        nailPolish: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(0px) rotate(10deg)', opacity: '1' },
        },
        beautyPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 182, 193, 0.4)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(255, 182, 193, 0.8)',
            transform: 'scale(1.05)'
          },
        },
        glitter: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1) rotate(0deg)' },
          '25%': { opacity: '1', transform: 'scale(1.2) rotate(90deg)' },
          '50%': { opacity: '0.6', transform: 'scale(0.8) rotate(180deg)' },
          '75%': { opacity: '1', transform: 'scale(1.1) rotate(270deg)' },
        },
        roseBloom: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'scale(1) rotate(180deg)', opacity: '1' },
        },
        mirrorFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        beautyGlow: {
          '0%': {
            boxShadow: '0 0 20px rgba(255, 105, 180, 0.5), 0 0 40px rgba(255, 105, 180, 0.3)',
            filter: 'brightness(1)'
          },
          '100%': {
            boxShadow: '0 0 40px rgba(255, 105, 180, 0.8), 0 0 80px rgba(255, 105, 180, 0.6)',
            filter: 'brightness(1.2)'
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',

        // Beauty-inspired gradients
        'gradient-rose-gold': 'linear-gradient(135deg, #e8b4a0 0%, #dcae96 50%, #f7e7ce 100%)',
        'gradient-cotton-candy': 'linear-gradient(135deg, #ffb3ba 0%, #bae1ff 50%, #e6b3ff 100%)',
        'gradient-peachy-keen': 'linear-gradient(135deg, #ffffba 0%, #ffdfba 50%, #ffb3ba 100%)',
        'gradient-lavender-dreams': 'linear-gradient(135deg, #e0aaff 0%, #bae1ff 50%, #c9ada7 100%)',
        'gradient-mint-fresh': 'linear-gradient(135deg, #bffcc6 0%, #06ffa5 50%, #3a86ff 100%)',

        // Social media inspired
        'gradient-instagram': 'linear-gradient(135deg, #833ab4 0%, #fd5949 50%, #e4405f 100%)',
        'gradient-tiktok': 'linear-gradient(135deg, #ff0050 0%, #25f4ee 50%, #161823 100%)',
        'gradient-youtube': 'linear-gradient(135deg, #ff0000 0%, #ff4500 50%, #ff6347 100%)',

        // Glassmorphism backgrounds
        'gradient-glass-pink': 'linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(255, 182, 193, 0.1) 100%)',
        'gradient-glass-purple': 'linear-gradient(135deg, rgba(147, 112, 219, 0.3) 0%, rgba(147, 112, 219, 0.1) 100%)',
        'gradient-glass-blue': 'linear-gradient(135deg, rgba(173, 216, 230, 0.3) 0%, rgba(173, 216, 230, 0.1) 100%)',

        // Holographic/iridescent effects
        'gradient-holographic': 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #ff006e)',
        'gradient-rainbow': 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0080)',
        'gradient-aurora': 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 25%, #ff9a9e 50%, #fecfef 75%, #ffecd2 100%)',

        // Existing gradients (kept for compatibility)
        'gradient-beauty': 'linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00f5ff 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #4ecdc4 0%, #0080ff 100%)',
        'gradient-neon': 'linear-gradient(45deg, #ff0080, #8000ff, #0080ff, #00ff80)',
        'gradient-cyber': 'linear-gradient(135deg, #00f5ff 0%, #ff0080 50%, #8000ff 100%)',
        'gradient-genz': 'linear-gradient(270deg, #ff6b6b, #4ecdc4, #c7a2ff, #ffd93d)',
      },
      boxShadow: {
        // Soft beauty shadows
        'beauty-soft': '0 8px 32px rgba(255, 182, 193, 0.25), 0 4px 16px rgba(255, 182, 193, 0.15)',
        'peach-glow': '0 8px 32px rgba(255, 223, 186, 0.4), 0 4px 16px rgba(255, 223, 186, 0.2)',
        'lavender-mist': '0 8px 32px rgba(230, 179, 255, 0.3), 0 4px 16px rgba(230, 179, 255, 0.15)',
        'mint-fresh': '0 8px 32px rgba(191, 252, 198, 0.3), 0 4px 16px rgba(191, 252, 198, 0.15)',

        // Glassmorphism shadows
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-beauty': '0 8px 32px rgba(255, 182, 193, 0.37)',
        'glass-strong': '0 8px 32px rgba(31, 38, 135, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',

        // Instagram/Social media inspired
        'insta-story': '0 4px 20px rgba(228, 64, 95, 0.3), 0 0 0 1px rgba(228, 64, 95, 0.1)',
        'tiktok-vibe': '0 4px 20px rgba(255, 0, 80, 0.4), 0 0 0 1px rgba(37, 244, 238, 0.2)',

        // Neon beauty glows
        'rose-gold-glow': '0 0 30px rgba(232, 180, 160, 0.6), 0 0 60px rgba(232, 180, 160, 0.3)',
        'hot-pink-glow': '0 0 30px rgba(255, 0, 110, 0.7), 0 0 60px rgba(255, 0, 110, 0.4)',
        'electric-purple-glow': '0 0 30px rgba(131, 56, 236, 0.6), 0 0 60px rgba(131, 56, 236, 0.3)',
        'ocean-blue-glow': '0 0 30px rgba(58, 134, 255, 0.5), 0 0 60px rgba(58, 134, 255, 0.3)',

        // Heart/Love effects
        'heart-pink': '0 4px 20px rgba(255, 182, 193, 0.4), 0 0 0 2px rgba(255, 105, 180, 0.2)',
        'love-shadow': '0 8px 25px rgba(255, 20, 147, 0.3), 0 3px 10px rgba(255, 20, 147, 0.2)',

        // Existing shadows (kept for compatibility)
        'beauty': '0 10px 25px -5px rgba(255, 0, 128, 0.4), 0 10px 10px -5px rgba(255, 0, 128, 0.3)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(255, 0, 128, 0.5)',
        'neon': '0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.4)',
        'neon-pink': '0 0 30px rgba(255, 0, 128, 0.6), 0 0 60px rgba(255, 0, 128, 0.4)',
        'neon-purple': '0 0 30px rgba(128, 0, 255, 0.6), 0 0 60px rgba(128, 0, 255, 0.4)',
        'cyber': '0 0 40px rgba(0, 245, 255, 0.5), inset 0 0 40px rgba(255, 0, 128, 0.2)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}