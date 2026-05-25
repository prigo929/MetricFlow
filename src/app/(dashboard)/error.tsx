"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-5">
          <AlertOctagon size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          An unexpected error occurred in this dashboard view. Our team has been notified.
        </p>
        {error.message && (
          <div className="mb-6 p-3 bg-red-50/50 border border-red-100 rounded-lg text-left">
            <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => reset()}
            className="flex-1 text-sm py-2.5"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/dashboard"}
            className="flex-1 text-sm py-2.5"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
