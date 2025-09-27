# Design System

Cathcr's design system establishes a cohesive visual language centered around premium glassmorphism aesthetics, creating an elegant and modern user experience that feels both futuristic and approachable.

## Design Philosophy

### Core Principles

1. **Glassmorphism First**: Every interface element embraces translucent, layered glass effects
2. **AMOLED Black Foundation**: Deep black backgrounds maximize contrast and battery efficiency
3. **Thoughtful Typography**: SF Pro Compact Rounded provides warmth and readability
4. **Fluid Motion**: Smooth 60fps animations enhance the premium feel
5. **Accessible Contrast**: High contrast ratios ensure accessibility while maintaining aesthetics

### Visual Hierarchy
```
Primary Layer (Most Important)
├── Glass Cards with Strong Blur
├── Bright Blue-Purple Gradients
└── Bold Typography (600-700 weight)

Secondary Layer (Supporting)
├── Subtle Glass Effects
├── Muted Color Variants
└── Medium Typography (500 weight)

Tertiary Layer (Background)
├── AMOLED Black Base
├── Subtle Gradient Overlays
└── Light Typography (400 weight)
```

## Color System

### Primary Colors

```css
/* AMOLED Black Foundation */
--color-black: #000000;
--color-black-soft: #0a0a0a;
--color-black-muted: #141414;

/* Blue-Purple Gradient Spectrum */
--color-blue-50: #eff6ff;
--color-blue-100: #dbeafe;
--color-blue-200: #bfdbfe;
--color-blue-300: #93c5fd;
--color-blue-400: #60a5fa;
--color-blue-500: #3b82f6;  /* Primary Blue */
--color-blue-600: #2563eb;
--color-blue-700: #1d4ed8;
--color-blue-800: #1e40af;
--color-blue-900: #1e3a8a;

--color-purple-50: #faf5ff;
--color-purple-100: #f3e8ff;
--color-purple-200: #e9d5ff;
--color-purple-300: #d8b4fe;
--color-purple-400: #c084fc;
--color-purple-500: #a855f7;
--color-purple-600: #9333ea;  /* Primary Purple */
--color-purple-700: #7c3aed;
--color-purple-800: #6b21a8;
--color-purple-900: #581c87;
```

### Glass Morphism Colors

```css
/* Translucent Glass Effects */
--glass-white-10: rgba(255, 255, 255, 0.1);
--glass-white-15: rgba(255, 255, 255, 0.15);
--glass-white-20: rgba(255, 255, 255, 0.2);
--glass-white-25: rgba(255, 255, 255, 0.25);

/* Glass Borders */
--glass-border-subtle: rgba(255, 255, 255, 0.1);
--glass-border-medium: rgba(255, 255, 255, 0.2);
--glass-border-strong: rgba(255, 255, 255, 0.3);

/* Glass Shadows */
--glass-shadow-subtle: 0 4px 6px rgba(0, 0, 0, 0.1);
--glass-shadow-medium: 0 10px 25px rgba(0, 0, 0, 0.15);
--glass-shadow-strong: 0 20px 40px rgba(0, 0, 0, 0.2);
```

### Semantic Colors

```css
/* Status Colors */
--color-success: #10b981;
--color-success-glass: rgba(16, 185, 129, 0.15);

--color-warning: #f59e0b;
--color-warning-glass: rgba(245, 158, 11, 0.15);

--color-error: #ef4444;
--color-error-glass: rgba(239, 68, 68, 0.15);

--color-info: #3b82f6;
--color-info-glass: rgba(59, 130, 246, 0.15);

/* Text Colors */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.8);
--text-tertiary: rgba(255, 255, 255, 0.6);
--text-quaternary: rgba(255, 255, 255, 0.4);
```

### Gradient Definitions

