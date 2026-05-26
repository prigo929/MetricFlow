"use client";

/**
 * WHAT IS "use client"?
 * It tells Next.js that this component runs in the browser, allowing us to use
 * interactive client features like React hooks (`useState`, `useEffect`) and form submission events.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

// WHAT IS z.infer?
// Zod allows us to automatically derive a TypeScript type definition from our validation schema definition.
// This prevents us from manually typing `interface FormValues { email: string ... }`, keeping schemas and types in sync.
type FormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter(); // Next.js Client Router instance to navigate pages programmatically
  
  // Local state hook variables
  const [error, setError] = useState<string | null>(null); // Stores authentication error messages to render on screen
  const [loading, setLoading] = useState(false); // Disables inputs/buttons to prevent double submission during requests

  /**
   * REACT-HOOK-FORM:
   * A performance optimization library that manages input state without causing full component re-renders on every keystroke.
   * - `register`: Function to bind inputs to validation schemas.
   * - `handleSubmit`: High-order wrapper that validates form fields before executing the `onSubmit` callback.
   * - `errors`: Direct access to active validation warnings.
   */
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema), // Connects Zod validation schema rules directly to our form inputs
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    
    // 1. Initialize the browser-side Supabase Client
    const supabase = createClient();
    
    // 2. Perform the authentication request to Supabase Auth backend
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    
    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }
    
    // 3. If login succeeds, redirect the user back to where they were going (or dashboard),
    // and tell Next.js to refresh active server layout trees so headers sync (e.g. showing "Sign Out" instead of "Sign In").
    router.push(redirectTo || "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        {/* 
          WHAT IS `{...register("email")}`?
          The ES6 spread operator (`...`) expands the object returned by `register` (containing `onChange`, `onBlur`, etc.)
          into properties directly on the `<input>` element.
        */}
        <input
          {...register("email")}
          type="email"
          placeholder="you@company.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {/* Render error validation messages inline below input fields */}
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          {...register("password")}
          type="password"
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {/* Render generic authentication failure errors */}
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

