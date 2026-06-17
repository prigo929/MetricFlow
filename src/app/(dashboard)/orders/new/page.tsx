import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { OrderForm } from "../components/OrderForm";
import { ArrowLeft } from "lucide-react";
import type { Company, Product, UserProfile } from "@/types";

export const metadata: Metadata = { title: "New Order" };

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: companies }, { data: products }, { data: users }] = await Promise.all([
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("products").select("id, name, sku, unit_price, stock_qty").eq("is_active", true).order("name"),
    supabase.from("user_profiles").select("id, full_name"),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Order" subtitle="Create a new B2B order">
        <Link href="/orders"><Button variant="outline"><ArrowLeft size={16} />Back</Button></Link>
      </PageHeader>
      <OrderForm
        companies={(companies ?? []) as Pick<Company, "id" | "name">[]}
        products={(products ?? []) as Pick<Product, "id" | "name" | "sku" | "unit_price" | "stock_qty">[]}
        users={(users ?? []) as Pick<UserProfile, "id" | "full_name">[]}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
