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
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseListParams, buildSortHref } from "@/lib/list-params";
import { Plus, ShoppingCart, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { Order, Company, UserProfile, OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Orders" };

type OrderRow = Order & { company: Pick<Company, "name"> | null; assigned_user: Pick<UserProfile, "full_name"> | null };

/**
 * React Server Component displaying all sales orders.
 * 
 * Includes advanced server-side search spanning multiple related database tables,
 * paginating rows, ordering by columns, and filtering by order status.
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string; limit?: string; sort?: string; order?: string };
}) {
  const supabase = await createClient();
  
  // Parse the shared list params (search, page, limit, sort, order) + pagination range.
  const { q, page, limit, sort, order, from, to } = parseListParams(searchParams, {
    sort: "order_date",
  });
  // Secondary filter specific to this page.
  const status = searchParams.status || "";

  // Concept: Cross-Table Relational Filtering in PostgREST
  // Supabase's API (PostgREST) is stateless and doesn't allow easy filtering of parent tables 
  // directly within the select query (e.g. searching orders by company name).
  //
  // Workaround Strategy:
  // 1. If there is a search term `q`, we fetch matching Company IDs and Sales Rep User IDs first.
  // 2. We use those IDs in the main query using an SQL `in(...)` clause combined inside an `or` block.
  let companyIds: string[] = [];
  let userIds: string[] = [];

  if (q) {
    // Look up company IDs where name contains the search string
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", `%${q}%`);
    if (companies) {
      companyIds = companies.map((c) => c.id);
    }

    // Look up Sales Rep IDs where name contains the search string
    const { data: users } = await supabase
      .from("user_profiles")
      .select("id")
      .ilike("full_name", `%${q}%`);
    if (users) {
      userIds = users.map((u) => u.id);
    }
  }

  // Build paginated query
  // Syntax "company:companies(name)" renames the nested relational field from "companies" to "company"
  // and selects only the "name" column, performing a left-join on companies.company_id = orders.company_id.
  let listQuery = supabase
    .from("orders")
    .select("*, company:companies(name), assigned_user:user_profiles(full_name)", { count: "exact" });

  // Filter orders by status if selected
  if (status) {
    listQuery = listQuery.eq("status", status as OrderStatus);
  }

  // Construct dynamic OR conditions for the search query
  if (q) {
    // Always match on order number
    const conditions = [`order_number.ilike.%${q}%`];
    
    // Match order if it belongs to any companies found in the sub-lookup
    if (companyIds.length > 0) {
      conditions.push(`company_id.in.(${companyIds.join(",")})`);
    }
    
    // Match order if it belongs to any sales reps found in the sub-lookup
    if (userIds.length > 0) {
      conditions.push(`assigned_to.in.(${userIds.join(",")})`);
    }
    
    // Join the conditions with comma to perform an SQL OR condition
    listQuery = listQuery.or(conditions.join(","));
  }

  // Fetch only the paginated slice of records
  const { data: listData, count } = await listQuery
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  // Build a parallel export query (ignoring limits/range offset)
  // Ensures the exported CSV spreadsheet contains all filtered records, not just the active page.
  // The export also pulls order_items + product so the CSV can be flattened to one row per line.
  let exportQuery = supabase
    .from("orders")
    .select(
      "*, company:companies(name), assigned_user:user_profiles(full_name), order_items(quantity, unit_price, line_total, product:products(name, sku))"
    );

  if (status) {
    exportQuery = exportQuery.eq("status", status as OrderStatus);
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

                    return (
                      <th key={col.key} className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide text-left ${col.width}`}>
                        <Link
                          href={buildSortHref("/orders", searchParams, col.key, sort, order)}
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
