import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRangeFilter } from "@/components/shared/TimeRangeFilter";
import { RfmDetailsTable } from "./components/RfmDetailsTable";
import {
  getStartDate,
  aggregateRevenueTrend,
  aggregateProductPerformance,
  aggregateSalesRepPerformance,
} from "@/lib/analytics";
import dynamic from "next/dynamic";
import Link from "next/link";

const RevenueChart = dynamic(
  () => import("@/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const ProductPerformanceChart = dynamic(
  () => import("./components/ProductPerformanceChart").then((mod) => mod.ProductPerformanceChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const SalesRepChart = dynamic(
  () => import("./components/SalesRepChart").then((mod) => mod.SalesRepChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const RfmSegmentChart = dynamic(
  () => import("./components/RfmSegmentChart").then((mod) => mod.RfmSegmentChart),
  {
    ssr: false,
    loading: () => <div className="h-[240px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; tab?: string };
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

  const activeTab = searchParams.tab || "sales";

  // Fetch RFM Segments safely (degrades gracefully if migration 003 isn't run yet)
  let rfmData: any[] = [];
  try {
    const { data: rawRfm, error: rfmErr } = await (supabase as any)
      .from("v_rfm_segments")
      .select("*");
    if (!rfmErr && rawRfm) {
      rfmData = rawRfm;
    }
  } catch (e) {
    console.warn("v_rfm_segments query failed");
  }

  // Aggregate RFM segment counts
  const segmentCounts: Record<string, number> = {
    "Champions": 0,
    "Loyal Customers": 0,
    "Promising": 0,
    "New Customers": 0,
    "Can't Lose Them": 0,
    "At Risk": 0,
    "About to Sleep": 0,
    "Lost / Hibernating": 0,
  };

  rfmData.forEach((item) => {
    if (segmentCounts[item.rfm_segment] !== undefined) {
      segmentCounts[item.rfm_segment]++;
    }
  });

  const rfmChartData = Object.entries(segmentCounts).map(([segment, count]) => ({
    segment,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <PageHeader title="Analytics" subtitle="Deep-dive into your sales performance data" />
        {activeTab === "sales" && <TimeRangeFilter />}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <Link
          href={`/analytics?range=${range}&tab=sales`}
          className={`px-4 py-2 border-b-2 text-sm font-semibold transition-colors -mb-px ${
            activeTab === "sales"
              ? "border-brand-500 text-brand-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sales Performance
        </Link>
        <Link
          href={`/analytics?range=${range}&tab=segmentation`}
          className={`px-4 py-2 border-b-2 text-sm font-semibold transition-colors -mb-px flex items-center gap-1.5 ${
            activeTab === "segmentation"
              ? "border-brand-500 text-brand-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Customer Segmentation (RFM)
          {rfmData.length > 0 && (
            <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">
              {rfmData.length} Scored
            </span>
          )}
        </Link>
      </div>

      {activeTab === "sales" ? (
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
      ) : (
        <div className="space-y-6">
          {!rfmData.length ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500 text-sm italic">
                No customer segmentation data available. Verify that the SQL views and migration `003_sales_intelligence.sql` have been run, and that there are placed orders in the database.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Customer RFM Segment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RfmSegmentChart data={rfmChartData} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>About RFM Segments</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-600 space-y-3 leading-relaxed">
                    <p>
                      <strong>Recency (R)</strong>, <strong>Frequency (F)</strong>, and <strong>Monetary (M)</strong> segmentation provides an algorithmically backed classification of client accounts based on their ordering patterns:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><strong>Champions:</strong> Purchased recently, buy frequently, and are top spenders. Maintain engagement.</li>
                      <li><strong>Loyal Customers:</strong> High value and order consistency. Target with value upsells.</li>
                      <li><strong>New / Promising:</strong> Recent orders but low historical order frequency. Nurture into advocates.</li>
                      <li><strong>At Risk / About to Sleep:</strong> High value historically, but have exceeded average purchase windows. Requires direct sales rep outreach.</li>
                      <li><strong>Lost:</strong> Long inactivity periods. Run reactivation campaigns.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <RfmDetailsTable data={rfmData} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
