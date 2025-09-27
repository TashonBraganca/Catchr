import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// ULTRATHINK ORANGE ACRYLIC GLASS COMPONENT SYSTEM - PURE ORANGE, NO BROWN TINTS
// Apple-Style Acrylic Glass with WCAG AAA Accessibility Compliance

const glassVariants = cva(
  "font-primary text-text-primary transition-all duration-200 focus-ring",
  {
    variants: {
      variant: {
        // Apple-Style Light Glass - Subtle Orange
        light: [
          "glass-light",
          "hover:glass-hover",
          "shadow-glass-subtle hover:shadow-glass-medium"
        ],
        // Apple-Style Medium Glass - Standard Orange
        medium: [
          "glass-medium",
          "hover:glass-hover",
          "shadow-glass-medium hover:shadow-glass-strong"
        ],
        // Apple-Style Strong Glass - Intense Orange
        strong: [
          "glass-strong",
          "hover:glass-hover",
          "shadow-glass-strong hover:shadow-glass-glow"
        ],
        // Apple-Style Premium Glass - Flagship Experience
        premium: [
          "glass-premium",
          "hover:glass-hover",
          "shadow-glass-glow hover:shadow-glass-electric"
        ],
        // Apple-Style Neon Glass - Maximum Impact
        neon: [
          "glass-neon",
          "hover:glass-hover",
          "shadow-glass-neon hover:shadow-glass-electric",
          "animate-orange-glow"
        ],
        // Minimal for subtle use cases
        minimal: [
          "bg-glass-orange-5 border border-border-glass-ultralight",
          "backdrop-blur-sm saturate-150 brightness-110",
          "hover:bg-glass-orange-10 hover:border-border-glass-light",
          "shadow-glass-subtle hover:shadow-glass-medium"
        ],
      },
      size: {
        xs: "rounded-lg px-3 py-2 text-xs leading-tight",
        sm: "rounded-xl px-4 py-3 text-sm leading-snug",
        default: "rounded-xl px-6 py-4 text-base leading-normal",
        lg: "rounded-2xl px-8 py-6 text-lg leading-relaxed",
        xl: "rounded-3xl px-10 py-8 text-xl leading-loose",
      },
    },
    defaultVariants: {
      variant: "medium",
      size: "default",
    },
  }
);

export interface GlassProps
  extends Omit<HTMLMotionProps<"div">, "ref">,
    VariantProps<typeof glassVariants> {
  asChild?: boolean;
  glow?: boolean;
}

// Main Glass Container Component
const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant, size, glow = false, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn(
          glassVariants({ variant, size }),
          glow && "animate-pulse-glow",
          className
        )}
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Glass.displayName = "Glass";

