# UI Components

This document provides a comprehensive guide to Cathcr's UI component library, built with React, TypeScript, and glassmorphism design principles. All components follow the design system and provide consistent, accessible user experiences.

## Component Architecture

### Base Component Structure

```typescript
// Base component interface
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Glass component interface
interface GlassComponentProps extends BaseComponentProps {
  blur?: 'subtle' | 'medium' | 'strong';
  opacity?: 'low' | 'medium' | 'high';
  border?: boolean;
}
```

## Glass Foundation Components

### GlassCard

The fundamental building block for all card-based layouts.

```typescript
// components/glass/GlassCard.tsx
interface GlassCardProps extends GlassComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  blur = 'medium',
  opacity = 'medium',
  border = true,
  padding = 'md',
  hover = false,
  interactive = false,
  'data-testid': testId,
  ...props
}) => {
  const blurClasses = {
    subtle: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    strong: 'backdrop-blur-lg'
  };

  const opacityClasses = {
    low: 'bg-white/5',
    medium: 'bg-white/10',
    high: 'bg-white/20'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl',
        blurClasses[blur],
        opacityClasses[opacity],
        paddingClasses[padding],
        border && 'border border-white/20',
        hover && 'hover:bg-white/15 transition-all duration-200',
        interactive && 'cursor-pointer',
        'shadow-xl',
        className
      )}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      data-testid={testId}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Usage Examples
<GlassCard>
  <p>Basic glass card</p>
</GlassCard>

<GlassCard blur="strong" opacity="high" hover>
  <p>High-opacity card with hover effect</p>
</GlassCard>

<GlassCard padding="lg" interactive>
  <p>Interactive card with large padding</p>
</GlassCard>
```

### GlassButton

Primary button component with glass morphism styling.

```typescript
// components/glass/GlassButton.tsx
interface GlassButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  'data-testid': testId,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent hover:from-blue-600 hover:to-purple-700',
    secondary: 'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20',
    ghost: 'bg-transparent border-transparent text-white hover:bg-white/10',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-transparent hover:from-red-600 hover:to-red-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-lg border font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      whilePress={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled || loading}
      data-testid={testId}
      {...props}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}

      {children}

      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  );
};

// Usage Examples
<GlassButton variant="primary">
  Save Thought
</GlassButton>

<GlassButton variant="secondary" icon={<Search />} loading>
  Searching...
</GlassButton>

<GlassButton variant="ghost" size="lg" fullWidth>
  Cancel
</GlassButton>
```

### GlassModal

Modal component with backdrop blur and glass styling.

```typescript
// components/glass/GlassModal.tsx
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Modal Content */}
            <motion.div
              className={cn(
                'relative w-full',
                'bg-black/80 backdrop-blur-xl',
                'border border-white/20 rounded-2xl',
                'shadow-2xl overflow-hidden',
                sizeClasses[size]
              )}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  {title && (
                    <h2 className="text-xl font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

// Usage Examples
<GlassModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p className="text-white mb-4">Are you sure you want to delete this thought?</p>
  <div className="flex space-x-3">
    <GlassButton variant="danger">Delete</GlassButton>
    <GlassButton variant="ghost" onClick={() => setIsModalOpen(false)}>
      Cancel
    </GlassButton>
  </div>
</GlassModal>
```

### GlassInput

Input component with glass styling and validation states.

```typescript
// components/glass/GlassInput.tsx
interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search';
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  disabled,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-13 px-5 text-base'
  };

  const variantClasses = {
    default: 'bg-white/10 backdrop-blur-md border-white/20 focus:border-blue-500',
    search: 'bg-white/5 backdrop-blur-sm border-white/10 focus:border-blue-400'
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border',
            'text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            variantClasses[variant],
            sizeClasses[size],
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          disabled={disabled}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className="text-sm">
          {error ? (
            <span className="text-red-400">{error}</span>
          ) : (
            <span className="text-gray-400">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Usage Examples
<GlassInput
  label="Search thoughts"
  placeholder="Type to search..."
  variant="search"
  icon={<Search className="w-4 h-4" />}
/>

<GlassInput
  label="Email"
  type="email"
  placeholder="Enter your email"
  error="Please enter a valid email address"
/>
```

## Layout Components

### Container

Responsive container component for consistent page layouts.

```typescript
// components/layout/Container.tsx
interface ContainerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
};
```

### Stack

Flexible stack component for vertical layouts.

```typescript
// components/layout/Stack.tsx
interface StackProps extends BaseComponentProps {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className = ''
}) => {
  const spacingClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};
```

## Feedback Components

### GlassToast

Toast notification component with glass styling.

```typescript
// components/feedback/GlassToast.tsx
interface GlassToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const GlassToast: React.FC<GlassToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    info: {
      icon: <Info className="w-5 h-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20'
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20'
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-500/20'
    }
  };

  const config = typeConfig[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            'fixed top-4 right-4 z-50',
            'flex items-center space-x-3 p-4',
            'bg-black/80 backdrop-blur-xl',
            'border border-white/20 rounded-lg',
            'shadow-2xl max-w-sm',
            config.bg
          )}
        >
          <span className={config.color}>
            {config.icon}
          </span>
          <span className="text-white text-sm flex-1">
            {message}
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### LoadingSpinner

Customizable loading spinner with glass styling.

```typescript
// components/feedback/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-t-transparent rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};
```

## Navigation Components

### GlassNavigation

Main navigation component with glass styling.

```typescript
// components/navigation/GlassNavigation.tsx
interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface GlassNavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  actions?: React.ReactNode;
}

export const GlassNavigation: React.FC<GlassNavigationProps> = ({
  items,
  logo,
  actions
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'transition-all duration-300',
        isScrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0">
              {logo}
            </div>
          )}

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg',
                  'text-sm font-medium transition-all duration-200',
                  item.active
                    ? 'bg-white/15 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </Container>
    </motion.nav>
  );
};
```

## Component Usage Guidelines

### Accessibility Standards

1. **Keyboard Navigation**: All interactive components support keyboard navigation
2. **Screen Readers**: Proper ARIA labels and semantic HTML structure
3. **Color Contrast**: Minimum 4.5:1 contrast ratio for text
4. **Focus Indicators**: Visible focus states for all interactive elements

### Performance Considerations

1. **Lazy Loading**: Use React.lazy for heavy components
2. **Memoization**: Implement React.memo for expensive components
3. **Animation Performance**: Use transform properties for smooth animations
4. **Bundle Size**: Tree-shake unused components

### Testing Strategy

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassButton } from './GlassButton';

describe('GlassButton', () => {
  it('renders with correct text', () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<GlassButton onClick={handleClick}>Click me</GlassButton>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<GlassButton loading>Click me</GlassButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

This component library provides a complete set of reusable, accessible, and beautifully designed components that maintain consistency across the entire Cathcr platform while embodying the premium glassmorphism aesthetic.