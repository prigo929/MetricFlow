import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { ExportButton } from "@/components/shared/ExportButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Order, Company } from "@/types/database";

export const metadata: Metadata = { title: "Reports" };

type OrderRow = Order & { company: Pick<Company, "name" | "tier"> | null };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("orders")
    .select("*, company:companies(name, tier)")
    .not("status", "in", '("draft","cancelled")')
    .order("order_date", { ascending: false });
  const orders = (data ?? []) as OrderRow[];
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Exportable sales data for analysis">
        <ExportButton data={orders} filename="metricflow-orders" />
      </PageHeader>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Total Revenue", value: formatCurrency(totalRevenue) },
          { label: "Avg Order Value", value: formatCurrency(orders.length > 0 ? totalRevenue / orders.length : 0) },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={16} />Order Report</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Order #", "Company", "Date", "Status", "Total"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{o.order_number}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{o.company?.name}</td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(o.order_date)}</td>
                  <td className="py-3 px-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
