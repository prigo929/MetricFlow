import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductForm } from "../components/ProductForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/types";
export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("products").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const product = data as Product;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Product" subtitle={product.name}>
        <Link href="/products"><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <ProductForm product={product} />
    </div>
  );
}
