import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableFilters } from "@/components/shared/TableFilters";
import { ExportButton } from "@/components/shared/ExportButton";
import { Pagination } from "@/components/shared/Pagination";
import { formatCurrency } from "@/lib/utils";
import { Plus, Building2, Globe, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { Company } from "@/types/database";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string; page?: string; limit?: string; sort?: string; order?: string };
}) {
  const supabase = await createClient();
  
  const q = searchParams.q || "";
  const tier = searchParams.tier || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = parseInt(searchParams.limit || "10", 10);
  const sort = searchParams.sort || "created_at";
  const order = searchParams.order || "desc";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build paginated query
  let listQuery = (supabase as any).from("companies").select("*", { count: "exact" });
  if (q) {
    listQuery = listQuery.ilike("name", `%${q}%`);
  }
  if (tier) {
    listQuery = listQuery.eq("tier", tier);
  }
  const { data: listData, count } = await listQuery
    .order(sort, { ascending: order === "asc" })
    .range(from, to);

  // Build export query (without limit/range)
  let exportQuery = (supabase as any).from("companies").select("*");
  if (q) {
    exportQuery = exportQuery.ilike("name", `%${q}%`);
  }
  if (tier) {
    exportQuery = exportQuery.eq("tier", tier);
  }
  const { data: exportData } = await exportQuery.order(sort, { ascending: order === "asc" });

  const companies = (listData ?? []) as Company[];
  const exportCompanies = (exportData ?? []) as Company[];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);
  const isFiltered = !!(q || tier);

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${totalItems} companies in your CRM`}>
        <div className="flex gap-2">
          <ExportButton data={exportCompanies} filename="companies" />
          <Link href="/companies/new"><Button><Plus size={16} />Add Company</Button></Link>
        </div>
      </PageHeader>

      <TableFilters
        searchPlaceholder="Search companies by name..."
        filterParamName="tier"
        filterPlaceholder="All Tiers"
        filterOptions={[
          { value: "enterprise", label: "Enterprise" },
          { value: "mid_market", label: "Mid Market" },
          { value: "smb", label: "SMB" },
        ]}
      />

      {!companies.length ? (
        isFiltered ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search query or tier filters.</p>
          </div>
        ) : (
          <EmptyState icon={Building2} title="No companies yet" description="Add your first B2B client to get started." />
        )
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  {[
                    { label: "Company", key: "name", width: "w-[30%]" },
                    { label: "Industry", key: "industry", width: "w-[20%]" },
                    { label: "Country", key: "country", width: "w-[15%]" },
                    { label: "Tier", key: "tier", width: "w-[15%]" },
                    { label: "Revenue", key: "annual_revenue", width: "w-[15%]" },
                  ].map((col) => {
                    const isSorted = sort === col.key;
                    const nextOrder = isSorted && order === "asc" ? "desc" : "asc";
                    
                    const nextParams = new URLSearchParams();
                    if (q) nextParams.set("q", q);
                    if (tier) nextParams.set("tier", tier);
                    nextParams.set("page", "1");
                    if (limit) nextParams.set("limit", limit.toString());
                    nextParams.set("sort", col.key);
                    nextParams.set("order", nextOrder);

                    return (
                      <th key={col.key} className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide text-left ${col.width}`}>
                        <Link
                          href={`/companies?${nextParams.toString()}`}
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
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0 text-xs font-bold">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          {c.website && <p className="text-xs text-gray-400 flex items-center gap-1"><Globe size={10} />{c.website}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.industry}</td>
                    <td className="py-3 px-4 text-gray-600">{c.country}</td>
                    <td className="py-3 px-4"><TierBadge tier={c.tier} /></td>
                    <td className="py-3 px-4 font-medium text-gray-900">{c.annual_revenue ? formatCurrency(c.annual_revenue) : "—"}</td>
                    <td className="py-3 px-4"><Link href={`/companies/${c.id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">View →</Link></td>
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
