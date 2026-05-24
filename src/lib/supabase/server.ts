import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client.
 * Use this in:
 *  - Server Components (async components)
 *  - Server Actions ("use server" functions)
 *  - Route Handlers (app/api/*)
 *
 * Reads the session cookie automatically from Next.js headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — cookie mutation is expected to fail here.
            // Middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}