// Orange Glass Card with hover effects
interface GlassCardProps extends GlassProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    title,
    description,
    icon,
    interactive = false,
    children,
    className,
    variant = "medium",
    ...props
  }, ref) => {
    const motionProps = interactive ? {
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.2, ease: "easeOut" },
    } : {};

    return (
      <Glass
        ref={ref}
        variant={variant}
        className={cn(
          "group relative overflow-hidden",
          interactive && "cursor-pointer select-none hover:scale-[1.02] transition-transform duration-200",
          className
        )}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...motionProps}
        {...props}
      >
        {(icon || title || description) && (
          <div className="mb-6 space-y-3">
            {icon && (
              <div className="flex items-center justify-start">
                <div className="text-text-orange group-hover:text-text-orange-bright transition-colors duration-200 flex items-center justify-center w-8 h-8">
                  {icon}
                </div>
              </div>
            )}
            {title && (
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-text-orange-glow transition-colors duration-200 leading-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-200 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="relative z-10">
          {children}
        </div>
      </Glass>
    );
  }
);

GlassCard.displayName = "GlassCard";

// Orange Glass Button
interface GlassButtonProps extends GlassProps {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const GlassButton = React.forwardRef<HTMLDivElement, GlassButtonProps>(
  ({
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    className,
    variant = "medium",
    size = "default",
    ...props
  }, ref) => {
    return (
      <Glass
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "inline-flex items-center justify-center gap-2 cursor-pointer select-none",
          "font-medium text-text-primary hover:text-text-orange-glow",
          "active:scale-[0.98] transition-all duration-200",
          "focus:outline-none focus-ring",
          "min-h-[44px]", // WCAG AAA minimum touch target size
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:text-text-primary",
          fullWidth && "w-full",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading && (
          <motion.div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {leftIcon && !loading && leftIcon}
        {children}
        {rightIcon && rightIcon}
      </Glass>
    );
  }
);

GlassButton.displayName = "GlassButton";

// Orange Glass Input
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "primary" | "secondary" | "subtle";
  glass?: boolean;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({
    className,
    label,
    helperText,
    errorText,
    leftIcon,
    rightIcon,
    variant = "primary",
    glass = true,
    ...props
  }, ref) => {
    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10 flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3.5 text-sm font-primary text-text-primary placeholder:text-text-tertiary",
            "transition-all duration-200 focus:outline-none focus-ring",
            "min-h-[48px]", // WCAG AAA minimum touch target
            glass && variant === "primary" && "bg-glass-orange-10 border border-border-glass-light backdrop-blur-md rounded-xl focus:border-border-glass-medium focus:bg-glass-orange-15",
            glass && variant === "secondary" && "bg-glass-orange-8 border border-border-glass-ultralight backdrop-blur-md rounded-xl focus:border-border-glass-light focus:bg-glass-orange-10",
            glass && variant === "subtle" && "bg-glass-orange-5 border border-border-glass-ultralight backdrop-blur-sm rounded-xl focus:border-border-glass-light focus:bg-glass-orange-8",
            !glass && "bg-transparent border-b-2 border-border-glass-light rounded-none focus:border-primary px-0",
            leftIcon && "pl-12",
            rightIcon && "pr-12",
            errorText && "border-red-500/50 focus:border-red-500",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || helperText || errorText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium text-text-secondary">
              {label}
            </label>
          )}
          {inputElement}
          {(helperText || errorText) && (
            <p className={cn(
              "text-xs font-primary",
              errorText ? "text-red-400" : "text-text-tertiary"
            )}>
              {errorText || helperText}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

GlassInput.displayName = "GlassInput";

// Orange Glass Navigation Bar
interface GlassNavProps {
  children: React.ReactNode;
  className?: string;
  fixed?: boolean;
}

const GlassNav = React.forwardRef<HTMLDivElement, GlassNavProps>(
  ({ children, className, fixed = false, ...props }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          "bg-orange-500/8 backdrop-blur-xl border-b border-orange-400/15",
          "px-6 py-4 text-white",
          fixed && "fixed top-0 left-0 right-0 z-50",
          className
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.nav>
    );
  }
);

GlassNav.displayName = "GlassNav";

// Orange Glass Modal Overlay
interface GlassModalProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const GlassModal = React.forwardRef<HTMLDivElement, GlassModalProps>(
  ({ children, className, onClose, ...props }, ref) => {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Content */}
        <motion.div
          ref={ref}
          className={cn(
            "relative bg-orange-500/10 backdrop-blur-xl border border-orange-400/20",
            "rounded-2xl p-6 text-white shadow-[0_20px_60px_rgba(255,107,53,0.15)]",
            "max-w-lg w-full",
            className
          )}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }
);

GlassModal.displayName = "GlassModal";

export {
  Glass,
  GlassCard,
  GlassButton,
  GlassInput,
  GlassNav,
  GlassModal,
  glassVariants,
  type GlassProps,
  type GlassCardProps,
  type GlassButtonProps,
  type GlassInputProps,
  type GlassNavProps,
  type GlassModalProps,
};