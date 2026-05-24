import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm bg-white placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          "disabled:bg-gray-50 disabled:text-gray-500",
          error ? "border-red-400" : "border-gray-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
