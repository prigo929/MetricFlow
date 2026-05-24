import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users, Mail, Phone } from "lucide-react";
import type { Contact, Company } from "@/types/database";

export const metadata: Metadata = { title: "Contacts" };

type ContactWithCompany = Contact & { company: Pick<Company, "name"> | null };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("contacts").select("*, company:companies(name)").order("full_name");
  const contacts = (data ?? []) as ContactWithCompany[];

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${contacts.length} contacts`} />
      {!contacts.length ? (
        <EmptyState icon={Users} title="No contacts yet" description="Contacts are linked to companies. Add a company first." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => {
            const initials = c.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initials}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.job_title ?? "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-brand-600 font-medium mb-2">{c.company?.name}</p>
                <div className="space-y-1">
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 truncate"><Mail size={11} />{c.email}</a>
                  {c.phone && <p className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} />{c.phone}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
