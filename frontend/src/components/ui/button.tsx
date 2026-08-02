import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_18px_50px_-18px_rgba(34,211,238,0.75)] hover:from-cyan-400 hover:to-blue-500",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline: "border border-white/15 bg-slate-900/70 text-slate-100 hover:bg-slate-800/80",
        secondary: "bg-slate-800/80 text-slate-100 hover:bg-slate-700/80",
        ghost: "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white",
        link: "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
