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
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, Building2, Globe } from "lucide-react";
import type { Company } from "@/types/database";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string };
}) {
  const supabase = await createClient();
  
  const q = searchParams.q || "";
  const tier = searchParams.tier || "";

  let query = (supabase as any).from("companies").select("*");
  
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (tier) {
    query = query.eq("tier", tier);
  }

  const { data } = await query.order("created_at", { ascending: false });
  const companies = (data ?? []) as Company[];
  const isFiltered = !!(q || tier);

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${companies.length} companies in your CRM`}>
        <div className="flex gap-2">
          <ExportButton data={companies} filename="companies" />
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
                <tr className="border-b border-gray-100">
                  {["Company", "Industry", "Country", "Tier", "Revenue", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
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
        </Card>
      )}
    </div>
  );
}
