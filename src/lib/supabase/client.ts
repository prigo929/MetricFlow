import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

/**
 * WHAT IS THIS FILE?
 * This file sets up the Supabase Client that runs directly inside the USER'S WEB BROWSER (the client-side).
 * 
 * WHEN DO WE USE IT?
 * You should use this client ONLY in "Client Components" (files that start with the "use client" directive at the top).
 * If you need to make database requests in Server Components (default Next.js pages) or Server Actions, 
 * use the Server client helper (`src/lib/supabase/server.ts`) instead.
 * 
 * WHY IS THIS DISTINCTION IMPORTANT?
 * Server components execute on the server (secure environment), whereas client components execute in the browser.
 * Keeping them separate prevents database secrets from being leaked to the browser.
 */
export function createClient() {
  // `createBrowserClient` initializes a client instance that automatically handles cookies
  // to keep the user signed in across page refreshes.
  //
  // `<Database>` is a TypeScript Generic. It passes our database schema structure to the client 
  // so that when we query tables (e.g., supabase.from('companies')), TypeScript knows exactly 
  // which columns are available, their data types, and autocomplete options.
  return createBrowserClient<Database>(
    // `process.env` is an object representing environment variables defined in `.env.local`.
    // The `!` exclamation mark at the end is the "non-null assertion operator".
    // It tells TypeScript: "Trust me, I guarantee these environment variables will be defined at runtime."
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

