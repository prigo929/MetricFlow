export interface RevenueTrendPoint {
  name: string; // The text label for the chart axis (e.g. "May 26" or "May 26")
  revenue: number; // Sum of order total amounts
  orders: number; // Count of orders
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
 * Helper to calculate start dates based on user selecting range filters:
 * - "7D": subtracts 6 days from current date (returns YYYY-MM-DD string)
 * - "30D": subtracts 29 days
 * - "12M": subtracts 11 months, setting day to 1st of month
 * - "All": returns null (meaning no date filters are applied in Supabase queries)
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
 * WHAT IS ZERO-FILLING?
 * If we only query our database for orders, we'll only have data for dates where sales occurred.
 * If we had zero sales on Tuesday, there would be no database records for Tuesday.
 * If we fed this directly into Recharts, the chart lines would skip Tuesday, making timelines look warped.
 * 
 * We solve this by pre-generating a "gap-free calendar timeline" with values initialized to 0 (zero-filling),
 * and then overlaying our actual sales data.
 */
export function aggregateRevenueTrend(orders: any[], range: string): RevenueTrendPoint[] {
  // Exclude draft or cancelled orders from analytical totals
  const activeOrders = orders.filter((o) => o.status !== "draft" && o.status !== "cancelled");
  const now = new Date();

  // 1. Daily intervals (7D or 30D ranges)
  if (range === "7D" || range === "30D") {
    const daysToGenerate = range === "7D" ? 7 : 30;
    const dates: Record<string, { revenue: number; orders: number; label: string }> = {};

    // Generate dates timeline dictionary with zero values
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en", { day: "numeric", month: "short" });
      dates[key] = { revenue: 0, orders: 0, label };
    }

    // Populate actual order revenues on matching dates
    activeOrders.forEach((o) => {
      const key = o.order_date;
      if (dates[key]) {
        dates[key].revenue += Number(o.total_amount) || 0;
        dates[key].orders += 1;
      }
    });

    // Map dictionary back to a sorted array format for Recharts consumption
    return Object.entries(dates)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, v]) => ({
        name: v.label,
        revenue: v.revenue,
        orders: v.orders,
      }));
  }

  // 2. Monthly intervals (12M or All ranges)
  let start = new Date();
  if (range === "12M") {
    start.setMonth(now.getMonth() - 11);
  } else {
    // Range is 'All' — find the earliest order date in the dataset, or default to 12 months ago
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
  
  // Fill month keys (e.g. "2024-05") with zero counts
  while (cur <= now) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    const label = cur.toLocaleDateString("en", { month: "short", year: "2-digit" });
    months[key] = { revenue: 0, orders: 0, label };
    cur.setMonth(cur.getMonth() + 1);
  }

  activeOrders.forEach((o) => {
    const key = o.order_date.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
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
 * Combines order_items records and returns the top 10 best-selling items in the period.
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

      // Initialize mapping slot for product if it's the first time we process it
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

  // Convert map to array, sort descending by revenue, and return top 10
  return Object.values(productsMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

/**
 * Aggregates orders per assigned sales representative.
 * Computes average order values (AOV) and revenue contribution in memory.
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

