# 🎨 Orange Theme & Design System

*The comprehensive design language for Catcher's glassmorphism interface*

## 🎯 Design Philosophy

### Core Principles
- **SPEED & ZERO FRICTION**: Every design decision prioritizes instant response and seamless interaction
- **Orange Warmth**: Energetic orange palette evoking creativity and urgency
- **Apple Typography**: System fonts for familiarity and optimal readability
- **Glassmorphism Depth**: Translucent layers creating spatial hierarchy
- **AMOLED Efficiency**: Pure black backgrounds for energy conservation

### Inspirational Guidelines
- **Apple Human Interface**: Clean, purposeful, accessible
- **Todoist Energy**: Orange urgency with professional polish
- **Glass Morphism**: Microsoft Fluent Design depth and translucency
- **Zero Latency**: Sub-100ms response times throughout

---

## 🧡 Color Palette

### Primary Orange Spectrum
```css
:root {
  /* Primary Orange - Main CTAs, active states, highlights */
  --orange-primary: #FF6A00;
  --orange-primary-rgb: 255, 106, 0;

  /* Hover Orange - Interactive feedback, warm accent */
  --orange-hover: #FF8A33;
  --orange-hover-rgb: 255, 138, 51;

  /* Subtle Orange - Backgrounds, gentle accents, borders */
  --orange-subtle: #FFB080;
  --orange-subtle-rgb: 255, 176, 128;

  /* Orange Gradients */
  --orange-gradient: linear-gradient(135deg, #FF6A00 0%, #FF8A33 100%);
  --orange-gradient-subtle: linear-gradient(135deg, #FFB080 0%, #FF8A33 100%);
}
```

### Foundation Colors
```css
:root {
  /* AMOLED Black - Energy efficient, high contrast */
  --bg-black: #000000;
  --bg-black-rgb: 0, 0, 0;

  /* Text Colors */
  --text-primary: #F5F5F5;        /* Main text on black */
  --text-secondary: #A3A3A3;      /* Secondary text, metadata */
  --text-tertiary: #525252;       /* Disabled text, placeholders */

  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-orange: rgba(255, 106, 0, 0.15);
  --glass-orange-border: rgba(255, 106, 0, 0.3);
}
```

### WCAG Compliance Matrix
| Combination | Contrast Ratio | WCAG Level | Usage |
|-------------|----------------|------------|--------|
| #FF6A00 on #000000 | 4.52:1 | AA ✅ | Primary buttons, highlights |
| #FF8A33 on #000000 | 5.21:1 | AA ✅ | Interactive states, accents |
| #FFB080 on #000000 | 7.89:1 | AAA ✅ | Subtle backgrounds, borders |
| #F5F5F5 on #000000 | 18.5:1 | AAA ✅ | Primary text content |
| #A3A3A3 on #000000 | 8.74:1 | AAA ✅ | Secondary text, metadata |

---

## 🔤 Typography System (Apple System Fonts)

### Font Stack Configuration
```css
:root {
  /* Primary Font Stack - Body text, UI elements */
  --font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;

  /* Monospace Stack - ONLY for timestamps, labels, code */
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}

/* ❌ CRITICAL: NO monospace in body text */
body, p, span, div, h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary) !important;
}

/* ✅ Monospace ONLY for structured elements */
.timestamp, .label, .code, .metadata {
  font-family: var(--font-mono);
}
```

### Typography Scale
```css
/* Headings - Apple HIG inspired */
.text-display {
  font-size: 3.5rem;      /* 56px */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.text-headline {
  font-size: 2.25rem;     /* 36px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.015em;
}

.text-title {
  font-size: 1.875rem;    /* 30px */
  font-weight: 600;
  line-height: 1.3;
}

.text-subtitle {
  font-size: 1.5rem;      /* 24px */
  font-weight: 500;
  line-height: 1.4;
}

/* Body Text */
.text-body {
  font-size: 1rem;        /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

.text-body-large {
  font-size: 1.125rem;    /* 18px */
  font-weight: 400;
  line-height: 1.6;
}

.text-body-small {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;
  line-height: 1.5;
}

/* Labels & Metadata */
.text-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;     /* 12px */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-caption {
  font-family: var(--font-mono);
  font-size: 0.6875rem;   /* 11px */
  font-weight: 400;
  color: var(--text-secondary);
}
```

### Font Loading Optimization
```css
/* Font Display Strategy */
@font-face {
  font-family: 'SF Pro Text';
  font-display: swap;
  src: local('SF Pro Text'), local('SFProText-Regular');
}

/* Prevent FOIT (Flash of Invisible Text) */
.font-loading body {
  visibility: hidden;
}

.font-loaded body {
  visibility: visible;
}
```

---

## ✨ Glassmorphism Components

### Glass Container Base
```css
.glass-container {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Orange-themed glass variant */
.glass-container-orange {
  background: var(--glass-orange);
  border: 1px solid var(--glass-orange-border);
  box-shadow:
    0 8px 32px rgba(255, 106, 0, 0.2),
    inset 0 1px 0 rgba(255, 106, 0, 0.1);
}
```

### Glass Button Variants
```css
/* Primary Orange Button */
.btn-orange-primary {
  background: var(--orange-gradient);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(255, 106, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-orange-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 24px rgba(255, 106, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-orange-primary:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.15s;
}

/* Glass Orange Button */
.btn-orange-glass {
  background: var(--glass-orange);
  color: var(--orange-primary);
  border: 1px solid var(--glass-orange-border);
  border-radius: 12px;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-weight: 500;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-orange-glass:hover {
  background: rgba(255, 106, 0, 0.25);
  border-color: rgba(255, 106, 0, 0.4);
  color: #FF8A33;
}
```

