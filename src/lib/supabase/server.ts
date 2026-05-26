import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types";

/**
 * WHAT IS THIS FILE?
 * This file creates the Supabase client that runs strictly on the BACKEND SERVER.
 *
 * WHEN DO WE USE IT?
 * Use this in Server Components (async functions representing pages by default),
 * Server Actions ("use server" endpoints that mutate data), and Route Handlers (API routes).
 *
 * WHY IS THIS SAFE?
 * Because it executes only on the server, you can securely access the database here.
 * It automatically reads session cookies from Next.js request headers to authenticate queries
 * based on the logged-in user.
 */
export async function createClient() {
  // `cookies()` is an asynchronous Next.js helper that gives us access to HTTP request headers.
  // We use `await` because reading cookies is an asynchronous operation.
  const cookieStore = await cookies();

  // Create a server client with the generated TypeScript `Database` schema definition.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // `getAll` returns all cookies from the incoming browser request headers,
        // allowing Supabase to determine if the user is authenticated.
        getAll() {
          return cookieStore.getAll();
        },
        // `setAll` writes cookies back to the user's browser.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // WHY DO WE CATCH ERRORS HERE?
            // Next.js Server Components are read-only when rendering pages (headers are already sent).
            // Attempting to set cookies directly inside a rendering Server Component will throw an error.
            // We ignore (catch) the error here because our middleware (`src/middleware.ts`) 
            // runs before page rendering and takes care of refreshing sessions/updating cookies.
          }
        },
      },
    }
  );
}

