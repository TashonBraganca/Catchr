// Cathcr Design System - Glassmorphism UI Components
// Export all UI components for easy importing

// Core Components
export { Button, buttonVariants, type ButtonProps } from "./button";
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  BentoCard,
  cardVariants,
  type CardProps 
} from "./card";

// Form Components
export { 
  Input, 
  Textarea, 
  SearchInput, 
  inputVariants,
  type InputProps,
  type TextareaProps 
} from "./input";

// Dialog Components
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  CaptureModal,
} from "./dialog";

// Re-export commonly used types
export type { VariantProps } from "class-variance-authority";