import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base Apple-style acrylic glassmorphism button
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 font-primary",
  {
    variants: {
      variant: {
        // Light Glass - Subtle acrylic effect
        light: [
          "glass text-white border-orange-ultralight",
          "hover:glass-card hover:border-orange-light hover:shadow-orange-subtle",
          "active:scale-[0.98] active:glass-strong transition-all duration-200"
        ],

        // Medium Glass - Standard acrylic (default)
        glass: [
          "glass-card text-white border-orange-light",
          "hover:glass-strong hover:border-orange-medium hover:shadow-orange-medium",
          "active:scale-[0.98] active:glass-premium transition-all duration-200"
        ],

        // Strong Glass - Prominent acrylic
        strong: [
          "glass-strong text-white border-orange-medium",
          "hover:glass-premium hover:border-orange-strong hover:shadow-orange-strong",
          "active:scale-[0.98] active:glass-neon transition-all duration-200"
        ],

        // Premium Glass - Apple-style acrylic
        premium: [
          "glass-premium text-white border-orange-strong",
          "hover:glass-neon hover:border-orange-intense hover:shadow-orange-glow",
          "active:scale-[0.98] transition-all duration-200"
        ],

        // Neon Glass - Maximum glow effect
        neon: [
          "glass-neon text-white border-orange-intense animate-orange-glow",
          "hover:shadow-orange-electric hover:text-neon-orange",
          "active:scale-[0.98] transition-all duration-200"
        ],

        // Pure Orange Solid - Vibrant button
        orange: [
          "bg-orange-primary text-black font-semibold border border-orange-primary",
          "hover:bg-orange-bright hover:border-orange-bright hover:shadow-orange-glow",
          "active:scale-[0.98] active:bg-orange-accent transition-all duration-200"
        ],

        // Ghost Glass - Subtle transparent
        ghost: [
          "text-orange-primary hover:glass-card hover:text-orange-bright",
          "border border-transparent hover:border-orange-light",
          "active:scale-[0.98] transition-all duration-200"
        ],

        // Outline Glass - Border emphasis
        outline: [
          "border border-orange-light text-orange-primary hover:glass-card",
          "hover:border-orange-medium hover:text-orange-bright hover:shadow-orange-subtle",
          "active:scale-[0.98] transition-all duration-200"
        ],

        // Destructive Glass - Error states
        destructive: [
          "glass-card border border-red-500/30 text-red-400",
          "hover:glass-strong hover:border-red-500/50 hover:text-red-300",
          "active:scale-[0.98] transition-all duration-200"
        ],
      },
      size: {
        xs: "h-7 px-2 py-1 text-xs rounded-lg",
        sm: "h-8 px-3 py-1.5 text-xs rounded-lg",
        default: "h-9 px-4 py-2 text-sm rounded-xl",
        lg: "h-10 px-6 py-2.5 text-base rounded-xl",
        xl: "h-12 px-8 py-3 text-lg rounded-xl font-semibold",
        icon: "h-9 w-9 rounded-xl",
        "icon-xs": "h-7 w-7 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-10 w-10 rounded-xl",
        "icon-xl": "h-12 w-12 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    const buttonProps = asChild ? props : {
      whileHover: {
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      whileTap: {
        scale: 0.98,
        y: 0,
        transition: { duration: 0.1 }
      },
      transition: { duration: 0.2, ease: "easeOut" },
      ...props
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {loading && (
          <motion.div
            className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {leftIcon && !loading && (
          <span className="mr-2 flex items-center">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2 flex items-center">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };