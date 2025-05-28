import { useToast } from "@/hooks/use-toast"
import { AnimatePresence } from "framer-motion"
import {
  EnhancedToast,
  EnhancedToastClose,
  EnhancedToastDescription,
  ToastProvider,
  EnhancedToastTitle,
  EnhancedToastViewport,
  EnhancedToastContainer,
  ToastIcon
} from "@/components/ui/enhanced-toast"

export function EnhancedToaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <AnimatePresence>
        {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
          // Define title and description styles based on variant
          const getTitleClass = () => {
            switch (variant) {
              case "success":
                return "text-[#30D57A]";
              case "error":
                return "text-[#ED4245]";
              default:
                return "bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200";
            }
          };
          
          return (
            <EnhancedToast key={id} variant={variant as any} {...props}>
              <EnhancedToastContainer variant={variant as any} className="relative">
                <div className="flex items-center">
                  <ToastIcon variant={variant as any} />
                  <div className="grid gap-1 flex-1 text-center">
                    {title && (
                      <EnhancedToastTitle className={getTitleClass()}>
                        {title}
                      </EnhancedToastTitle>
                    )}
                    {description && (
                      <EnhancedToastDescription>
                        {description}
                      </EnhancedToastDescription>
                    )}
                  </div>
                </div>
                {action}
                <EnhancedToastClose />
              </EnhancedToastContainer>
            </EnhancedToast>
          )
        })}
      </AnimatePresence>
      <EnhancedToastViewport />
    </ToastProvider>
  )
} 