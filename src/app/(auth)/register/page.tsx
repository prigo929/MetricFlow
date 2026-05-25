import { Metadata } from "next";
import RegisterForm from "./RegisterForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
      <p className="text-gray-500 text-sm mb-6">Join MetricFlow — it&apos;s free to get started</p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
      </p>
    </>
  );
}