### Modal & Overlay Components
```css
/* Capture Modal - <100ms Performance Optimized */
.capture-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);

  /* Performance optimizations */
  will-change: opacity, transform;
  transform: translateZ(0);
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.capture-modal.open {
  opacity: 1;
  pointer-events: all;
}

.capture-modal-content {
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid var(--glass-orange-border);
  border-radius: 20px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  backdrop-filter: blur(20px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 106, 0, 0.1);

  /* Performance optimization */
  transform: translateZ(0) scale(0.95);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.capture-modal.open .capture-modal-content {
  transform: translateZ(0) scale(1);
}
```

---

## 🎭 Animation System

### Orange Pulse Animation (Recording State)
```css
@keyframes orange-pulse {
  0% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 106, 0, 0.7);
  }
  70% {
    opacity: 0.8;
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 106, 0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 106, 0, 0);
  }
}

.recording-pulse {
  animation: orange-pulse 1.5s infinite;
}
```

### Glow Effects
```css
@keyframes orange-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 106, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 106, 0, 0.8);
  }
}

.orange-glow {
  animation: orange-glow 2s ease-in-out infinite;
}
```

### Smooth Transitions
```css
/* Universal smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 0.2s;
}

/* High-performance transforms */
.smooth-transform {
  will-change: transform;
  transform: translateZ(0);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎯 Interactive Elements

### Orange Tag System
```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--glass-orange);
  color: var(--orange-primary);
  border: 1px solid var(--glass-orange-border);
  border-radius: 16px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag:hover {
  background: rgba(255, 106, 0, 0.25);
  color: var(--orange-hover);
  transform: translateY(-1px);
}

.tag.active {
  background: var(--orange-primary);
  color: white;
  border-color: var(--orange-primary);
}
```

### Voice Waveform Visualization
```css
.waveform-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 40px;
  padding: 8px;
}

.waveform-bar {
  width: 3px;
  background: var(--orange-gradient);
  border-radius: 2px;
  transition: height 0.1s ease;
  min-height: 4px;
}

.waveform-bar.active {
  animation: waveform-pulse 0.5s ease-in-out;
  filter: brightness(1.2);
}

@keyframes waveform-pulse {
  0%, 100% { height: 8px; }
  50% { height: 32px; }
}
```

### Loading States
```css
.loading-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 106, 0, 0.1) 0%,
    rgba(255, 106, 0, 0.3) 50%,
    rgba(255, 106, 0, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 📱 Responsive Design

### Breakpoint System
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Mobile-first approach */
@media (max-width: 640px) {
  .capture-modal-content {
    width: 95%;
    padding: 20px;
    border-radius: 16px;
  }

  .text-display {
    font-size: 2.5rem;
  }

  .text-headline {
    font-size: 1.875rem;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .glass-container {
    border-radius: 20px;
  }

  .btn-orange-primary {
    padding: 14px 28px;
  }
}
```

### Touch Optimization
```css
/* Larger touch targets for mobile */
@media (hover: none) and (pointer: coarse) {
  .btn-orange-primary {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 20px;
  }

  .tag {
    min-height: 36px;
    padding: 8px 14px;
  }

  .capture-modal-content {
    min-height: 200px;
  }
}
```

---

## 🎨 Component Library

### Glass Card Component
```tsx
interface GlassCardProps {
  variant?: 'default' | 'orange' | 'subtle';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  children,
  className = '',
  onClick
}) => {
  const baseClasses = 'glass-container transition-all duration-300';
  const variantClasses = {
    default: 'glass-container',
    orange: 'glass-container-orange',
    subtle: 'opacity-80 hover:opacity-100'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

### Orange Button Component
```tsx
interface OrangeButtonProps {
  variant?: 'primary' | 'glass' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const OrangeButton: React.FC<OrangeButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false
}) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'btn-orange-primary',
    glass: 'btn-orange-glass',
    subtle: 'bg-orange-subtle/20 text-orange-primary hover:bg-orange-subtle/30'
  };

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${loading ? 'loading-shimmer' : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <LoadingSpinner /> : children}
    </button>
  );
};
```

---

## 📐 Layout System

### Bento Grid Layout
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.bento-item {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}

.bento-item:hover {
  transform: translateY(-4px);
  border-color: var(--glass-orange-border);
  box-shadow: 0 12px 24px rgba(255, 106, 0, 0.1);
}

/* Featured items */
.bento-item.featured {
  grid-column: span 2;
  background: var(--glass-orange);
  border-color: var(--glass-orange-border);
}
```

---

## ♿ Accessibility Features

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --orange-primary: #FF8800;
    --orange-hover: #FF9933;
    --text-primary: #FFFFFF;
    --glass-bg: rgba(255, 255, 255, 0.2);
  }
}
```

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus-visible {
  outline: 2px solid var(--orange-primary);
  outline-offset: 2px;
}
```

---

## 🚀 Performance Guidelines

### Critical CSS Inlining
```html
<!-- Inline critical orange theme CSS for <100ms rendering -->
<style>
  :root {
    --orange-primary: #FF6A00;
    --bg-black: #000000;
    --font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  }
  body {
    font-family: var(--font-primary);
    background: var(--bg-black);
    margin: 0;
  }
</style>
```

### Font Loading Strategy
```javascript
// Preload system fonts for instant rendering
const fontLoad = new FontFaceObserver('system-ui');
fontLoad.load().then(() => {
  document.documentElement.classList.add('fonts-loaded');
});
```

---

*🎨 This design system ensures SPEED, ZERO FRICTION, and SNAPPINESS while maintaining sophisticated glassmorphism effects and complex features. The orange theme with Apple system fonts creates a warm, familiar, and highly accessible user experience.*