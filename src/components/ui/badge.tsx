import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}

const variantClasses = {
  default: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  muted:   "bg-gray-100 text-gray-600 border-gray-200",
};

export function Badge({ children, className, variant = "muted" }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
