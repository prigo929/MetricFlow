"use server";

/**
 * WHAT IS "use server"?
 * The directive at the top tells Next.js that EVERY function exported from this file
 * is a "Server Action". Next.js compiles these functions into secure HTTP POST endpoints.
 * You can call these functions directly from your client components (like forms) using standard
 * JavaScript functions, and they will execute safely on the backend server.
 */

import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  companySchema,
  contactSchema,
  productSchema,
  orderSchema,
} from "@/lib/validations/schemas";
import type {
  ActionResult,
  Company,
  Contact,
  Product,
  Order,
  OrderStatus,
  UserRole,
} from "@/types";

/**
 * The fully typed Supabase server client, inferred from `createClient`.
 * Because the client carries the generated `Database` schema, every `.from(...)`,
 * `.insert(...)`, `.select(...)` and `.rpc(...)` call below is type-checked end-to-end —
 * column names, enum values and row shapes are all verified at compile time.
 */
type DbClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Normalises Zod's `flatten().fieldErrors` (whose values are `string[] | undefined`)
 * into the `Record<string, string[]>` shape expected by `ActionResult`.
 */
function toFieldErrors(
  fieldErrors: Record<string, string[] | undefined>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (value && value.length) out[key] = value;
  }
  return out;
}

/**
 * Shared guard for every *mutating* Server Action that accepts user input.
 * It enforces — in one place — the three steps the thesis documents for each mutation:
 *   1. VALIDATION  — parse the payload with Zod, returning per-field errors on failure.
 *   2. AUTH        — require an authenticated user (defence-in-depth on top of RLS).
 *   3. EXECUTION   — hand the validated data + authed client to the caller.
 * Centralising this removes the copy-pasted boilerplate that previously lived in
 * every create/update action and guarantees a consistent error contract.
 */
async function withValidatedAuth<TInput, TOut>(
  schema: ZodType<TInput>,
  formData: unknown,
  run: (data: TInput, supabase: DbClient, userId: string) => Promise<ActionResult<TOut>>
): Promise<ActionResult<TOut>> {
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  return run(parsed.data, supabase, user.id);
}

/**
 * Same authentication guard, for actions that take no validated body
 * (deletes and status transitions that receive only an id / enum).
 */
async function withAuth<TOut>(
  run: (supabase: DbClient, userId: string) => Promise<ActionResult<TOut>>
): Promise<ActionResult<TOut>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  return run(supabase, user.id);
}

// ============================================================================
// 🏢 Companies Server Actions
// ============================================================================

/**
 * Creates a new company in the database.
 */
export async function createCompany(formData: unknown): Promise<ActionResult<Company>> {
  return withValidatedAuth(companySchema, formData, async (data, supabase, userId) => {
    const { data: row, error } = await supabase
      .from("companies")
      .insert({ ...data, created_by: userId })
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Insert failed" };

    // Purge the cached render tree of /companies so the new row shows up immediately.
    revalidatePath("/companies");
    return { success: true, data: row, message: "Company created" };
  });
}

/**
 * Updates an existing company in the database.
 */
export async function updateCompany(id: string, formData: unknown): Promise<ActionResult<Company>> {
  return withValidatedAuth(companySchema, formData, async (data, supabase) => {
    const { data: row, error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Update failed" };

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    return { success: true, data: row };
  });
}

/**
 * Deletes a company by ID.
 */
export async function deleteCompany(id: string): Promise<ActionResult> {
  return withAuth(async (supabase) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/companies");
    return { success: true, data: undefined };
  });
}

// ============================================================================
// 📞 Contacts Server Actions
// ============================================================================

/**
 * Creates a new company contact (e.g. employee details).
 */
export async function createContact(formData: unknown): Promise<ActionResult<Contact>> {
  return withValidatedAuth(contactSchema, formData, async (data, supabase) => {
    const { data: row, error } = await supabase
      .from("contacts")
      .insert(data)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Failed" };

    revalidatePath("/contacts");
    // Also revalidate the parent company detail view so it lists this new contact.
    revalidatePath(`/companies/${data.company_id}`);
    return { success: true, data: row };
  });
}

/**
 * Updates a contact.
 */
export async function updateContact(id: string, formData: unknown): Promise<ActionResult<Contact>> {
  return withValidatedAuth(contactSchema, formData, async (data, supabase) => {
    const { data: row, error } = await supabase
      .from("contacts")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Failed" };

    revalidatePath("/contacts");
    return { success: true, data: row };
  });
}

