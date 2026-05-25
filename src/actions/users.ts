"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/common";

/**
 * Server Action: Update a user's permission role.
 * Securely calls the database-level security definer RPC function.
 */
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
