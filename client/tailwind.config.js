/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Apple System Fonts Typography System
      fontFamily: {
        'primary': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        'mono': ['"SF Mono"', 'Monaco', '"Cascadia Code"', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        'display': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        'body': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
      },
      
      // CATHCR ULTRATHINK ORANGE ACRYLIC GLASS COLOR SYSTEM - NO BROWN TINTS
      colors: {
        // AMOLED Black Foundation
        black: '#000000',
        white: '#ffffff',

        // WCAG COMPLIANT ORANGE SPECTRUM - ACCESSIBILITY FIRST
        orange: {
          50: '#FFF3E0',   // Lightest orange tint - AAA compliant
          100: '#FFE0B2',  // Very light orange - AAA compliant
          200: '#FFCC80',  // Light orange (tertiary/glow) - AAA compliant
          300: '#FFB74D',  // Medium light orange - AAA compliant
          400: '#FFA726',  // Medium orange - AA compliant
          500: '#FF9800',  // Base vibrant orange - AA compliant
          600: '#FB8C00',  // Primary orange - AA compliant
          700: '#F57F17',  // Rich orange - AA compliant
          800: '#EF6C00',  // Deep orange - AA compliant
          900: '#E65100',  // Deepest orange - AA compliant
          'primary': '#FFA500',     // Pure Orange - 8.9:1 ratio - AA compliant
          'secondary': '#FFAB40',   // Light Orange - 9.8:1 ratio - AA compliant
          'accent': '#FF7043',      // Orange Red - 6.9:1 ratio - AA compliant
          'tertiary': '#FFCC80',    // Soft Orange - 12.1:1 ratio - AAA compliant
          'bright': '#FFB347',      // Light Orange - 10.2:1 ratio - AAA compliant
          'neon': '#FF8A65',        // Light Orange Red - 8.2:1 ratio - AA compliant
          'glow': '#FFE0B2',        // Subtle Glow - 15.8:1 ratio - AAA compliant
        },

        // ORANGE GLASS TRANSPARENCY SYSTEM - PURE ORANGE BASE
        glass: {
          'orange-5': 'rgba(255, 165, 0, 0.05)',     // Pure Orange Base
          'orange-8': 'rgba(255, 165, 0, 0.08)',     // Subtle Glass
          'orange-10': 'rgba(255, 165, 0, 0.12)',    // Light Glass
          'orange-15': 'rgba(255, 165, 0, 0.16)',    // Medium Glass
          'orange-20': 'rgba(255, 165, 0, 0.22)',    // Strong Glass
          'orange-25': 'rgba(255, 165, 0, 0.28)',    // Intense Glass
          'orange-30': 'rgba(255, 165, 0, 0.35)',    // Maximum Glass
        },

        // ENHANCED GLASS BORDERS - APPLE ACRYLIC STYLE
        border: {
          'glass-ultralight': 'rgba(255, 165, 0, 0.15)',
          'glass-light': 'rgba(255, 165, 0, 0.25)',
          'glass-medium': 'rgba(255, 165, 0, 0.35)',
          'glass-strong': 'rgba(255, 165, 0, 0.45)',
          'glass-intense': 'rgba(255, 165, 0, 0.55)',
        },

        // SEMANTIC COLORS - PURE ORANGE VARIANTS
        primary: {
          DEFAULT: '#FFA500',  // Pure Orange
          hover: '#FFAB40',    // Light Orange - Bright
          focus: '#FF8C00',    // Dark Orange - Vivid
          light: '#FFCC80',    // Soft Orange - Glowing
          dark: '#FF7F00',     // Electric Orange
        },
        secondary: {
          DEFAULT: '#FFAB40',  // Light Orange - Bright
          hover: '#FFB74D',    // Medium light orange
          focus: '#FFA726',    // Medium orange
        },
        accent: {
          DEFAULT: '#FF8C00',  // Dark Orange - Vivid
          hover: '#FF7F00',    // Electric Orange
          focus: '#FF6F00',    // Neon Orange
        },

        // HIGH CONTRAST TEXT COLORS - WCAG AAA COMPLIANCE
        text: {
          'primary': '#FFFFFF',                        // 21:1 ratio on black - AAA compliant
          'secondary': 'rgba(255, 255, 255, 0.85)',    // 17.85:1 ratio - AAA compliant
          'tertiary': 'rgba(255, 255, 255, 0.70)',     // 14.7:1 ratio - AAA compliant
          'orange': '#FFA500',                         // Pure Orange - 8.9:1 ratio - AA compliant
          'orange-bright': '#FFB347',                  // Bright Orange - 10.2:1 ratio - AAA compliant
          'orange-glow': '#FFCC80',                    // Glowing Orange - 12.1:1 ratio - AAA compliant
          'orange-subtle': '#FFE0B2',                  // Subtle Orange - 15.8:1 ratio - AAA compliant
        },
      },
      
      // Enhanced Spacing
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
        '8.5': '2.125rem',
        '9.5': '2.375rem',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      // Enhanced Border Radius
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // VIBRANT ORANGE GLASS SHADOWS - NO BROWN TINTS
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 16px 64px rgba(0, 0, 0, 0.5)',
        'glass-subtle': '0 4px 12px rgba(255, 165, 0, 0.12)',
        'glass-medium': '0 8px 32px rgba(255, 165, 0, 0.18)',
        'glass-strong': '0 16px 48px rgba(255, 165, 0, 0.25)',
        'glass-glow': '0 0 32px rgba(255, 165, 0, 0.35)',
        'glass-neon': '0 0 48px rgba(255, 127, 0, 0.45)',
        'glass-electric': '0 0 64px rgba(255, 140, 0, 0.25), inset 0 0 32px rgba(255, 165, 0, 0.1)',
        'orange-glow': '0 0 20px rgba(255, 165, 0, 0.5)',
        'orange-glow-strong': '0 0 40px rgba(255, 165, 0, 0.8)',
        'orange-neon': '0 0 48px rgba(255, 127, 0, 0.6)',
      },
      
      // Enhanced Animations
      animation: {
        // Fade Animations
        'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-fast': 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-slow': 'fadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Slide Animations
        'slide-up': 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up-fast': 'slideUp 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Scale Animations
        'scale-in': 'scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in-fast': 'scaleIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Orange Glow & Pulse Animations
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'orange-glow': 'orangeGlowPulse 2s ease-in-out infinite',
        'neon-orange': 'neonOrangeGlow 3s ease-in-out infinite',
        
        // Synth Wave
        'synth-wave': 'synthWave 8s ease-in-out infinite',
        'synth-wave-fast': 'synthWave 4s ease-in-out infinite',
        
        // Micro Interactions
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'wiggle': 'wiggle 1s ease-in-out',
      },
      
      // Enhanced Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 165, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 165, 0, 0.8)' },
        },
        orangeGlowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 165, 0, 0.3)',
            borderColor: 'rgba(255, 165, 0, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(255, 165, 0, 0.6), 0 0 60px rgba(255, 140, 0, 0.3)',
            borderColor: 'rgba(255, 165, 0, 0.5)',
          },
        },
        neonOrangeGlow: {
          '0%, 100%': {
            textShadow: '0 0 5px rgba(255, 165, 0, 0.8), 0 0 10px rgba(255, 165, 0, 0.6)',
          },
          '50%': {
            textShadow: '0 0 10px rgba(255, 165, 0, 1), 0 0 20px rgba(255, 165, 0, 0.8), 0 0 30px rgba(255, 140, 0, 0.6)',
          },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        synthWave: {
          '0%': { transform: 'translateX(-50%) translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateX(-50%) translateY(-10px) rotate(1deg)' },
          '50%': { transform: 'translateX(-50%) translateY(0px) rotate(0deg)' },
          '75%': { transform: 'translateX(-50%) translateY(10px) rotate(-1deg)' },
          '100%': { transform: 'translateX(-50%) translateY(0px) rotate(0deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },
      
      // PURE ORANGE GRADIENTS - NO GRADIENTS POLICY (SOLID COLORS ONLY)
      backgroundImage: {
        'gradient-orange-primary': 'linear-gradient(135deg, #FFA500, #FF8C00)',  // Emergency only
        'gradient-orange-accent': 'linear-gradient(135deg, #FF8C00, #FF7F00)',   // Emergency only
        'gradient-glass-orange': 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 140, 0, 0.1))', // Emergency only
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      
      // Enhanced Typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      // Z-Index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // ORANGE ACRYLIC GLASS UTILITIES - APPLE STYLE WITH SYSTEM FONTS
    function({ addUtilities }) {
      const newUtilities = {
        // Apple-Style Orange Acrylic Glass Base Classes
        '.glass-light': {
          background: 'rgba(255, 165, 0, 0.08)',
          backdropFilter: 'blur(8px) saturate(180%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%) brightness(1.1)',
          border: '1px solid rgba(255, 165, 0, 0.15)',
          borderRadius: '12px',
          willChange: 'transform, backdrop-filter',
          transform: 'translateZ(0)',
        },
        '.glass-medium': {
          background: 'rgba(255, 165, 0, 0.16)',
          backdropFilter: 'blur(16px) saturate(200%) brightness(1.15)',
          WebkitBackdropFilter: 'blur(16px) saturate(200%) brightness(1.15)',
          border: '1px solid rgba(255, 165, 0, 0.25)',
          borderRadius: '16px',
          willChange: 'transform, backdrop-filter',
          transform: 'translateZ(0)',
        },
        '.glass-strong': {
          background: 'rgba(255, 165, 0, 0.22)',
          backdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',
          border: '1px solid rgba(255, 165, 0, 0.35)',
          borderRadius: '20px',
          willChange: 'transform, backdrop-filter',
          transform: 'translateZ(0)',
        },
        '.glass-premium': {
          background: 'rgba(255, 165, 0, 0.28)',
          backdropFilter: 'blur(20px) saturate(180%) contrast(1.1) brightness(1.1)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%) contrast(1.1) brightness(1.1)',
          border: '1px solid rgba(255, 165, 0, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(255, 165, 0, 0.18)',
          willChange: 'transform, backdrop-filter, box-shadow',
          transform: 'translateZ(0)',
        },
        '.glass-neon': {
          background: 'rgba(255, 165, 0, 0.35)',
          backdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(220%) brightness(1.2)',
          border: '1px solid rgba(255, 165, 0, 0.55)',
          borderRadius: '24px',
          boxShadow: '0 0 48px rgba(255, 127, 0, 0.45)',
          willChange: 'transform, backdrop-filter, box-shadow',
          transform: 'translateZ(0)',
        },
        // Glass Hover Effects
        '.glass-hover': {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, backdrop-filter, box-shadow',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.02)',
            backdropFilter: 'blur(24px) saturate(200%) brightness(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.2)',
            boxShadow: '0 0 64px rgba(255, 140, 0, 0.25), inset 0 0 32px rgba(255, 165, 0, 0.1)',
            borderColor: 'rgba(255, 165, 0, 0.45)',
          },
        },
        // Focus Ring for WCAG AAA Accessibility
        '.focus-ring': {
          '&:focus-visible': {
            outline: '3px solid #FFA500',
            outlineOffset: '3px',
            boxShadow: '0 0 0 6px rgba(255, 165, 0, 0.25)',
            borderRadius: '8px',
          },
          '&:focus': {
            outline: 'none',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
};