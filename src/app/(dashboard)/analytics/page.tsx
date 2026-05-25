import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRangeFilter } from "@/components/shared/TimeRangeFilter";
import {
  getStartDate,
  aggregateRevenueTrend,
  aggregateProductPerformance,
  aggregateSalesRepPerformance,
} from "@/lib/utils/aggregation";
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const ProductPerformanceChart = dynamic(
  () => import("@/components/charts/ProductPerformanceChart").then((mod) => mod.ProductPerformanceChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const SalesRepChart = dynamic(
  () => import("@/components/charts/SalesRepChart").then((mod) => mod.SalesRepChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const supabase = await createClient();
  const range = searchParams.range || "12M";
  const startDate = getStartDate(range);

  // Fetch orders and items dynamically for range
  let query = (supabase as any)
    .from("orders")
    .select(`
      *,
      company:companies(name),
      assigned_user:user_profiles(full_name),
      order_items(*, product:products(name, sku, category))
    `)
    .not("status", "in", '("draft","cancelled")');

  if (startDate) {
    query = query.gte("order_date", startDate);
  }

  const { data } = await query.order("order_date", { ascending: true });
  const rangeOrders = (data ?? []) as any[];

  // Aggregate stats using in-memory triggers
  const revenueTrend = aggregateRevenueTrend(rangeOrders, range);
  const productPerf = aggregateProductPerformance(rangeOrders);
  const salesRepPerf = aggregateSalesRepPerformance(rangeOrders);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <PageHeader title="Analytics" subtitle="Deep-dive into your sales performance data" />
        <TimeRangeFilter />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            {!revenueTrend.length ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 italic">No sales recorded in this range</div>
            ) : (
              <RevenueChart data={revenueTrend} />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
            <CardContent>
              {!productPerf.length ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 italic">No product sales in this range</div>
              ) : (
                <ProductPerformanceChart data={productPerf as any} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sales by Representative</CardTitle></CardHeader>
            <CardContent>
              {!salesRepPerf.length ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 italic">No representative sales in this range</div>
              ) : (
                <SalesRepChart data={salesRepPerf as any} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