```css
/* Primary Gradients */
--gradient-blue-purple: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
--gradient-purple-pink: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
--gradient-blue-cyan: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);

/* Glass Gradients */
--gradient-glass-subtle: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
--gradient-glass-medium: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
--gradient-glass-strong: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%);

/* Background Gradients */
--gradient-background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
--gradient-synth-wave: linear-gradient(45deg, #000000 0%, #0a0a0a 25%, #141414 50%, #0a0a0a 75%, #000000 100%);
```

## Typography System

### Font Family

```css
/* Primary Font Stack */
--font-family-primary: 'SF Pro Compact', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Fallback Stack */
--font-family-fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Monospace */
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

### Font Weights

```css
/* SF Pro Compact Rounded Weights */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Typography Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
--text-6xl: 3.75rem;    /* 60px */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Typography Components

```typescript
// Typography component definitions
export const Typography = {
  // Headers
  h1: {
    fontSize: 'var(--text-5xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--leading-tight)',
    letterSpacing: '-0.025em'
  },
  h2: {
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--leading-tight)',
    letterSpacing: '-0.025em'
  },
  h3: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--leading-snug)',
    letterSpacing: '-0.015em'
  },
  h4: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--leading-snug)',
    letterSpacing: '-0.015em'
  },
  h5: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--leading-normal)'
  },
  h6: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--leading-normal)'
  },

  // Body Text
  bodyLarge: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 'var(--leading-relaxed)'
  },
  body: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 'var(--leading-normal)'
  },
  bodySmall: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 'var(--leading-normal)'
  },

  // UI Text
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--leading-none)',
    letterSpacing: '0.025em'
  },
  caption: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 'var(--leading-normal)',
    letterSpacing: '0.025em'
  },
  button: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--leading-none)',
    letterSpacing: '0.025em'
  }
};
```

## Spacing System

### Spacing Scale

```css
/* Spacing Scale (based on 4px grid) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
--space-40: 10rem;    /* 160px */
--space-48: 12rem;    /* 192px */
--space-56: 14rem;    /* 224px */
--space-64: 16rem;    /* 256px */
```

### Semantic Spacing

```css
/* Component Spacing */
--spacing-xs: var(--space-1);     /* 4px */
--spacing-sm: var(--space-2);     /* 8px */
--spacing-md: var(--space-4);     /* 16px */
--spacing-lg: var(--space-6);     /* 24px */
--spacing-xl: var(--space-8);     /* 32px */
--spacing-2xl: var(--space-12);   /* 48px */
--spacing-3xl: var(--space-16);   /* 64px */

/* Layout Spacing */
--layout-xs: var(--space-4);      /* 16px */
--layout-sm: var(--space-6);      /* 24px */
--layout-md: var(--space-8);      /* 32px */
--layout-lg: var(--space-12);     /* 48px */
--layout-xl: var(--space-16);     /* 64px */
--layout-2xl: var(--space-24);    /* 96px */
```

## Border Radius System

```css
/* Border Radius Scale */
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-base: 0.25rem;   /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;

/* Semantic Radius */
--radius-button: var(--radius-lg);
--radius-card: var(--radius-2xl);
--radius-modal: var(--radius-3xl);
--radius-input: var(--radius-xl);
```

## Glass Morphism Properties

### Backdrop Blur Effects

```css
/* Backdrop Blur Levels */
--blur-none: 0;
--blur-sm: 4px;
--blur-base: 8px;
--blur-md: 12px;
--blur-lg: 16px;
--blur-xl: 24px;
--blur-2xl: 40px;
--blur-3xl: 64px;

/* Glass Blur Presets */
--glass-blur-subtle: blur(var(--blur-sm));
--glass-blur-medium: blur(var(--blur-md));
--glass-blur-strong: blur(var(--blur-xl));
--glass-blur-intense: blur(var(--blur-2xl));
```

### Glass Effect Combinations