/**
 * Deletes a contact.
 */
export async function deleteContact(id: string): Promise<ActionResult> {
  return withAuth(async (supabase) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/contacts");
    return { success: true, data: undefined };
  });
}

// ============================================================================
// 📦 Products Server Actions
// ============================================================================

/**
 * Creates a new product in the catalog.
 */
export async function createProduct(formData: unknown): Promise<ActionResult<Product>> {
  return withValidatedAuth(productSchema, formData, async (data, supabase) => {
    const { data: row, error } = await supabase
      .from("products")
      .insert(data)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Failed" };

    revalidatePath("/products");
    return { success: true, data: row };
  });
}

/**
 * Updates product details and stock status.
 */
export async function updateProduct(id: string, formData: unknown): Promise<ActionResult<Product>> {
  return withValidatedAuth(productSchema, formData, async (data, supabase) => {
    const { data: row, error } = await supabase
      .from("products")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Failed" };

    revalidatePath("/products");
    return { success: true, data: row };
  });
}

/**
 * Deletes a product.
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  return withAuth(async (supabase) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/products");
    return { success: true, data: undefined };
  });
}

// ============================================================================
// 🛒 Orders Server Actions
// ============================================================================

/**
 * Creates an order and its associated line items (order_items) in a multi-step flow.
 *
 * STOCK SAFETY (server-side, definitive layer):
 * Before any write, we re-query the live `stock_qty` of every product referenced by the
 * order straight from the database and reject the order if a requested quantity exceeds it.
 * This is the second of the two validation layers described in the thesis (§3.5.2): the
 * client-side check is a fast-fail UX optimisation, but the authoritative check happens here,
 * against the source of truth, closing the race-condition window where two reps could each
 * pass the client check and oversell the last units of a product.
 */
export async function createOrder(formData: unknown): Promise<ActionResult<Order>> {
  return withValidatedAuth(orderSchema, formData, async (data, supabase) => {
    // Separate the order header from its line items.
    const { items, ...orderData } = data;

    // 1. Aggregate the requested quantity per product (a product may appear on several lines).
    const requestedByProduct = new Map<string, number>();
    for (const item of items) {
      requestedByProduct.set(
        item.product_id,
        (requestedByProduct.get(item.product_id) ?? 0) + item.quantity
      );
    }

    // 2. Re-read the authoritative stock levels for exactly those products.
    const { data: stockRows, error: stockErr } = await supabase
      .from("products")
      .select("id, name, stock_qty")
      .in("id", Array.from(requestedByProduct.keys()));

    if (stockErr) return { success: false, error: stockErr.message };

    const stockById = new Map(stockRows?.map((p) => [p.id, p]) ?? []);

    // 3. Reject if any product is missing or short on stock.
    for (const [productId, requested] of Array.from(requestedByProduct.entries())) {
      const product = stockById.get(productId);
      if (!product) {
        return { success: false, error: "One of the selected products no longer exists." };
      }
      if (requested > product.stock_qty) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}": ${product.stock_qty} available, ${requested} requested.`,
        };
      }
    }

    // 4. Insert the order header record.
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderErr || !order) {
      return { success: false, error: orderErr?.message ?? "Order creation failed" };
    }

    // 5. Insert the line items, linking each one to the parent order via foreign key.
    const itemRows = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
    if (itemsErr) return { success: false, error: itemsErr.message };

    // Revalidate orders and the analytical dashboard.
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { success: true, data: order, message: "Order created" };
  });
}

/**
 * Updates order delivery/processing status.
 */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ActionResult<Order>> {
  return withAuth(async (supabase) => {
    const { data: row, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Update failed" };

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: row };
  });
}

/**
 * Deletes an order.
 */
export async function deleteOrder(id: string): Promise<ActionResult> {
  return withAuth(async (supabase) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/orders");
    return { success: true, data: undefined };
  });
}

// ============================================================================
// 👤 Users Server Actions
// ============================================================================

/**
 * Updates a user role privilege in the application database.
 * Invokes a PostgreSQL RPC function (SECURITY DEFINER) that itself verifies the caller
 * is an admin before applying the change — see migration 002.
 */
export async function updateUserRole(targetUserId: string, newRole: string): Promise<ActionResult> {
  return withAuth(async (supabase) => {
    const { error } = await supabase.rpc("update_user_role", {
      target_user_id: targetUserId,
      new_role: newRole as UserRole,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: undefined };
  });
}
