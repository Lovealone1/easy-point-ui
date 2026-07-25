import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"

const spinnerVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      sm: "size-3.5",
      md: "size-8",
      lg: "size-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface SpinnerProps
  extends Omit<React.ComponentProps<typeof Loader2>, "size">,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

interface PageLoaderProps {
  label?: string
  className?: string
}

function PageLoader({ label, className }: PageLoaderProps) {
  return (
    <div
      data-slot="page-loader"
      className={cn(
        "flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background text-foreground",
        className
      )}
    >
      <Spinner size="lg" />
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

export { Spinner, PageLoader, spinnerVariants }
