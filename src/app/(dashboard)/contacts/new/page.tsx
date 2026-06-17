import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactForm } from "../components/ContactForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Company } from "@/types";

export const metadata: Metadata = { title: "New Contact" };

export default async function NewContactPage({ searchParams }: { searchParams: { company_id?: string } }) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("id, name").order("name");
  const companies = (data ?? []) as Pick<Company, "id" | "name">[];
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Contact" subtitle="Add a contact linked to a company">
        <Link href="/contacts"><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <ContactForm companies={companies} defaultCompanyId={searchParams.company_id} />
    </div>
  );
}
