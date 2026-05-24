"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/common";
import type { Product } from "@/types/database";

export async function createProduct(formData: unknown): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("products").insert(parsed.data).select().single() as { data: Product | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/products");
  return { success: true, data };
}

export async function updateProduct(id: string, formData: unknown): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("products").update(parsed.data).eq("id", id).select().single() as { data: Product | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/products");
  return { success: true, data };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/products");
  return { success: true, data: undefined };
}
