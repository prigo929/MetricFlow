import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * WHAT IS cn()?
 * This function stands for "Class Names". It merges Tailwind CSS utility classes dynamically.
 * It combines two library helpers:
 * 1. `clsx`: allows us to conditionally apply styles (e.g. `isActive && 'bg-blue-500'`).
 * 2. `tailwind-merge`: solves Tailwind CSS conflicts. If we pass `px-4` and `px-2` to the same element,
 *    `tailwind-merge` ensures that the last class overrides the previous ones instead of causing bugs.
 * 
 * Example: `cn("px-4 text-white", active && "bg-brand-500")`
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * WHAT IS Intl.NumberFormat?
 * It is a built-in JavaScript object that handles international locale formatting.
 * 
 * This formats raw numbers into standard currency layouts (e.g. 5000 becomes €5,000).
 */
export function formatCurrency(
  amount: number,
  currency = "EUR",
  locale = "ro-RO"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0, // Avoid decimals for cleaner B2B metrics views
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with thousand separators (e.g., 1000000 -> 1.000.000 in Romanian locale).
 */
export function formatNumber(n: number, locale = "ro-RO"): string {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Formats decimal values into display percentages (e.g. 0.155 -> +15.5%)
 */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format timestamp strings into human-readable B2B date labels.
 */
export function formatDate(dateStr: string, locale = "ro-RO"): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncates long client descriptions to fit card boundaries gracefully.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * LOOKUP CONFIGURATIONS:
 * Mapping tables that assign human labels and Tailwind color badges to database status tags.
 * This pattern keeps formatting decoupled from table views.
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
 * Generate human-readable order tags.
 */
export function formatOrderNumber(orderNumber: string): string {
  return `ORD-${orderNumber.toUpperCase()}`;
}

/**
 * Badges configuration mapping database tiers to active styling.
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
 * Math calculation: compute percentage differences.
 */
export function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

