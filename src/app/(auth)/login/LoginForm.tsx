"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

type FormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }
    router.push(redirectTo || "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          {...register("email")}
          type="email"
          placeholder="you@company.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
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