```css
/* Glass Component Presets */
.glass-card {
  background: var(--glass-white-15);
  backdrop-filter: var(--glass-blur-medium);
  border: 1px solid var(--glass-border-medium);
  box-shadow: var(--glass-shadow-medium);
}

.glass-modal {
  background: var(--glass-white-20);
  backdrop-filter: var(--glass-blur-strong);
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--glass-shadow-strong);
}

.glass-button {
  background: var(--glass-white-10);
  backdrop-filter: var(--glass-blur-subtle);
  border: 1px solid var(--glass-border-subtle);
  box-shadow: var(--glass-shadow-subtle);
}

.glass-input {
  background: var(--glass-white-10);
  backdrop-filter: var(--glass-blur-medium);
  border: 1px solid var(--glass-border-medium);
}
```

## Animation System

### Timing Functions

```css
/* Easing Curves */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Custom Eases */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-glass: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration Scale

```css
/* Animation Durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-medium: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;

/* Interaction Durations */
--duration-hover: var(--duration-fast);
--duration-focus: var(--duration-fast);
--duration-press: var(--duration-normal);
--duration-modal: var(--duration-medium);
--duration-page: var(--duration-slow);
```

### Animation Presets

```css
/* Common Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glassShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Animation Classes */
.animate-fade-in {
  animation: fadeIn var(--duration-medium) var(--ease-out);
}

.animate-slide-up {
  animation: slideUp var(--duration-medium) var(--ease-out);
}

.animate-scale-in {
  animation: scaleIn var(--duration-medium) var(--ease-glass);
}

.animate-glass-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  background-size: 200% 100%;
  animation: glassShimmer 2s infinite;
}
```

## Z-Index System

```css
/* Z-Index Scale */
--z-base: 1;
--z-docked: 10;
--z-dropdown: 1000;
--z-sticky: 1100;
--z-banner: 1200;
--z-overlay: 1300;
--z-modal: 1400;
--z-popover: 1500;
--z-skipLink: 1600;
--z-toast: 1700;
--z-tooltip: 1800;
```

## Design Tokens Implementation

### CSS Custom Properties

```css
/* Root Variables */
:root {
  /* Colors */
  --color-primary: var(--color-blue-500);
  --color-secondary: var(--color-purple-600);
  --color-background: var(--color-black);

  /* Typography */
  --font-family: var(--font-family-primary);
  --font-size: var(--text-base);
  --font-weight: var(--font-weight-normal);

  /* Spacing */
  --spacing: var(--spacing-md);

  /* Borders */
  --border-radius: var(--radius-card);
  --border-width: 1px;

  /* Shadows */
  --shadow: var(--glass-shadow-medium);

  /* Transitions */
  --transition: all var(--duration-normal) var(--ease-smooth);
}

/* Dark mode (default) */
:root {
  color-scheme: dark;
}

/* Light mode override (if needed) */
:root[data-theme="light"] {
  --color-background: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: rgba(31, 41, 55, 0.8);
  /* Override other colors as needed */
}
```

### TypeScript Tokens

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    black: '#000000',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    glass: {
      white10: 'rgba(255, 255, 255, 0.1)',
      white15: 'rgba(255, 255, 255, 0.15)',
      white20: 'rgba(255, 255, 255, 0.2)',
    }
  },
  typography: {
    fontFamily: {
      primary: '"SF Pro Compact", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  borderRadius: {
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      medium: '300ms',
      slow: '500ms'
    },
    ease: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      glass: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
} as const;

export type DesignTokens = typeof tokens;
```

## Responsive Design System

### Breakpoints

```css
/* Responsive Breakpoints */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */
```

### Container Sizes

```css
/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Responsive Container */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

@media (min-width: 640px) {
  .container { max-width: var(--container-sm); }
}

@media (min-width: 768px) {
  .container { max-width: var(--container-md); }
}

@media (min-width: 1024px) {
  .container { max-width: var(--container-lg); }
}

@media (min-width: 1280px) {
  .container { max-width: var(--container-xl); }
}

@media (min-width: 1536px) {
  .container { max-width: var(--container-2xl); }
}
```

This comprehensive design system provides the foundation for consistent, beautiful, and maintainable UI development across the entire Cathcr platform while maintaining the premium glassmorphism aesthetic.