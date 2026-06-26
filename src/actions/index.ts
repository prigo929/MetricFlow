"use server";

/**
 * CE ESTE "use server"?
 * Directiva de sus îi spune Next.js că FIECARE funcție exportată din acest fișier
 * este un "Server Action". Next.js le compilează în endpoint-uri HTTP POST securizate.
 * Le poți apela direct din componentele client (ex. formulare) folosind funcții
 * JavaScript obișnuite, iar ele se execută în siguranță pe server.
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
 * Clientul Supabase de server, complet tipizat, dedus din createClient.
 * Pentru că poartă schema Database generată, fiecare apel .from(...),
 * .insert(...), .select(...) și .rpc(...) este verificat de tipuri cap-coadă:
 * numele coloanelor, valorile enum și forma rândurilor sunt verificate la compilare.
 */
type DbClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Normalizează flatten().fieldErrors de la Zod (cu valori string[] | undefined)
 * în forma Record<string, string[]> așteptată de ActionResult.
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
 * Gardă comună pentru fiecare Server Action de modificare care primește input.
 * Impune, într-un singur loc, cei trei pași documentați în lucrare pentru fiecare mutație:
 * 1. VALIDARE: parsează datele cu Zod, returnând erori pe câmpuri la eșec.
 * 2. AUTENTIFICARE: cere un utilizator autentificat (apărare în adâncime peste RLS).
 * 3. EXECUȚIE: predă datele validate + clientul autentificat apelantului.
 * Centralizarea elimină codul repetitiv care exista anterior în
 * fiecare acțiune create/update și garantează un contract de erori consecvent.
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
 * Aceeași gardă de autentificare, pentru acțiuni fără corp validat
 * (ștergeri și schimbări de status care primesc doar un id / enum).
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
// 🏢 Server Actions pentru Companii
// ============================================================================

/**
 * Creează o companie nouă în baza de date.
 */
export async function createCompany(formData: unknown): Promise<ActionResult<Company>> {
  return withValidatedAuth(companySchema, formData, async (data, supabase, userId) => {
    const { data: row, error } = await supabase
      .from("companies")
      .insert({ ...data, created_by: userId })
      .select()
      .single();

    if (error || !row) return { success: false, error: error?.message ?? "Insert failed" };

    // Invalidează cache-ul pentru /companies ca noul rând să apară imediat.
    revalidatePath("/companies");
    return { success: true, data: row, message: "Company created" };
  });
}

/**
 * Actualizează o companie existentă.
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
 * Șterge o companie după ID.
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
// 📞 Server Actions pentru Contacte
// ============================================================================

/**
 * Creează o persoană de contact (ex. detalii angajat).
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
    // Invalidează și pagina companiei-părinte ca să afișeze noul contact.
    revalidatePath(`/companies/${data.company_id}`);
    return { success: true, data: row };
  });
}

/**
 * Actualizează un contact.
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
 * Șterge un contact.
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
// 📦 Server Actions pentru Produse
// ============================================================================

/**
 * Creează un produs nou în catalog.
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
 * Actualizează detaliile și stocul produsului.
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
 * Șterge un produs.
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
// 🛒 Server Actions pentru Comenzi
// ============================================================================

/**
 * Creează o comandă împreună cu liniile ei.
 *
 * SIGURANȚA STOCULUI (două verificări pe server):
 * 1. O pre-verificare prietenoasă reinterogă stock_qty curent, ca în cazul comun să returneze
 * un mesaj clar pe produs ("3 disponibile, 5 cerute") fără a atinge scrierea.
 * 2. Scrierea efectivă trece prin RPC-ul create_order_atomic, care, într-o singură
 * tranzacție, inserează antetul, inserează fiecare linie și DECREMENTEAZĂ stocul printr-un
 * UPDATE protejat, cu blocare de rând. Acesta e stratul autoritativ, sigur la concurență: serializează
 * comenzile concurente pentru același produs și anulează tot dacă stocul se epuizează,
 * deci nu există overselling și niciun antet de comandă orfan.
 */
export async function createOrder(formData: unknown): Promise<ActionResult<Order>> {
  return withValidatedAuth(orderSchema, formData, async (data, supabase) => {
    const { items, ...orderData } = data;

    // 1. Agregă cantitatea cerută pe produs (un produs poate apărea pe mai multe linii).
    const requestedByProduct = new Map<string, number>();
    for (const item of items) {
      requestedByProduct.set(
        item.product_id,
        (requestedByProduct.get(item.product_id) ?? 0) + item.quantity
      );
    }

    // 2. Pre-verificare prietenoasă (UX): afișează un mesaj precis înainte de scriere.
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

    // 3. Scriere atomică: antet + linii + decrementare de stoc protejată, într-o singură tranzacție.
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
 * Actualizează statusul de livrare/procesare al comenzii.
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
 * Șterge o comandă.
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
// 👤 Server Actions pentru Utilizatori
// ============================================================================

/**
 * Actualizează rolul (privilegiul) unui utilizator în baza de date.
 * Apelează o funcție RPC PostgreSQL (SECURITY DEFINER) care verifică ea însăși că apelantul
 * este admin înainte de a aplica schimbarea (vezi migrarea 002).
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
