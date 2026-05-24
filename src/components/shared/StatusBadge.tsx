import { cn, ORDER_STATUS_CONFIG, TIER_CONFIG } from "@/lib/utils/formatting";

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_CONFIG[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", config.color, config.bg)}>
      {config.label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] ?? { label: tier, color: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", config.color, config.bg)}>
      {config.label}
    </span>
  );
}
