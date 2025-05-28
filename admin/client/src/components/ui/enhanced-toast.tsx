import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const ToastProvider = ToastPrimitives.Provider

// Custom viewport with enhanced positioning
const EnhancedToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:max-w-[380px] pointer-events-none",
      className
    )}
    {...props}
  />
))
EnhancedToastViewport.displayName = "EnhancedToastViewport"

// Enhanced toast variants with 3D effects
const enhancedToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-10 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-0 bg-gradient-to-br from-[#2C2F33] to-[#23272A] text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] border-l-4 border-l-[#5865F2]",
        success: "border-0 bg-gradient-to-br from-[#2C2F33] to-[#23272A] text-white shadow-[0_2px_4px_rgba(48,213,122,0.15)] border-l-4 border-l-[#30D57A]",
        error: "border-0 bg-gradient-to-br from-[#2C2F33] to-[#23272A] text-white shadow-[0_2px_4px_rgba(237,66,69,0.15)] border-l-4 border-l-[#ED4245]",
        warning: "border-0 bg-gradient-to-br from-[#2C2F33] to-[#23272A] text-white shadow-[0_2px_4px_rgba(250,166,26,0.15)] border-l-4 border-l-[#FAA61A]",
        info: "border-0 bg-gradient-to-br from-[#2C2F33] to-[#23272A] text-white shadow-[0_2px_4px_rgba(88,101,242,0.15)] border-l-4 border-l-[#5865F2]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Motion variants for toast animations
const toastMotionVariants = {
  initial: { 
    opacity: 0, 
    y: 10,
    scale: 0.97,
    transformOrigin: "center right" 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "easeOut", 
      duration: 0.2
    } 
  },
  exit: { 
    opacity: 0,
    scale: 0.97,
    transition: { 
      duration: 0.15,
      ease: "easeIn"
    } 
  }
}

// Enhanced Toast component with motion animations
const EnhancedToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof enhancedToastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastMotionVariants}
      className="pointer-events-auto"
    >
      <ToastPrimitives.Root
        ref={ref}
        className={cn(
          enhancedToastVariants({ variant }),
          "backdrop-blur-md bg-opacity-90",
          className
        )}
        {...props}
      />
    </motion.div>
  )
})
EnhancedToast.displayName = "EnhancedToast"

// Enhanced toast action with 3D effects
const EnhancedToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md border-0 bg-gradient-to-br from-[#5865F2] to-[#4752C4] px-4 text-sm font-medium text-white shadow-md transition-all hover:from-[#4752C4] hover:to-[#3C45A5] hover:shadow-lg active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-opacity-50 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
EnhancedToastAction.displayName = "EnhancedToastAction"

// Enhanced toast close button with animations
const EnhancedToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/80 opacity-70 transition-all hover:bg-white/10 hover:text-white hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5" />
  </ToastPrimitives.Close>
))
EnhancedToastClose.displayName = "EnhancedToastClose"

// Icon container component
const ToastIcon = ({ 
  variant 
}: { 
  variant?: "default" | "success" | "error" | "warning" | "info" 
}) => {
  const iconSize = "h-5 w-5";
  const iconClasses = "mr-4";
  
  switch (variant) {
    case "success":
      return <CheckCircle className={`${iconSize} ${iconClasses} text-[#30D57A]`} />;
    case "error":
      return <X className={`${iconSize} ${iconClasses} text-[#ED4245]`} />;
    case "warning":
      return <AlertTriangle className={`${iconSize} ${iconClasses} text-[#FAA61A]`} />;
    case "info":
    case "default":
    default:
      return <Info className={`${iconSize} ${iconClasses} text-[#5865F2]`} />;
  }
};

// Enhanced toast title with 3D text effects
const EnhancedToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-bold leading-tight tracking-wide text-white drop-shadow-sm mb-0.5 text-center",
      className
    )}
    {...props}
  />
))
EnhancedToastTitle.displayName = "EnhancedToastTitle"

// Enhanced toast description with auto-sizing
const EnhancedToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-xs opacity-90 text-white/90 leading-relaxed break-words text-center",
      className
    )}
    {...props}
  />
))
EnhancedToastDescription.displayName = "EnhancedToastDescription"

// Auto-sizing toast container component
const EnhancedToastContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "success" | "error" | "warning" | "info";
  }
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center w-full min-h-[54px] max-w-full pr-6",
      className
    )}
    {...props}
  />
))
EnhancedToastContainer.displayName = "EnhancedToastContainer"

type EnhancedToastProps = React.ComponentPropsWithoutRef<typeof EnhancedToast> & {
  variant?: "default" | "success" | "error" | "warning" | "info";
}

type EnhancedToastActionElement = React.ReactElement<typeof EnhancedToastAction>

export {
  type EnhancedToastProps,
  type EnhancedToastActionElement,
  ToastProvider,
  EnhancedToastViewport,
  EnhancedToast,
  EnhancedToastTitle,
  EnhancedToastDescription,
  EnhancedToastClose,
  EnhancedToastAction,
  EnhancedToastContainer,
  ToastIcon
} 