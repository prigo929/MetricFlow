import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRangeFilter } from "@/components/shared/TimeRangeFilter";
import { getStartDate, aggregateRevenueTrend } from "@/lib/utils/aggregation";
import { DollarSign, ShoppingCart, Users, TrendingUp, ShieldAlert } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const OrderStatusChart = dynamic(
  () => import("./components/OrderStatusChart").then((mod) => mod.OrderStatusChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const TopCustomersTable = dynamic(
  () => import("./components/TopCustomersTable").then((mod) => mod.TopCustomersTable),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading leaderboard...</div>,
  }
);

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const supabase = await createClient();
  const range = searchParams.range || "12M";
  const startDate = getStartDate(range);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

  // Configure time-filtered queries
  let rangeOrdersQuery = (supabase as any).from("orders").select("*, company:companies(id, name, tier)").not("status", "in", '("draft","cancelled")');
  let rangeAllOrdersQuery = (supabase as any).from("orders").select("status");

  if (startDate) {
    rangeOrdersQuery = rangeOrdersQuery.gte("order_date", startDate);
    rangeAllOrdersQuery = rangeAllOrdersQuery.gte("order_date", startDate);
  }

  const [
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { count: companyCount },
    { data: rangeOrdersData },
    { data: statusOrdersData },
    { data: lowStockProducts },
  ] = await Promise.all([
    (supabase as any).from("orders").select("total_amount").gte("order_date", thisMonthStart).not("status", "in", '("draft","cancelled")'),
    (supabase as any).from("orders").select("total_amount").gte("order_date", lastMonthStart).lte("order_date", lastMonthEnd).not("status", "in", '("draft","cancelled")'),
    (supabase as any).from("companies").select("*", { count: "exact", head: true }),
    rangeOrdersQuery.order("order_date", { ascending: true }),
    rangeAllOrdersQuery,
    (supabase as any).from("products").select("id, name, stock_qty").eq("is_active", true).lt("stock_qty", 10),
  ]);

  // Fetch Sales Intelligence alerts safely (degrades gracefully if migration 003 isn't run yet)
  let churnAlerts: any[] = [];
  let velocityAlerts: any[] = [];

  try {
    const { data: churnData, error: churnErr } = await (supabase as any)
      .from("v_churn_risk")
      .select("*")
      .eq("is_at_risk", true);
    if (!churnErr && churnData) {
      churnAlerts = churnData;
    }
  } catch (e) {
    console.warn("v_churn_risk query failed");
  }

  try {
    const { data: velocityData, error: velErr } = await (supabase as any)
      .from("v_product_velocity")
      .select("*")
      .lte("days_to_stockout", 14)
      .order("days_to_stockout", { ascending: true });
    if (!velErr && velocityData) {
      velocityAlerts = velocityData;
    }
  } catch (e) {
    console.warn("v_product_velocity query failed");
  }

  // Compute month-over-month growth (keeps monthly context)
  const thisRevenue = (thisMonthOrders as any[] ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const lastRevenue = (lastMonthOrders as any[] ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const growth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  // Compute time-range specific KPIs
  const rangeOrders = (rangeOrdersData ?? []) as any[];
  const rangeRevenue = rangeOrders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const rangeOrderCount = rangeOrders.length;
  const rangeAov = rangeOrderCount > 0 ? rangeRevenue / rangeOrderCount : 0;

  // Status mapping for the selected time range
  const statusMap: Record<string, number> = {};
  (statusOrdersData as any[] ?? []).forEach((o: any) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Dynamic Top Customers aggregation in memory
  const customerMap: Record<string, { company_name: string; order_count: number; total_revenue: number; tier: string }> = {};
  rangeOrders.forEach((o: any) => {
    const companyId = o.company_id;
    if (!companyId) return;
    if (!customerMap[companyId]) {
      customerMap[companyId] = {
        company_name: o.company?.name || "Unknown Company",
        order_count: 0,
        total_revenue: 0,
        tier: o.company?.tier || "smb",
      };
    }
    customerMap[companyId].order_count += 1;
    customerMap[companyId].total_revenue += Number(o.total_amount) || 0;
  });

  const topCustomers = Object.entries(customerMap)
    .map(([company_id, v]) => ({
      company_id,
      company_name: v.company_name,
      tier: v.tier as any,
      order_count: v.order_count,
      total_revenue: v.total_revenue,
      avg_order_value: v.order_count > 0 ? v.total_revenue / v.order_count : 0,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 5);

  const lowStock = (lowStockProducts ?? []) as { id: string; name: string; stock_qty: number }[];

  const getRangeLabel = (r: string) => {
    switch (r) {
      case "7D": return "Last 7 Days";
      case "30D": return "Last 30 Days";
      case "12M": return "Last 12 Months";
      case "All":
      default:
        return "All Time";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <PageHeader title="Dashboard" subtitle="Welcome back — here's what's happening at MetricFlow today." />
        <TimeRangeFilter />
      </div>

      {lowStock.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2.5 shadow-sm">
          <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="font-semibold">Inventory Alert: Low Stock Warning</p>
            <p className="text-amber-700 text-xs mt-0.5">
              There are {lowStock.length} active products running low on stock.{" "}
              <Link href="/products" className="font-bold underline hover:text-amber-900">
                View catalog to restock
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Sales Intelligence & Alerts Grid */}
      {(churnAlerts.length > 0 || velocityAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Churn Risk Alerts */}
          {churnAlerts.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 shadow-sm flex items-start gap-2.5">
              <ShieldAlert className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
              <div className="w-full">
                <p className="font-semibold text-sm">Churn Risk Alert: Inactive Clients</p>
                <p className="text-red-700 text-xs mt-0.5 mb-3">
                  The following accounts have exceeded their historical purchase cadence by 1.5x or more:
                </p>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {churnAlerts.map((c) => (
                    <div key={c.company_id} className="flex justify-between items-center text-xs bg-white/70 border border-red-100 p-2 rounded-lg">
                      <Link href={`/companies/${c.company_id}`} className="font-bold hover:underline hover:text-brand-700">
                        {c.company_name}
                      </Link>
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                        {c.days_since_last_order}D inactive / {c.avg_days_between}D avg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Predictive Stockouts */}
          {velocityAlerts.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 shadow-sm flex items-start gap-2.5">
              <ShieldAlert className="text-orange-600 mt-0.5 flex-shrink-0" size={18} />
              <div className="w-full">
                <p className="font-semibold text-sm">Predictive Stockout Alerts</p>
                <p className="text-orange-700 text-xs mt-0.5 mb-3">
                  Based on rolling 30-day velocity, these products will run out in less than 14 days:
                </p>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {velocityAlerts.map((p) => (
                    <div key={p.product_id} className="flex justify-between items-center text-xs bg-white/70 border border-orange-100 p-2 rounded-lg">
                      <Link href={`/products`} className="font-bold hover:underline hover:text-brand-700">
                        {p.product_name}
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.days_to_stockout <= 3 ? "bg-red-100 text-red-800 animate-pulse" : "bg-orange-100 text-orange-800"
                      }`}>
                        {p.days_to_stockout === 0 ? "Depleted!" : `Depletes in ~${p.days_to_stockout} days`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title={`Revenue (${getRangeLabel(range)})`} value={rangeRevenue} format="currency" change={range === "12M" ? growth : undefined} icon={<DollarSign size={18} />} />
        <KpiCard title={`Orders (${getRangeLabel(range)})`} value={rangeOrderCount} icon={<ShoppingCart size={18} />} />
        <KpiCard title="Avg. Order Value" value={rangeAov} format="currency" icon={<TrendingUp size={18} />} />
        <KpiCard title="Active Companies" value={companyCount ?? 0} icon={<Users size={18} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <RevenueChart data={aggregateRevenueTrend(rangeOrders, range)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
          <CardContent>
            {!statusData.length ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 italic">No orders in this range</div>
            ) : (
              <OrderStatusChart data={statusData} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!topCustomers.length ? (
            <div className="py-12 text-center text-sm text-gray-400 italic border-t border-t-gray-50">No sales recorded in this range</div>
          ) : (
            <TopCustomersTable data={topCustomers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
