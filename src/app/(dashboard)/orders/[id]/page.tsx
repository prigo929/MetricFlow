import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { OrderStatusUpdater } from "@/components/shared/OrderStatusUpdater";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Building2, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, Company, Product, UserProfile } from "@/types";

export const metadata: Metadata = { title: "Order Detail" };

type OrderDetail = Order & {
  company: Pick<Company, "id" | "name" | "tier"> | null;
  assigned_user: Pick<UserProfile, "id" | "full_name"> | null;
  order_items: (OrderItem & { product: Pick<Product, "id" | "name" | "sku" | "category"> | null })[];
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("orders")
    .select(`
      *,
      company:companies(id, name, tier),
      assigned_user:user_profiles(id, full_name),
      order_items(*, product:products(id, name, sku, category))
    `)
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const order = data as OrderDetail;

  return (
    <div className="max-w-4xl">
      <PageHeader title={order.order_number} subtitle={`Order created ${formatDate(order.created_at)}`}>
        <Link href="/orders">
          <Button variant="outline"><ArrowLeft size={15} />Back to Orders</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Status */}
        <Card className="col-span-3">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Building2 size={14} />
                <span className="font-medium">{order.company?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <User size={14} />
                <span>{order.assigned_user?.full_name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar size={14} />
                <span>{formatDate(order.order_date)}</span>
              </div>
            </div>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="col-span-3">
          <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Product", "SKU", "Category", "Qty", "Unit Price", "Line Total"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.product?.name ?? "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.product?.sku}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.product?.category}</td>
                    <td className="py-3 px-4 text-gray-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-gray-700">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="py-3 px-4 text-right font-semibold text-gray-700">Total</td>
                  <td className="py-3 px-4 font-bold text-lg text-brand-600">{formatCurrency(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card className="col-span-3">
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
