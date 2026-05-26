"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  companySchema,
  contactSchema,
  productSchema,
  orderSchema,
} from "@/lib/validations/schemas";
import type { ActionResult } from "@/types";
import type { Company, Contact, Product, Order, OrderStatus } from "@/types";

// ============================================================================
// 🏢 Companies Server Actions
// ============================================================================

export async function createCompany(formData: unknown): Promise<ActionResult<Company>> {
  const parsed = companySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

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
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single() as { data: Company | null; error: any };

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

// ============================================================================
// 📞 Contacts Server Actions
// ============================================================================

export async function createContact(formData: unknown): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("contacts")
    .insert(parsed.data)
    .select()
    .single() as { data: Contact | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/contacts");
  revalidatePath(`/companies/${parsed.data.company_id}`);
  return { success: true, data };
}

export async function updateContact(id: string, formData: unknown): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("contacts")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single() as { data: Contact | null; error: any };

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

// ============================================================================
// 📦 Products Server Actions
// ============================================================================

export async function createProduct(formData: unknown): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("products")
    .insert(parsed.data)
    .select()
    .single() as { data: Product | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Failed" };
  revalidatePath("/products");
  return { success: true, data };
}

export async function updateProduct(id: string, formData: unknown): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single() as { data: Product | null; error: any };

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

// ============================================================================
// 🛒 Orders Server Actions
// ============================================================================

export async function createOrder(formData: unknown): Promise<ActionResult<Order>> {
  const parsed = orderSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { items, ...orderData } = parsed.data;

  const { data: order, error: orderErr } = await (supabase as any)
    .from("orders")
    .insert(orderData)
    .select()
    .single() as { data: Order | null; error: any };

  if (orderErr || !order) return { success: false, error: orderErr?.message ?? "Order creation failed" };

  const itemRows = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsErr } = await (supabase as any).from("order_items").insert(itemRows);
  if (itemsErr) return { success: false, error: itemsErr.message };

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, data: order, message: "Order created" };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ActionResult<Order>> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single() as { data: Order | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Update failed" };
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("orders").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/orders");
  return { success: true, data: undefined };
}

// ============================================================================
// 👤 Users Server Actions
// ============================================================================

export async function updateUserRole(targetUserId: string, newRole: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await (supabase as any).rpc("update_user_role", {
    target_user_id: targetUserId,
    new_role: newRole as any,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true, data: undefined };
}
