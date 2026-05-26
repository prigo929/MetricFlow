import { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "../components/ProductForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export const metadata: Metadata = { title: "New Product" };
export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Product" subtitle="Add a new product to the catalog">
        <Link href="/products"><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <ProductForm />
    </div>
  );
}
