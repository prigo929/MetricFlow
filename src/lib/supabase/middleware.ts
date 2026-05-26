import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * WHAT IS THIS HELPER?
 * This function intercepts requests, verifies if the user is authenticated by querying 
 * Supabase Auth, refreshes cookie keys in response headers, and redirects pages if needed.
 *
 * WHY DO WE VERIFY SESSION HERE?
 * Single Page Apps often cache layouts. Executing a verification trigger on the routing middleware level
 * guarantees that whenever a page transitions, we verify active credentials securely.
 */
export async function updateSession(request: NextRequest) {
  // `NextResponse.next` passes control to the next route loader in the Next.js cycle
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY). Skipping session check.");
      return supabaseResponse;
    }

    // Initialize Server Client inside middleware, syncing cookies between request and response headers.
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            // Read cookies sent from the user's browser in this request
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Write modified cookies back to Next.js request headers
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Re-instantiate the response so NextJS registers cookie updates
            supabaseResponse = NextResponse.next({ request });
            // Write cookies to response headers so they get saved back to the browser
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh active session securely:
    // `auth.getUser()` does a secure token verification check against the Supabase backend database,
    // refreshing user access tokens under-the-hood if expired.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Define public routes that unauthenticated guest users are allowed to access
    const publicRoutes = ["/login", "/register", "/auth/callback"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // ACCESS CONTROL RULE 1:
    // If user is NOT signed in, and is trying to access a protected page (like /dashboard),
    // redirect them to `/login` and set a `redirectTo` URL param so we return them here after signing in.
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // ACCESS CONTROL RULE 2:
    // If user IS already signed in, prevent them from accessing guest auth forms (like login or register),
    // and redirect them back to the active `/dashboard`.
    if (user && isPublicRoute && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware invocation error in updateSession:", error);
  }

  return supabaseResponse;
}

