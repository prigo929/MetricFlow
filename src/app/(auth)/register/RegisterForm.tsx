"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/schemas";
import type { z } from "zod";

type FormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.full_name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  };

  const fields = [
    { name: "full_name" as const,       label: "Full Name",       type: "text",     placeholder: "Ion Popescu" },
    { name: "email" as const,           label: "Email",           type: "email",    placeholder: "ion@company.ro" },
    { name: "password" as const,        label: "Password",        type: "password", placeholder: "Min. 8 characters" },
    { name: "confirmPassword" as const, label: "Confirm Password",type: "password", placeholder: "Repeat password" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map(({ name, label, type, placeholder }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input {...register(name)} type={type} placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]?.message}</p>}
        </div>
      ))}
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 text-sm">
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
