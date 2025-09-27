# Animation Patterns

This document defines the animation system for Cathcr, focusing on smooth 60fps animations that enhance the premium glassmorphism experience while maintaining excellent performance and accessibility.

## Animation Philosophy

### Core Principles

1. **Purposeful Motion**: Every animation serves a functional purpose
2. **Smooth Performance**: All animations target 60fps performance
3. **Glassmorphism Enhancement**: Animations complement the glass aesthetic
4. **Accessibility First**: Respect user motion preferences
5. **Consistent Timing**: Standardized durations and easing curves

### Motion Hierarchy

```
Primary Animations (User Actions)
├── Button interactions
├── Modal transitions
└── Page transitions

Secondary Animations (Feedback)
├── Loading states
├── Success/error feedback
└── Hover effects

Ambient Animations (Atmosphere)
├── Background wave effects
├── Subtle glass shimmers
└── Breathing UI elements
```

## Timing and Easing

### Duration Scale

```css
/* Animation Duration Tokens */
:root {
  /* Micro-interactions */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-quick: 200ms;

  /* Standard interactions */
  --duration-normal: 300ms;
  --duration-medium: 400ms;
  --duration-slow: 500ms;

  /* Complex transitions */
  --duration-slower: 700ms;
  --duration-slowest: 1000ms;

  /* Ambient animations */
  --duration-ambient: 2000ms;
  --duration-breathing: 3000ms;
}
```

### Easing Functions

```css
/* Easing Curve Tokens */
:root {
  /* Standard easing */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Custom glass easing */
  --ease-glass: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-glass-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-glass-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* Specialized easing */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-back: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-anticipate: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Easing Usage Guidelines */
.interaction-ease {
  /* User interactions: fast and responsive */
  transition: all var(--duration-fast) var(--ease-out);
}

.glass-ease {
  /* Glass element animations: smooth and organic */
  transition: all var(--duration-normal) var(--ease-glass);
}

.modal-ease {
  /* Modal and overlay animations: gentle entrance */
  transition: all var(--duration-medium) var(--ease-glass-bounce);
}
```

## Core Animation Patterns

### Fade Animations

```css
/* Fade In/Out Keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade Animation Classes */
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.animate-fade-in-up {
  animation: fadeInUp var(--duration-normal) var(--ease-glass);
}

.animate-fade-in-down {
  animation: fadeInDown var(--duration-normal) var(--ease-glass);
}
```

### Scale Animations

```css
/* Scale Animation Keyframes */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes scaleInBounce {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Scale Animation Classes */
.animate-scale-in {
  animation: scaleIn var(--duration-normal) var(--ease-glass);
}

.animate-scale-in-bounce {
  animation: scaleInBounce var(--duration-medium) var(--ease-glass-bounce);
}

/* Interactive Scale Effects */
.scale-hover {
  transition: transform var(--duration-fast) var(--ease-out);
}

.scale-hover:hover {
  transform: scale(1.02);
}

.scale-press {
  transition: transform var(--duration-instant) var(--ease-out);
}

.scale-press:active {
  transform: scale(0.98);
}
```

### Glass-Specific Animations

```css
/* Glass Shimmer Effect */
@keyframes glassShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.glass-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  background-size: 200% 100%;
  animation: glassShimmer var(--duration-ambient) infinite ease-in-out;
}

/* Glass Breathing Effect */
@keyframes glassBreathing {
  0%, 100% {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  50% {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.glass-breathing {
  animation: glassBreathing var(--duration-breathing) infinite ease-in-out;
}

/* Glass Morph Animation */
@keyframes glassMorph {
  0%, 100% {
    border-radius: 16px;
    backdrop-filter: blur(12px);
  }
  50% {
    border-radius: 24px;
    backdrop-filter: blur(16px);
  }
}

.glass-morph {
  animation: glassMorph 4s infinite ease-in-out;
}

/* Glass Glow Pulse */
@keyframes glassGlowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
  }
}

.glass-glow-pulse {
  animation: glassGlowPulse var(--duration-ambient) infinite ease-in-out;
}
```

## Framer Motion Patterns

### Component Animations

```typescript
// Common Framer Motion variants
export const animationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Glass modal animation
  glassModal: {
    initial: { opacity: 0, scale: 0.95, backdrop: 0 },
    animate: {
      opacity: 1,
      scale: 1,
      backdrop: 1,
      transition: {
        duration: 0.4,
        ease: [0.68, -0.55, 0.265, 1.55],
        backdrop: { duration: 0.3 }
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      backdrop: 0,
      transition: { duration: 0.2 }
    }
  },

  // Stagger children animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }
};

// Usage example
export const AnimatedGlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={animationVariants.scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card"
    >
      {children}
    </motion.div>
  );
};
```

### Page Transitions

```typescript
// Page transition variants
export const pageTransitions = {
  slideLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  slideRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Page wrapper component
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={pageTransitions.fadeSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-transition"
    >
      {children}
    </motion.div>
  );
};
```

## Interactive Animations

### Button Interactions

