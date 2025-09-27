# Glassmorphism Guidelines

This document provides comprehensive guidelines for implementing glassmorphism effects in Cathcr, ensuring consistent, beautiful, and performant glass-like interfaces across all components.

## Glassmorphism Principles

### Core Characteristics

1. **Translucency**: Semi-transparent backgrounds that reveal underlying content
2. **Backdrop Blur**: Frosted glass effect using CSS backdrop-filter
3. **Subtle Borders**: Light, translucent borders that define component edges
4. **Layered Depth**: Multiple glass layers create visual hierarchy
5. **Soft Shadows**: Gentle shadows that enhance the floating effect

### Visual Hierarchy Through Glass

```
Z-Index Layer System:
├── Modal Glass (z-1400) - Strongest blur, highest opacity
├── Dropdown Glass (z-1000) - Medium blur, medium opacity
├── Card Glass (z-10) - Subtle blur, low opacity
└── Background Glass (z-1) - Minimal blur, very low opacity
```

## Glass Effect Implementation

### CSS Backdrop Blur Levels

```css
/* Blur Intensity Scale */
.glass-blur-none {
  backdrop-filter: none;
}

.glass-blur-subtle {
  backdrop-filter: blur(4px);
}

.glass-blur-medium {
  backdrop-filter: blur(12px);
}

.glass-blur-strong {
  backdrop-filter: blur(20px);
}

.glass-blur-intense {
  backdrop-filter: blur(40px);
}

/* Browser Support Fallbacks */
@supports not (backdrop-filter: blur(1px)) {
  .glass-blur-subtle {
    background: rgba(255, 255, 255, 0.15);
  }

  .glass-blur-medium {
    background: rgba(255, 255, 255, 0.2);
  }

  .glass-blur-strong {
    background: rgba(255, 255, 255, 0.25);
  }
}
```

### Background Opacity Levels

```css
/* Glass Background Opacity */
.glass-opacity-ultra-low {
  background: rgba(255, 255, 255, 0.03);
}

.glass-opacity-low {
  background: rgba(255, 255, 255, 0.05);
}

.glass-opacity-subtle {
  background: rgba(255, 255, 255, 0.08);
}

.glass-opacity-medium {
  background: rgba(255, 255, 255, 0.12);
}

.glass-opacity-high {
  background: rgba(255, 255, 255, 0.18);
}

.glass-opacity-strong {
  background: rgba(255, 255, 255, 0.25);
}

/* Colored Glass Variants */
.glass-blue {
  background: rgba(59, 130, 246, 0.1);
}

.glass-purple {
  background: rgba(139, 92, 246, 0.1);
}

.glass-success {
  background: rgba(16, 185, 129, 0.1);
}

.glass-warning {
  background: rgba(245, 158, 11, 0.1);
}

.glass-error {
  background: rgba(239, 68, 68, 0.1);
}
```

### Border Styles

