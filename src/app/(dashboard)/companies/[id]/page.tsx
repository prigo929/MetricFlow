import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/StatusBadge";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Globe, Users, Mail, Phone } from "lucide-react";
import type { Company, Contact, Order } from "@/types";

export const metadata: Metadata = { title: "Company Detail" };

/**
 * Company Detail Page (Dynamic Router Segment)
 * 
 * Concept: Dynamic Routes
 * The folder `[id]` defines a dynamic route segment. Next.js extracts whatever value is in
 * the URL (e.g. `/companies/abc-123`) and passes it in the `params` prop as `{ id: "abc-123" }`.
 */
export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  // Initialize server cookies Supabase client
  const supabase = await createClient();

  // Performance Pattern: Concurrent Server Fetches
  // Instead of waiting for companies query, then waiting for contacts query, then waiting for orders query
  // sequentially (causing a "waterfall" latency block), we use Promise.all to dispatch all three
  // queries to Postgres simultaneously.
  const [{ data: co }, { data: contacts }, { data: orders }] = await Promise.all([
    // Get the specific company details
    supabase.from("companies").select("*").eq("id", params.id).single(),
    // Fetch all contacts linked to this company sorted alphabetically by name
    supabase.from("contacts").select("*").eq("company_id", params.id).order("full_name"),
    // Fetch the 10 most recent orders for this company
    supabase.from("orders").select("*").eq("company_id", params.id).order("order_date", { ascending: false }).limit(10),
  ]);

  // If no company record matches the ID, render the default Next.js 404 page
  if (!co) notFound();
  
  // Cast raw database items into structured TypeScript types
  const company    = co       as Company;
  const contactList = (contacts ?? []) as Contact[];
  const orderList   = (orders  ?? []) as Order[];
  
  // Aggregate revenue in memory for this company:
  // 1. Filter out unpaid/non-finalized orders (e.g., drafts and cancellations).
  // 2. Sum the remaining totals using reduce() starting with a base accumulator value of 0.
  const totalRevenue = orderList
    .filter(o => !["draft", "cancelled"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="max-w-5xl">
      <PageHeader title={company.name} subtitle={`${company.industry} · ${company.country}`}>
        <Link href={`/companies/${params.id}/edit`}>
          <Button variant="outline" size="sm">Edit</Button>
        </Link>
        <Link href="/companies">
          <Button variant="outline"><ArrowLeft size={15} />Back</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Info card */}
        <Card className="col-span-2">
          <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Tier",           <TierBadge key="tier" tier={company.tier} />],
              ["Industry",       company.industry],
              ["Country",        company.country],
              ["City",           company.city ?? "—"],
              ["Annual Revenue", company.annual_revenue ? formatCurrency(company.annual_revenue) : "—"],
              ["Employees",      company.employee_count?.toLocaleString() ?? "—"],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <div className="font-medium text-gray-900">{value}</div>
              </div>
            ))}
            {company.website && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Website</p>
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                  <Globe size={13} />{company.website}
                </a>
              </div>
            )}
            {company.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                <p className="text-gray-600">{company.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue summary */}
        <Card>
          <CardHeader><CardTitle>Revenue Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Revenue</p>
              <p className="text-2xl font-bold text-brand-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{orderList.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Contacts</p>
              <p className="text-xl font-bold text-gray-900">{contactList.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users size={15} />Contacts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!contactList.length ? (
            <p className="text-sm text-gray-400">No contacts yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {contactList.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.job_title ?? "—"}</p>
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-brand-600 truncate">
                      <Mail size={10} />{c.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Order #", "Date", "Status", "Total"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderList.length ? orderList.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link href={`/orders/${o.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(o.order_date)}</td>
                  <td className="py-3 px-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(o.total_amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-6 px-4 text-center text-sm text-gray-400">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
