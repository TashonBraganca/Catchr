import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    asChild
    {...props}
  >
    <motion.div
      className={cn(
        "fixed inset-0 z-50 backdrop-blur-xl bg-black/70",
        className
      )}
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "default" | "lg" | "xl" | "full";
  variant?: "light" | "glass" | "strong" | "premium" | "neon" | "minimal";
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "default", variant = "glass", ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-2xl",
    full: "max-w-[95vw] max-h-[95vh]"
  };

  const variantClasses = {
    light: "glass border-orange-ultralight shadow-orange-subtle",
    glass: "glass-card border-orange-light shadow-orange-medium",
    strong: "glass-strong border-orange-medium shadow-orange-strong",
    premium: "glass-premium border-orange-strong shadow-orange-glow",
    neon: "glass-neon border-orange-intense shadow-orange-electric animate-orange-glow",
    minimal: "bg-black/80 backdrop-blur-xl border border-orange-ultralight"
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
            "p-6 shadow-lg duration-200",
            "text-white font-primary",
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          initial={{
            opacity: 0,
            scale: 0.92,
            y: "-50%",
            x: "-50%",
            backdropFilter: "blur(0px)"
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: "-50%",
            x: "-50%",
            backdropFilter: "var(--backdrop-acrylic-apple)"
          }}
          exit={{
            opacity: 0,
            scale: 0.92,
            y: "-50%",
            x: "-50%",
            backdropFilter: "blur(0px)"
          }}
          transition={{
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          {children}
          <DialogPrimitive.Close
            asChild
          >
            <motion.button
              className={cn(
                "absolute right-4 top-4 rounded-xl opacity-70",
                "focus:outline-none focus:ring-2 focus:ring-orange-primary focus:ring-offset-2 focus:ring-offset-black",
                "disabled:pointer-events-none",
                "hover:opacity-100 transition-all duration-200",
                "glass-card border-orange-light hover:glass-strong hover:border-orange-medium p-2 h-auto w-auto"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </motion.button>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white font-primary",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/70 leading-relaxed font-primary", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Specialized Capture Modal for thought capture
interface CaptureModalProps extends DialogContentProps {
  isRecording?: boolean;
  waveformData?: number[];
}

const CaptureModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  CaptureModalProps
>(({
  isRecording = false,
  waveformData = [],
  children,
  className,
  ...props
}, ref) => (
  <DialogContent
    ref={ref}
    size="lg"
    variant="premium"
    className={cn(
      "relative overflow-hidden rounded-2xl",
      isRecording && "animate-orange-glow",
      className
    )}
    {...props}
  >
    {/* Pure Orange Glass Background Animation for Recording */}
    <AnimatePresence>
      {isRecording && (
        <motion.div
          className="absolute inset-0 glass-orange-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>

    {/* Pure Orange Ambient Background - NO BROWN TINTS */}
    <div className="absolute inset-0 overflow-hidden opacity-15">
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          background: `conic-gradient(from 0deg, #FFA500, #FFAB40, #FF8C00, #FFA500)`,
          filter: "blur(120px)"
        }}
      />
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </DialogContent>
));

CaptureModal.displayName = "CaptureModal";

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
};