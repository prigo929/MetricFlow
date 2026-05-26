import { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyForm } from "../components/CompanyForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New Company" };

export default function NewCompanyPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Company" subtitle="Create a new B2B client record">
        <Link href="/companies"><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <CompanyForm />
    </div>
  );
}
