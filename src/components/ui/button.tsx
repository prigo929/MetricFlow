import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:   "bg-brand-500 text-white hover:bg-brand-600",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        outline:   "border border-gray-300 text-gray-700 hover:bg-gray-50",
        ghost:     "text-gray-600 hover:bg-gray-100",
        danger:    "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm:      "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg:      "h-11 px-6 text-base",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
