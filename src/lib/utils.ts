import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — merge Tailwind classes safely.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 * Example: cn("px-2 py-1", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (EUR by default for Romanian academic context).
 */
export function formatCurrency(
  amount: number,
  currency = "EUR",
  locale = "ro-RO"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(n: number, locale = "ro-RO"): string {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Format a percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a date string as a readable date.
 */
export function formatDate(dateStr: string, locale = "ro-RO"): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncate a string to maxLength characters.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Convert an order status to a display-friendly label and color.
 */
export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft:      { label: "Draft",      color: "text-gray-600",   bg: "bg-gray-100" },
  pending:    { label: "Pending",    color: "text-yellow-700", bg: "bg-yellow-50" },
  confirmed:  { label: "Confirmed",  color: "text-blue-700",   bg: "bg-blue-50" },
  processing: { label: "Processing", color: "text-purple-700", bg: "bg-purple-50" },
  shipped:    { label: "Shipped",    color: "text-indigo-700", bg: "bg-indigo-50" },
  delivered:  { label: "Delivered",  color: "text-green-700",  bg: "bg-green-50" },
  cancelled:  { label: "Cancelled",  color: "text-red-700",    bg: "bg-red-50" },
};

/**
 * Generate a human-readable order number from a UUID prefix.
 */
export function formatOrderNumber(orderNumber: string): string {
  return `ORD-${orderNumber.toUpperCase()}`;
}

/**
 * Company tier badge config.
 */
export const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  enterprise:  { label: "Enterprise",  color: "text-brand-700", bg: "bg-brand-50" },
  mid_market:  { label: "Mid-Market",  color: "text-blue-700",  bg: "bg-blue-50" },
  smb:         { label: "SMB",         color: "text-gray-600",  bg: "bg-gray-100" },
};

/**
 * Calculate growth percentage between two values.
 */
export function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