```css
/* Glass Border Styles */
.glass-border-none {
  border: none;
}

.glass-border-subtle {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-border-medium {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-border-strong {
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Gradient Borders for Enhanced Effect */
.glass-border-gradient {
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)) padding-box,
              linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1)) border-box;
}

/* Inner Border Effect */
.glass-border-inner {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

## Component-Specific Glass Patterns

### Glass Cards

```css
/* Basic Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Elevated Glass Card */
.glass-card-elevated {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Interactive Glass Card */
.glass-card-interactive {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.glass-card-interactive:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### Glass Buttons

```css
/* Primary Glass Button */
.glass-button-primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.2s ease-out;
}

.glass-button-primary:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(139, 92, 246, 0.9));
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.glass-button-primary:active {
  transform: translateY(0);
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
}

/* Secondary Glass Button */
.glass-button-secondary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.glass-button-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
```

### Glass Modals

```css
/* Modal Backdrop */
.glass-modal-backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Modal Container */
.glass-modal {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow:
    0 40px 80px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Modal Header */
.glass-modal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);
}
```

### Glass Inputs

```css
/* Glass Input Field */
.glass-input {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  transition: all 0.2s ease-out;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Glass Search Input */
.glass-input-search {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.glass-input-search:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}
```

## Advanced Glass Effects

### Liquid Glass Animation

```css
/* Liquid Glass Shimmer Effect */
@keyframes liquidShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.glass-liquid {
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent),
    rgba(255, 255, 255, 0.05);
  background-size: 200% 100%, 100% 100%;
  animation: liquidShimmer 3s infinite ease-in-out;
}

/* Morphing Glass Effect */
@keyframes glassMorph {
  0%, 100% {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
  }
  50% {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.15);
  }
}

.glass-morph {
  animation: glassMorph 4s infinite ease-in-out;
}
```

### Glass Glow Effects

```css
/* Glass Glow for Interactive Elements */
.glass-glow {
  position: relative;
}

.glass-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
  opacity: 0;
  transition: opacity 0.3s ease-out;
  z-index: -1;
  filter: blur(8px);
}

.glass-glow:hover::before {
  opacity: 1;
}

/* Pulsing Glass Effect */
@keyframes glassPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
  }
}

.glass-pulse {
  animation: glassPulse 2s infinite ease-in-out;
}
```

## Performance Optimization

### Hardware Acceleration

```css
/* Force Hardware Acceleration for Smooth Animations */
.glass-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Optimize Backdrop Filter Performance */
.glass-optimized {
  contain: layout style paint;
  isolation: isolate;
}
```

### Progressive Enhancement

```css
/* Basic Glass Without Backdrop Filter */
.glass-fallback {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Enhanced Glass With Backdrop Filter */
@supports (backdrop-filter: blur(1px)) {
  .glass-fallback {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
  }
}

/* Reduced Motion Accessibility */
@media (prefers-reduced-motion: reduce) {
  .glass-animated {
    animation: none;
    transition: none;
  }
}
```

## Glass Component Utilities

### React Glass Hook

```typescript
// hooks/useGlass.ts
interface GlassOptions {
  blur?: 'subtle' | 'medium' | 'strong' | 'intense';
  opacity?: 'ultra-low' | 'low' | 'subtle' | 'medium' | 'high' | 'strong';
  border?: 'none' | 'subtle' | 'medium' | 'strong';
  shadow?: boolean;
  glow?: boolean;
  animated?: boolean;
}

export const useGlass = (options: GlassOptions = {}) => {
  const {
    blur = 'medium',
    opacity = 'medium',
    border = 'subtle',
    shadow = true,
    glow = false,
    animated = false
  } = options;

  const glassClasses = useMemo(() => {
    const classes = ['glass-base'];

    // Blur classes
    classes.push(`glass-blur-${blur}`);

    // Opacity classes
    classes.push(`glass-opacity-${opacity}`);

    // Border classes
    if (border !== 'none') {
      classes.push(`glass-border-${border}`);
    }

    // Effect classes
    if (shadow) classes.push('glass-shadow');
    if (glow) classes.push('glass-glow');
    if (animated) classes.push('glass-animated');

    return classes.join(' ');
  }, [blur, opacity, border, shadow, glow, animated]);

  return { glassClasses };
};

// Usage
const { glassClasses } = useGlass({
  blur: 'strong',
  opacity: 'high',
  border: 'medium',
  glow: true
});
```

### Glass Mixin (Sass)

```scss
// Glass mixin for consistent implementation
@mixin glass(
  $blur: 12px,
  $opacity: 0.1,
  $border: rgba(255, 255, 255, 0.2),
  $shadow: true,
  $radius: 16px
) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur($blur);
  border: 1px solid $border;
  border-radius: $radius;

  @if $shadow {
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  // Fallback for browsers without backdrop-filter support
  @supports not (backdrop-filter: blur(1px)) {
    background: rgba(255, 255, 255, $opacity + 0.05);
  }
}

// Usage
.my-glass-component {
  @include glass($blur: 20px, $opacity: 0.15, $shadow: true);
}
```

## Accessibility Considerations

### Contrast and Readability

```css
/* Ensure Adequate Contrast */
.glass-text-primary {
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.glass-text-secondary {
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .glass-component {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: none;
  }
}
```

### Focus States

```css
/* Glass Focus Indicators */
.glass-focusable:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

/* High visibility focus for better accessibility */
.glass-focusable:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

## Testing Glass Effects

### Visual Regression Testing

```typescript
// Example test for glass components
describe('Glass Components', () => {
  it('should render glass effects correctly', async () => {
    const component = render(<GlassCard blur="medium" opacity="high" />);

    // Check for backdrop-filter support
    const element = screen.getByTestId('glass-card');
    const styles = getComputedStyle(element);

    expect(styles.backdropFilter).toBe('blur(12px)');
    expect(styles.background).toContain('rgba(255, 255, 255, 0.18)');
  });

  it('should provide fallback for unsupported browsers', () => {
    // Mock lack of backdrop-filter support
    Object.defineProperty(CSS, 'supports', {
      value: jest.fn().mockReturnValue(false)
    });

    const component = render(<GlassCard />);
    const element = screen.getByTestId('glass-card');

    expect(element).toHaveClass('glass-fallback');
  });
});
```

These comprehensive glassmorphism guidelines ensure consistent, beautiful, and performant glass effects throughout the Cathcr platform while maintaining accessibility and cross-browser compatibility.