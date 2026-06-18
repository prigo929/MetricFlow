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
 * Creates an order together with its line items.
 *
 * STOCK SAFETY (two server-side checks):
 *   1. A friendly pre-check re-queries the live `stock_qty` so the common case returns a
 *      clear, per-product message ("3 available, 5 requested") without touching the writer.
 *   2. The actual write goes through the `create_order_atomic` RPC, which — inside a single
 *      transaction — inserts the header, inserts each line, and DECREMENTS stock with a
 *      guarded, row-locking UPDATE. That is the authoritative, race-safe layer: it serialises
 *      concurrent orders for the same product and rolls everything back if stock runs out,
 *      so there is no overselling and never an orphan order header.
 */
export async function createOrder(formData: unknown): Promise<ActionResult<Order>> {
  return withValidatedAuth(orderSchema, formData, async (data, supabase) => {
    const { items, ...orderData } = data;

    // 1. Aggregate the requested quantity per product (a product may appear on several lines).
    const requestedByProduct = new Map<string, number>();
    for (const item of items) {
      requestedByProduct.set(
        item.product_id,
        (requestedByProduct.get(item.product_id) ?? 0) + item.quantity
      );
    }

    // 2. Friendly pre-check (best-effort UX): surface a precise message before the write.
    const { data: stockRows, error: stockErr } = await supabase
      .from("products")
      .select("id, name, stock_qty")
      .in("id", Array.from(requestedByProduct.keys()));

    if (stockErr) return { success: false, error: stockErr.message };

    const stockById = new Map(stockRows?.map((p) => [p.id, p]) ?? []);
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

    // 3. Atomic write: header + line items + guarded stock decrement, all in one transaction.
    const { data: order, error } = await supabase.rpc("create_order_atomic", {
      p_company_id: orderData.company_id,
      p_assigned_to: orderData.assigned_to,
      p_status: orderData.status,
      p_order_date: orderData.order_date,
      p_expected_delivery: orderData.expected_delivery ?? null,
      p_notes: orderData.notes ?? null,
      p_items: items,
    });

    if (error || !order) {
      return { success: false, error: error?.message ?? "Order creation failed" };
    }

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
