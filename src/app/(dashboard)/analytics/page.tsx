import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ProductPerformanceChart } from "@/components/charts/ProductPerformanceChart";
import { SalesRepChart } from "@/components/charts/SalesRepChart";
import type { RevenueByMonth, ProductPerf, SalesByRep } from "@/types/database";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [{ data: rev }, { data: prods }, { data: reps }] = await Promise.all([
    (supabase as any).from("v_revenue_by_month").select("*").order("month").limit(12),
    (supabase as any).from("v_product_performance").select("*").limit(10),
    (supabase as any).from("v_sales_by_rep").select("*").limit(10),
  ]);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep-dive into your sales performance data" />
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Revenue Over Time (12 Months)</CardTitle></CardHeader>
          <CardContent><RevenueChart data={(rev ?? []) as RevenueByMonth[]} /></CardContent>
        </Card>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
            <CardContent><ProductPerformanceChart data={(prods ?? []) as ProductPerf[]} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales by Representative</CardTitle></CardHeader>
            <CardContent><SalesRepChart data={(reps ?? []) as SalesByRep[]} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
