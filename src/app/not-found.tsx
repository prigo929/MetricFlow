import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mx-auto mb-5">
          <FileQuestion size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Check the URL or click below to return home.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex justify-center items-center py-2.5 px-5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors text-sm w-full"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
