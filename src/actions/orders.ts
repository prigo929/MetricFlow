"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validations/schemas";
import type { ActionResult } from "@/types/common";
import type { Order, OrderStatus } from "@/types/database";

export async function createOrder(formData: unknown): Promise<ActionResult<Order>> {
  const parsed = orderSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { items, ...orderData } = parsed.data;

  const { data: order, error: orderErr } = await (supabase as any)
    .from("orders").insert(orderData).select().single() as { data: Order | null; error: any };

  if (orderErr || !order) return { success: false, error: orderErr?.message ?? "Order creation failed" };

  const itemRows = items.map((item) => ({
    order_id: order.id, product_id: item.product_id,
    quantity: item.quantity, unit_price: item.unit_price,
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
    .from("orders").update({ status }).eq("id", id).select().single() as { data: Order | null; error: any };

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
