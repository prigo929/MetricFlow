import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableFilters } from "@/components/shared/TableFilters";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { Plus, ShoppingCart } from "lucide-react";
import type { Order, Company, UserProfile } from "@/types/database";

export const metadata: Metadata = { title: "Orders" };

type OrderRow = Order & { company: Pick<Company, "name"> | null; assigned_user: Pick<UserProfile, "full_name"> | null };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const supabase = await createClient();
  
  const q = searchParams.q || "";
  const status = searchParams.status || "";

  const { data } = await (supabase as any)
    .from("orders")
    .select("*, company:companies(name), assigned_user:user_profiles(full_name)")
    .order("order_date", { ascending: false });

  let orders = (data ?? []) as OrderRow[];
  const isFiltered = !!(q || status);

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  if (q) {
    const searchLower = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(searchLower) ||
        (o.company?.name ?? "").toLowerCase().includes(searchLower) ||
        (o.assigned_user?.full_name ?? "").toLowerCase().includes(searchLower)
    );
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${orders.length} orders total`}>
        <Link href="/orders/new"><Button><Plus size={16} />New Order</Button></Link>
      </PageHeader>

      <TableFilters
        searchPlaceholder="Search orders by number, company, or rep..."
        filterParamName="status"
        filterPlaceholder="All Statuses"
        filterOptions={[
          { value: "draft", label: "Draft" },
          { value: "pending", label: "Pending" },
          { value: "confirmed", label: "Confirmed" },
          { value: "processing", label: "Processing" },
          { value: "shipped", label: "Shipped" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />

      {!orders.length ? (
        isFiltered ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search query or status filters.</p>
          </div>
        ) : (
          <EmptyState icon={ShoppingCart} title="No orders yet" description="Create your first order to start tracking sales." />
        )
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Order #", "Company", "Assigned To", "Status", "Date", "Total", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-700">{o.order_number}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{o.company?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{o.assigned_user?.full_name ?? "—"}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(o.order_date)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-4"><Link href={`/orders/${o.id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
