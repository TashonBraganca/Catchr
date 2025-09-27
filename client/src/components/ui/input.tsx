import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Base Apple-style acrylic glass input
  "flex w-full rounded-xl px-3 py-2 text-sm font-primary placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        // Light Glass - Subtle acrylic input
        light: [
          "glass border-orange-ultralight text-white",
          "focus:glass-card focus:border-orange-light focus:shadow-orange-subtle",
          "hover:border-orange-light hover:glass-card"
        ],

        // Medium Glass - Standard acrylic (default)
        glass: [
          "glass-card border-orange-light text-white",
          "focus:glass-strong focus:border-orange-medium focus:shadow-orange-medium",
          "hover:border-orange-medium hover:glass-strong"
        ],

        // Strong Glass - Prominent acrylic
        strong: [
          "glass-strong border-orange-medium text-white",
          "focus:glass-premium focus:border-orange-strong focus:shadow-orange-strong",
          "hover:border-orange-strong hover:glass-premium"
        ],

        // Premium Glass - Apple-style acrylic
        premium: [
          "glass-premium border-orange-strong text-white",
          "focus:glass-neon focus:border-orange-intense focus:shadow-orange-glow",
          "hover:border-orange-intense hover:glass-neon"
        ],

        // Search variant - Special glass for search inputs
        search: [
          "glass-card border-orange-light text-white",
          "focus:glass-strong focus:border-orange-medium focus:shadow-orange-medium",
          "hover:border-orange-medium hover:glass-strong rounded-xl"
        ],

        // Outline Glass - Border emphasis
        outline: [
          "border-2 border-orange-light bg-transparent text-white",
          "focus:glass-card focus:border-orange-medium focus:shadow-orange-subtle",
          "hover:border-orange-medium hover:glass-card"
        ],

        // Minimal Glass - Underline style
        minimal: [
          "border-0 border-b-2 border-orange-light bg-transparent rounded-none text-white",
          "focus:border-orange-primary focus:glass-card px-0",
          "hover:border-orange-medium"
        ],
      },
      inputSize: {
        xs: "h-7 text-xs px-2",
        sm: "h-8 text-xs px-3",
        default: "h-9 text-sm px-3",
        lg: "h-10 text-base px-4",
        xl: "h-12 text-lg px-5",
      },
      state: {
        default: "",
        error: "border-red-500/50 focus:border-red-500",
        success: "border-green-500/50 focus:border-green-500",
        warning: "border-yellow-500/50 focus:border-yellow-500",
      }
    },
    defaultVariants: {
      variant: "glass",
      inputSize: "default",
      state: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    inputSize, 
    state,
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorText,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const currentState = errorText ? "error" : state;
    
    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10">
            {leftIcon}
          </div>
        )}
        
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={cn(
            inputVariants({ variant, inputSize, state: currentState }),
            leftIcon && "pl-10",
            (rightIcon || isPassword) && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {isPassword && (
          <motion.button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </motion.button>
        )}
        
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || helperText || errorText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium text-white/90 font-primary">
              {label}
            </label>
          )}
          {inputElement}
          {(helperText || errorText) && (
            <p className={cn(
              "text-xs font-primary",
              errorText ? "text-red-400" : "text-white/60"
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

Input.displayName = "Input";

// Specialized Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorText?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    inputSize, 
    state,
    label,
    helperText,
    errorText,
    resize = "vertical",
    ...props 
  }, ref) => {
    const currentState = errorText ? "error" : state;
    
    const textareaElement = (
      <textarea
        className={cn(
          inputVariants({ variant, state: currentState }),
          "min-h-[80px] py-3",
          {
            "resize-none": resize === "none",
            "resize-y": resize === "vertical",
            "resize-x": resize === "horizontal",
            "resize": resize === "both",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (label || helperText || errorText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium text-white/90 font-primary">
              {label}
            </label>
          )}
          {textareaElement}
          {(helperText || errorText) && (
            <p className={cn(
              "text-xs font-primary",
              errorText ? "text-red-400" : "text-white/60"
            )}>
              {errorText || helperText}
            </p>
          )}
        </div>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = "Textarea";

// Search Input with enhanced styling
interface SearchInputProps extends InputProps {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    onSearch, 
    debounceMs = 300,
    onChange,
    ...props 
  }, ref) => {
    const [searchValue, setSearchValue] = React.useState("");
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (onSearch && searchValue !== undefined) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          onSearch(searchValue);
        }, debounceMs);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [searchValue, onSearch, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="search"
        placeholder="Search thoughts..."
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";

export { Input, Textarea, SearchInput, inputVariants };