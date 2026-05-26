import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * WHAT IS A NEXT.JS MIDDLEWARE?
 * Middleware is a file that runs on the Next.js routing edge BEFORE a request is completed.
 * Think of it as a security guard at the gate: it intercepts every page navigation or API call,
 * inspects cookies/session tokens, and decides whether to let the request through, redirect, 
 * or modify request headers.
 */
export async function middleware(request: NextRequest) {
  // Delegate session refresh and path redirects to our Supabase helper.
  return await updateSession(request);
}

/**
 * WHAT IS Config Matcher?
 * The matcher configuration tells Next.js which paths should trigger the middleware.
 * We want the middleware to check authentication on dashboard routes, but bypass it
 * for static files, image optimizations, and public assets (like icons, CSS, and images)
 * to maintain high performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (Webpack compiled CSS/JS static bundles)
     * - _next/image (Next.js server-side image optimizations)
     * - favicon.ico, sitemap.xml, robots.txt (search engine crawling files)
     * - Public assets in the `/public` root folder (logos, svgs, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

