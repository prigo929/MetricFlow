import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/charts/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);

const OrderStatusChart = dynamic(
  () => import("@/components/charts/OrderStatusChart").then((mod) => mod.OrderStatusChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">Loading chart...</div>,
  }
);
import { TopCustomersTable } from "@/components/charts/TopCustomersTable";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import type { RevenueByMonth, TopCustomer } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

  const [
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { count: companyCount },
    { data: revenueData },
    { data: allOrders },
    { data: topCustomers },
  ] = await Promise.all([
    (supabase as any).from("orders").select("total_amount").gte("order_date", thisMonthStart).not("status", "in", '("draft","cancelled")'),
    (supabase as any).from("orders").select("total_amount").gte("order_date", lastMonthStart).lte("order_date", lastMonthEnd).not("status", "in", '("draft","cancelled")'),
    (supabase as any).from("companies").select("*", { count: "exact", head: true }),
    (supabase as any).from("v_revenue_by_month").select("*").order("month", { ascending: true }).limit(12),
    (supabase as any).from("orders").select("status"),
    (supabase as any).from("v_top_customers").select("*").limit(5),
  ]);

  const thisRevenue = (thisMonthOrders as any[] ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const lastRevenue = (lastMonthOrders as any[] ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const growth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  const orderCount = (thisMonthOrders as any[] ?? []).length;

  const statusMap: Record<string, number> = {};
  (allOrders as any[] ?? []).forEach((o: any) => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's what's happening at MetricFlow today." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Revenue (This Month)" value={thisRevenue} format="currency" change={growth} icon={<DollarSign size={18} />} />
        <KpiCard title="Orders (This Month)" value={orderCount} icon={<ShoppingCart size={18} />} />
        <KpiCard title="Avg. Order Value" value={orderCount > 0 ? thisRevenue / orderCount : 0} format="currency" icon={<TrendingUp size={18} />} />
        <KpiCard title="Active Companies" value={companyCount ?? 0} icon={<Users size={18} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Revenue Trend (12 Months)</CardTitle></CardHeader>
          <CardContent><RevenueChart data={(revenueData ?? []) as RevenueByMonth[]} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
          <CardContent><OrderStatusChart data={statusData} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TopCustomersTable data={(topCustomers ?? []) as TopCustomer[]} />
        </CardContent>
      </Card>
    </div>
  );
}
