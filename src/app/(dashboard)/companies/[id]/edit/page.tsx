import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Company } from "@/types/database";

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("companies").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const company = data as Company;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Company" subtitle={company.name}>
        <Link href={`/companies/${params.id}`}><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <CompanyForm company={company} />
    </div>
  );
}