```typescript
// Button animation component
export const AnimatedButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        y: -1,
        transition: { duration: 0.15, ease: [0, 0, 0.2, 1] }
      }}
      whileTap={{
        scale: 0.98,
        y: 0,
        transition: { duration: 0.1, ease: [0, 0, 0.2, 1] }
      }}
      whileFocus={{
        scale: 1.02,
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.4)",
        transition: { duration: 0.15 }
      }}
      className="glass-button"
      {...props}
    >
      {children}
    </motion.button>
  );
};
```

### Card Hover Effects

```typescript
// Card hover animation
export const InteractiveCard: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      className="glass-card interactive"
      {...props}
    >
      <motion.div
        initial={false}
        whileHover={{
          background: "rgba(255, 255, 255, 0.15)",
          transition: { duration: 0.2 }
        }}
        className="card-content"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
```

## Loading and Feedback Animations

### Loading Spinners

```css
/* Glass Loading Spinner */
@keyframes glassSpinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.glass-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-top: 2px solid rgba(255, 255, 255, 0.8);
  border-right: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: glassSpinner 1s linear infinite;
}

/* Pulsing Dots Loader */
@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.glass-dots-loader {
  display: flex;
  gap: 4px;
}

.glass-dots-loader > div {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.glass-dots-loader > div:nth-child(2) {
  animation-delay: 0.2s;
}

.glass-dots-loader > div:nth-child(3) {
  animation-delay: 0.4s;
}
```

### Success/Error Feedback

```typescript
// Feedback animation component
export const FeedbackAnimation: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const variants = {
    success: {
      initial: { scale: 0, rotate: -180 },
      animate: {
        scale: 1,
        rotate: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      }
    },
    error: {
      initial: { x: -10 },
      animate: {
        x: [0, 10, -10, 0],
        transition: {
          duration: 0.4,
          times: [0, 0.25, 0.75, 1]
        }
      }
    },
    warning: {
      initial: { y: -10, opacity: 0 },
      animate: {
        y: [0, -5, 0],
        opacity: 1,
        transition: {
          duration: 0.5,
          times: [0, 0.5, 1]
        }
      }
    },
    info: {
      initial: { scale: 0.8, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3 }
      }
    }
  };

  return (
    <motion.div
      variants={variants[type]}
      initial="initial"
      animate="animate"
      className={`feedback-${type}`}
    >
      {children}
    </motion.div>
  );
};
```

## Background Animations

### Synth Wave Effect

```css
/* Synth Wave Background Animation */
@keyframes synthWave {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.synth-wave-background {
  background: linear-gradient(
    45deg,
    #000000 0%,
    #0a0a0a 25%,
    #141414 50%,
    #0a0a0a 75%,
    #000000 100%
  );
  background-size: 400% 400%;
  animation: synthWave var(--duration-ambient) ease-in-out infinite;
}

/* Floating Particles */
@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(100vh) scale(0);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) scale(1);
  }
}

.floating-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  animation: floatUp 20s linear infinite;
}

.floating-particle:nth-child(2) { animation-delay: 2s; }
.floating-particle:nth-child(3) { animation-delay: 4s; }
.floating-particle:nth-child(4) { animation-delay: 6s; }
.floating-particle:nth-child(5) { animation-delay: 8s; }
```

### Ambient Glass Effects

```css
/* Ambient Glass Ripple */
@keyframes glassRipple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.glass-ripple-container {
  position: relative;
  overflow: hidden;
}

.glass-ripple {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: glassRipple 2s ease-out;
  pointer-events: none;
}
```

## Performance Optimization

### Hardware Acceleration

```css
/* Force hardware acceleration for smooth animations */
.animate-optimized {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Optimize for different animation types */
.animate-transform {
  will-change: transform;
}

.animate-opacity {
  will-change: opacity;
}

.animate-filter {
  will-change: filter, backdrop-filter;
}
```

### Animation Controls

```typescript
// Animation performance hook
export const useAnimationControls = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getAnimationProps = useCallback((animation: object) => {
    return prefersReducedMotion ? {} : animation;
  }, [prefersReducedMotion]);

  return { prefersReducedMotion, getAnimationProps };
};

// Usage
const MyComponent = () => {
  const { getAnimationProps } = useAnimationControls();

  return (
    <motion.div
      {...getAnimationProps({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      })}
    >
      Content
    </motion.div>
  );
};
```

## Accessibility Considerations

### Reduced Motion Support

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Maintain essential animations */
  .essential-animation {
    animation-duration: 0.3s !important;
    transition-duration: 0.3s !important;
  }
}

/* Provide alternative feedback for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hover-feedback {
    background-color: rgba(255, 255, 255, 0.1);
    transform: none;
  }

  .focus-feedback {
    outline: 2px solid rgba(59, 130, 246, 0.8);
    outline-offset: 2px;
  }
}
```

### Focus Management

```typescript
// Focus trap for animated modals
export const useAnimatedFocus = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  return containerRef;
};
```

This comprehensive animation system ensures smooth, purposeful, and accessible motion design that enhances the Cathcr user experience while maintaining excellent performance across all devices and respecting user preferences.