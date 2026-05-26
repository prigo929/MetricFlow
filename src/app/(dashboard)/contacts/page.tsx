import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportButton } from "@/components/shared/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Plus, Users } from "lucide-react";
import type { Contact, Company } from "@/types";

export const metadata: Metadata = { title: "Contacts" };

type ContactRow = Contact & { company: Pick<Company, "name"> | null };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("contacts").select("*, company:companies(name)").order("full_name");
  const contacts = (data ?? []) as ContactRow[];

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${contacts.length} contacts across all companies`}>
        <div className="flex gap-2">
          <ExportButton data={contacts} filename="contacts" />
          <Link href="/contacts/new"><Button><Plus size={16} />Add Contact</Button></Link>
        </div>
      </PageHeader>

      {!contacts.length ? (
        <EmptyState icon={Users} title="No contacts yet"
          description="Add contacts linked to your companies."
          action={<Link href="/contacts/new"><Button size="sm"><Plus size={14} />Add Contact</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => {
            const initials = c.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.job_title ?? "—"}</p>
                  </div>
                  {c.is_primary && <Badge variant="default" className="ml-auto flex-shrink-0">Primary</Badge>}
                </div>
                <Link href={`/companies/${c.company_id}`} className="text-xs text-brand-600 font-medium block mb-2 hover:underline">
                  {c.company?.name}
                </Link>
                <div className="space-y-1">
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 truncate">
                    <Mail size={11} />{c.email}
                  </a>
                  {c.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone size={11} />{c.phone}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
