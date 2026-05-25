"use client";
import { useState } from "react";
import { updateOrderStatus } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_CONFIG } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

const TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  draft:       "pending",
  pending:     "confirmed",
  confirmed:   "processing",
  processing:  "shipped",
  shipped:     "delivered",
  delivered:   null,
  cancelled:   null,
};

interface Props { orderId: string; currentStatus: OrderStatus }

export function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const next = TRANSITIONS[currentStatus];

  if (!next) return null;

  const nextConfig = ORDER_STATUS_CONFIG[next];

  const handleAdvance = async () => {
    setLoading(true);
    await updateOrderStatus(orderId, next);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleAdvance}
        disabled={loading}
        size="sm"
        className="text-xs"
      >
        {loading ? "Updating…" : `Mark as ${nextConfig.label}`}
      </Button>
      <Button
        onClick={() => updateOrderStatus(orderId, "cancelled")}
        disabled={loading}
        size="sm"
        variant="outline"
        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
      >
        Cancel Order
      </Button>
    </div>
  );
}
