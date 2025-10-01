import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  // Base styles with Apple-style acrylic glassmorphism
  "rounded-xl overflow-hidden font-primary",
  {
    variants: {
      variant: {
        // Light Glass - Subtle acrylic effect
        light: [
          "glass text-white",
          "hover:glass-card transition-all duration-300"
        ],

        // Medium Glass - Standard acrylic
        glass: [
          "glass-card text-white",
          "hover:glass-strong transition-all duration-300"
        ],

        // Strong Glass - Prominent acrylic
        strong: [
          "glass-strong text-white",
          "hover:glass-premium transition-all duration-300"
        ],

        // Premium Glass - Apple-style acrylic
        premium: [
          "glass-premium text-white",
          "hover:glass-neon transition-all duration-300"
        ],

        // Neon Glass - Maximum acrylic glow
        neon: [
          "glass-neon text-white",
          "animate-orange-glow transition-all duration-300"
        ],

        // Orange Glass - Pure orange variant
        orange: [
          "glass-card text-white border-orange-light",
          "hover:border-orange-medium hover:shadow-orange-glow transition-all duration-300"
        ],

        // Primary variant (alias for strong)
        primary: [
          "glass-strong text-white",
          "hover:glass-premium transition-all duration-300"
        ],

        // Secondary variant (glass with less intensity)
        secondary: [
          "glass-card text-white border-orange-light",
          "hover:glass-strong hover:border-orange-medium transition-all duration-300"
        ],

        // Subtle variant (minimal glass effect)
        subtle: [
          "glass text-white",
          "hover:glass-card transition-all duration-300"
        ],

        // Minimal Glass - Subtle transparency
        minimal: [
          "glass text-white",
          "hover:glass-card transition-all duration-300"
        ],

        // Bento Card - Grid layout optimized
        bento: [
          "glass-card text-white relative overflow-hidden",
          "hover:scale-[1.02] hover:shadow-orange-electric transition-all duration-300"
        ],
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        true: "cursor-pointer select-none",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  }
);

export interface CardProps
  extends Omit<HTMLMotionProps<"div">, "ref">,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? motion.div : motion.div;
    
    const cardProps = interactive ? {
      whileHover: {
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      whileTap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      },
      transition: { duration: 0.2, ease: "easeOut" },
      ...props
    } : props;

    return (
      <Comp
        className={cn(cardVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...cardProps}
      >
        {children}
      </Comp>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-0 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-white font-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/70 leading-relaxed font-primary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-0 pt-0", className)} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-0 pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Specialized Bento Card for grid layouts
const BentoCard = React.forwardRef<HTMLDivElement, CardProps & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  backgroundGradient?: boolean;
}>(({ 
  title, 
  description, 
  icon, 
  backgroundGradient = false,
  children, 
  className,
  ...props 
}, ref) => (
  <Card
    ref={ref}
    variant="bento"
    interactive
    className={cn(
      "relative group",
      backgroundGradient && "bg-orange-500/8",
      className
    )}
    {...props}
  >
    {backgroundGradient && (
      <div className="absolute inset-0 glass-orange-5 group-hover:glass-orange-10 transition-colors duration-300" />
    )}
    
    <div className="relative z-10">
      {(icon || title) && (
        <CardHeader>
          {icon && (
            <div className="flex items-center justify-between">
              <div className="text-orange-primary group-hover:text-orange-bright transition-colors">
                {icon}
              </div>
            </div>
          )}
          {title && (
            <CardTitle className="group-hover:text-orange-bright transition-colors">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="group-hover:text-white/80 transition-colors">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {children}
      </CardContent>
    </div>
  </Card>
));

BentoCard.displayName = "BentoCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  BentoCard,
  cardVariants 
};