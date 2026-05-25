"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function TimeRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get("range") || "12M";

  const ranges = [
    { value: "7D", label: "7 Days" },
    { value: "30D", label: "30 Days" },
    { value: "12M", label: "12 Months" },
    { value: "All", label: "All Time" },
  ];

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      {ranges.map((r) => {
        const isActive = currentRange === r.value;
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => handleRangeChange(r.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isActive
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
