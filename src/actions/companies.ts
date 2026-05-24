"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { companySchema } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/common";
import type { Company } from "@/types/database";

export async function createCompany(formData: unknown): Promise<ActionResult<Company>> {
  const parsed = companySchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await (supabase as any)
    .from("companies")
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single() as { data: Company | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  revalidatePath("/companies");
  return { success: true, data, message: "Company created" };
}

export async function updateCompany(id: string, formData: unknown): Promise<ActionResult<Company>> {
  const parsed = companySchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("companies").update(parsed.data).eq("id", id).select().single() as { data: Company | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Update failed" };
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { success: true, data };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("companies").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/companies");
  return { success: true, data: undefined };
}
