export interface RevenueTrendPoint {
  name: string;
  revenue: number;
  orders: number;
}

export interface ProductPerfPoint {
  product_id: string;
  product_name: string;
  category: string;
  units_sold: number;
  revenue: number;
}

export interface SalesRepPoint {
  user_id: string;
  full_name: string;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
}

/**
 * Returns the YYYY-MM-DD start date string relative to a selected range.
 */
export function getStartDate(range: string): string | null {
  const now = new Date();
  switch (range) {
    case "7D":
      now.setDate(now.getDate() - 6);
      return now.toISOString().split("T")[0];
    case "30D":
      now.setDate(now.getDate() - 29);
      return now.toISOString().split("T")[0];
    case "12M":
      now.setMonth(now.getMonth() - 11);
      now.setDate(1);
      return now.toISOString().split("T")[0];
    case "All":
    default:
      return null;
  }
}

/**
 * Aggregates orders into a gap-free timeline (daily for 7D/30D, monthly for 12M/All).
 */
export function aggregateRevenueTrend(orders: any[], range: string): RevenueTrendPoint[] {
  const activeOrders = orders.filter((o) => o.status !== "draft" && o.status !== "cancelled");
  const now = new Date();

  // 1. Daily intervals (7D or 30D)
  if (range === "7D" || range === "30D") {
    const daysToGenerate = range === "7D" ? 7 : 30;
    const dates: Record<string, { revenue: number; orders: number; label: string }> = {};

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en", { day: "numeric", month: "short" });
      dates[key] = { revenue: 0, orders: 0, label };
    }

    activeOrders.forEach((o) => {
      const key = o.order_date;
      if (dates[key]) {
        dates[key].revenue += Number(o.total_amount) || 0;
        dates[key].orders += 1;
      }
    });

    return Object.entries(dates)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, v]) => ({
        name: v.label,
        revenue: v.revenue,
        orders: v.orders,
      }));
  }

  // 2. Monthly intervals (12M or All)
  let start = new Date();
  if (range === "12M") {
    start.setMonth(now.getMonth() - 11);
  } else {
    // Range is 'All' — find earliest order date, or fall back to 12 months ago if empty
    if (activeOrders.length > 0) {
      const dates = activeOrders.map((o) => new Date(o.order_date));
      start = new Date(Math.min(...dates.map((d) => d.getTime())));
    } else {
      start.setMonth(now.getMonth() - 11);
    }
  }
  start.setDate(1);

  const months: Record<string, { revenue: number; orders: number; label: string }> = {};
  const cur = new Date(start);
  
  while (cur <= now) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    const label = cur.toLocaleDateString("en", { month: "short", year: "2-digit" });
    months[key] = { revenue: 0, orders: 0, label };
    cur.setMonth(cur.getMonth() + 1);
  }

  activeOrders.forEach((o) => {
    const key = o.order_date.substring(0, 7); // YYYY-MM
    if (months[key]) {
      months[key].revenue += Number(o.total_amount) || 0;
      months[key].orders += 1;
    }
  });

  return Object.entries(months)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, v]) => ({
      name: v.label,
      revenue: v.revenue,
      orders: v.orders,
    }));
}

/**
 * Aggregates order item sales per product.
 */
export function aggregateProductPerformance(orders: any[]): ProductPerfPoint[] {
  const activeOrders = orders.filter((o) => o.status !== "draft" && o.status !== "cancelled");
  const productsMap: Record<string, ProductPerfPoint> = {};

  activeOrders.forEach((o) => {
    const items = o.order_items || [];
    items.forEach((item: any) => {
      const p = item.product || {};
      const productId = item.product_id;
      if (!productId) return;

      if (!productsMap[productId]) {
        productsMap[productId] = {
          product_id: productId,
          product_name: p.name || "Unknown Product",
          category: p.category || "software",
          units_sold: 0,
          revenue: 0,
        };
      }

      productsMap[productId].units_sold += Number(item.quantity) || 0;
      productsMap[productId].revenue += Number(item.line_total) || 0;
    });
  });

  return Object.values(productsMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

/**
 * Aggregates orders per assigned sales representative.
 */
export function aggregateSalesRepPerformance(orders: any[]): SalesRepPoint[] {
  const activeOrders = orders.filter((o) => o.status !== "draft" && o.status !== "cancelled");
  const repsMap: Record<string, SalesRepPoint> = {};

  activeOrders.forEach((o) => {
    const rep = o.assigned_user || {};
    const userId = o.assigned_to;
    if (!userId) return;

    if (!repsMap[userId]) {
      repsMap[userId] = {
        user_id: userId,
        full_name: rep.full_name || "Unknown Representative",
        order_count: 0,
        total_revenue: 0,
        avg_order_value: 0,
      };
    }

    repsMap[userId].order_count += 1;
    repsMap[userId].total_revenue += Number(o.total_amount) || 0;
  });

  return Object.values(repsMap)
    .map((r) => ({
      ...r,
      avg_order_value: r.order_count > 0 ? r.total_revenue / r.order_count : 0,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}
