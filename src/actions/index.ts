"use server";

/**
 * WHAT IS "use server"?
 * The directive at the top tells Next.js that EVERY function exported from this file
 * is a "Server Action". Next.js compiles these functions into secure HTTP POST endpoints.
 * You can call these functions directly from your client components (like forms) using standard 
 * JavaScript functions, and they will execute safely on the backend server.
 */

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

/**
 * Creates a new company in the database.
 * @param formData - The form inputs containing name, tier, industry, etc.
 */
export async function createCompany(formData: unknown): Promise<ActionResult<Company>> {
  // 1. VALIDATION: Use Zod to verify inputs match rules (e.g. name is required, URL is formatted)
  // `safeParse` returns an object detailing success status instead of throwing errors.
  const parsed = companySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      // Flatten Zod's nested errors into a simple key-value structure of field errors
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 2. CONNECTION: Initialize the secure Server-side Supabase client
  const supabase = await createClient();
  
  // 3. AUTHENTICATION: Get current user metadata to audit who created this record
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 4. DATABASE ACTION: Insert row into table.
  const { data, error } = await (supabase as any)
    .from("companies")
    .insert({ ...parsed.data, created_by: user.id })
    .select() // Return the newly inserted row values
    .single() as { data: Company | null; error: any }; // Expect exactly one row response

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  
  // 5. CACHE REVALIDATION: Purge cached render trees of the `/companies` page
  // so the new company card displays immediately on redirect/refresh.
  revalidatePath("/companies");
  return { success: true, data, message: "Company created" };
}

/**
 * Updates an existing company in the database.
 * @param id - UUID of the company to update
 * @param formData - The updated form fields
 */
export async function updateCompany(id: string, formData: unknown): Promise<ActionResult<Company>> {
  const parsed = companySchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("companies")
    .update(parsed.data)
    .eq("id", id) // SQL WHERE clause: target only the matching primary key ID
    .select()
    .single() as { data: Company | null; error: any };

  if (error || !data) return { success: false, error: error?.message ?? "Update failed" };
  
  // Revalidate both the list and the individual details pages
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { success: true, data };
}

/**
 * Deletes a company by ID.
 */
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

/**
 * Creates a new company contact (e.g. employee details).
 */
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
  // Also revalidate the parent company detail view so it displays this contact in its list
  revalidatePath(`/companies/${parsed.data.company_id}`);
  return { success: true, data };
}

/**
 * Updates a contact.
 */
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

/**
 * Deletes a contact.
 */
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

/**
 * Creates a new product in the catalog.
 */
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

/**
 * Updates product details and stock status.
 */
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

/**
 * Deletes a product.
 */
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

/**
 * Creates an order and its associated line items (order_items) in a multi-step flow.
 */
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
  // Destructure: separate the main order information from the list of items
  const { items, ...orderData } = parsed.data;

  // 1. Insert main order header record
  const { data: order, error: orderErr } = await (supabase as any)
    .from("orders")
    .insert(orderData)
    .select()
    .single() as { data: Order | null; error: any };

  if (orderErr || !order) return { success: false, error: orderErr?.message ?? "Order creation failed" };

  // 2. Build order items row payload with foreign key references linking to the main order ID
  const itemRows = items.map((item) => ({
    order_id: order.id, // Link line items directly to the newly created parent Order row
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  // 3. Bulk insert line items
  const { error: itemsErr } = await (supabase as any).from("order_items").insert(itemRows);
  if (itemsErr) return { success: false, error: itemsErr.message };

  // Revalidate orders and analytical metrics charts on dashboard
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, data: order, message: "Order created" };
}

/**
 * Updates order delivery/processing status pill.
 */
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

/**
 * Deletes an order.
 */
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

/**
 * Updates a user role privilege in the application database.
 * Invokes a PostgreSQL RPC function to bypass row security guidelines safely.
 */
export async function updateUserRole(targetUserId: string, newRole: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Call the database function (RPC) `update_user_role` defined in supabase migrations.
  // We use RPC (Remote Procedure Call) because modifying user auth tables requires
  // security-definer privileges on the Postgres level.
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
