import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableFilters } from "@/components/shared/TableFilters";
import { ExportButton } from "@/components/shared/ExportButton";
import { Pagination } from "@/components/shared/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { Plus, ShoppingCart, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { Order, Company, UserProfile } from "@/types/database";

export const metadata: Metadata = { title: "Orders" };

type OrderRow = Order & { company: Pick<Company, "name"> | null; assigned_user: Pick<UserProfile, "full_name"> | null };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string; limit?: string; sort?: string; order?: string };
}) {
  const supabase = await createClient();
  
  const q = searchParams.q || "";
  const status = searchParams.status || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "10", 10);
  const sort = searchParams.sort || "order_date";
  const order = searchParams.order || "desc";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let companyIds: string[] = [];
  let userIds: string[] = [];

  if (q) {
    const { data: companies } = await (supabase as any)
      .from("companies")
      .select("id")
      .ilike("name", `%${q}%`);
    if (companies) {
      companyIds = companies.map((c: any) => c.id);
    }

    const { data: users } = await (supabase as any)
      .from("user_profiles")
      .select("id")
      .ilike("full_name", `%${q}%`);
    if (users) {
      userIds = users.map((u: any) => u.id);
    }
  }

  // Build paginated query
  let listQuery = (supabase as any)
    .from("orders")
    .select("*, company:companies(name), assigned_user:user_profiles(full_name)", { count: "exact" });

  if (status) {
    listQuery = listQuery.eq("status", status);
  }

  if (q) {
    const conditions = [`order_number.ilike.%${q}%`];
    if (companyIds.length > 0) {
      conditions.push(`company_id.in.(${companyIds.join(",")})`);
    }
    if (userIds.length > 0) {
      conditions.push(`assigned_to.in.(${userIds.join(",")})`);
    }
    listQuery = listQuery.or(conditions.join(","));
  }

  const { data: listData, count } = await listQuery
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  // Build export query (without limit/range)
  let exportQuery = (supabase as any)
    .from("orders")
    .select("*, company:companies(name), assigned_user:user_profiles(full_name)");

  if (status) {
    exportQuery = exportQuery.eq("status", status);
  }

  if (q) {
    const conditions = [`order_number.ilike.%${q}%`];
    if (companyIds.length > 0) {
      conditions.push(`company_id.in.(${companyIds.join(",")})`);
    }
    if (userIds.length > 0) {
      conditions.push(`assigned_to.in.(${userIds.join(",")})`);
    }
    exportQuery = exportQuery.or(conditions.join(","));
  }

  const { data: exportData } = await exportQuery.order(sort, { ascending: order === "asc" });

  const orders = (listData ?? []) as OrderRow[];
  const exportOrders = (exportData ?? []) as OrderRow[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);
  const isFiltered = !!(q || status);

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${totalItems} orders total`}>
        <div className="flex gap-2">
          <ExportButton data={exportOrders} filename="orders" />
          <Link href="/orders/new"><Button><Plus size={16} />New Order</Button></Link>
        </div>
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
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  {[
                    { label: "Order #", key: "order_number", sortable: true, width: "w-[15%]" },
                    { label: "Company", key: "company", sortable: false, width: "w-[25%]" },
                    { label: "Assigned To", key: "assigned_to", sortable: false, width: "w-[20%]" },
                    { label: "Status", key: "status", sortable: true, width: "w-[15%]" },
                    { label: "Date", key: "order_date", sortable: true, width: "w-[15%]" },
                    { label: "Total", key: "total_amount", sortable: true, width: "w-[10%]" },
                  ].map((col) => {
                    if (!col.sortable) {
                      return (
                        <th key={col.label} className={`text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide ${col.width}`}>
                          {col.label}
                        </th>
                      );
                    }

                    const isSorted = sort === col.key;
                    const nextOrder = isSorted && order === "asc" ? "desc" : "asc";
                    
                    const nextParams = new URLSearchParams();
                    if (q) nextParams.set("q", q);
                    if (status) nextParams.set("status", status);
                    nextParams.set("page", "1");
                    if (limit) nextParams.set("limit", limit.toString());
                    nextParams.set("sort", col.key);
                    nextParams.set("order", nextOrder);

                    return (
                      <th key={col.key} className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide text-left ${col.width}`}>
                        <Link
                          href={`/orders?${nextParams.toString()}`}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
                        >
                          {col.label}
                          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                            {isSorted ? (
                              order === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                            ) : (
                              <ArrowUpDown size={13} className="opacity-40 group-hover:opacity-100" />
                            )}
                          </span>
                        </Link>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 w-[5%]"></th>
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
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={limit}
            totalItems={totalItems}
          />
        </Card>
      )}
    </div>
  );
}
