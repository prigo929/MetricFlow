import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, Building2, Globe } from "lucide-react";
import type { Company } from "@/types/database";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("companies").select("*").order("created_at", { ascending: false });
  const companies = (data ?? []) as Company[];

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${companies.length} companies in your CRM`}>
        <Link href="/companies/new"><Button><Plus size={16} />Add Company</Button></Link>
      </PageHeader>

      {!companies.length ? (
        <EmptyState icon={Building2} title="No companies yet" description="Add your first B2B client to get started." />
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
