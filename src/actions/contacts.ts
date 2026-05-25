"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/common";
import type { Contact } from "@/types/database";

export async function createContact(formData: unknown): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data, error } = await (supabase as any).from("contacts").insert(parsed.data).select().single() as { data: Contact | null; error: any };
  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/contacts");
  revalidatePath(`/companies/${parsed.data.company_id}`);
  return { success: true, data };
}

export async function updateContact(id: string, formData: unknown): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };
  const supabase = await createClient();
  const { data, error } = await (supabase as any).from("contacts").update(parsed.data).eq("id", id).select().single() as { data: Contact | null; error: any };
  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/contacts");
  return { success: true, data };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("contacts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/contacts");
  return { success: true, data: undefined };
}
