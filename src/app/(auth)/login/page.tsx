import { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage({ searchParams }: { searchParams: { redirectTo?: string; error?: string } }) {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-gray-500 text-sm mb-6">Sign in to your MetricFlow account</p>
      {searchParams.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {searchParams.error}
        </div>
      )}
      <LoginForm redirectTo={searchParams.redirectTo} />
      <p className="mt-4 text-center text-xs text-gray-400">
        Demo: <span className="font-mono">admin@metricflow.com</span> / <span className="font-mono">metricflow2024</span>
      </p>
      <p className="mt-3 text-center text-sm text-gray-500">
        No account?{" "}
        <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">Create one free</Link>
      </p>
    </>
  );
}
