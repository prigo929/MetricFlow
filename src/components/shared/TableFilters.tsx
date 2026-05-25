"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface Props {
  searchPlaceholder: string;
  filterParamName?: string;
  filterOptions?: Option[];
  filterPlaceholder?: string;
}

export function TableFilters({
  searchPlaceholder,
  filterParamName,
  filterOptions,
  filterPlaceholder,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, pathname, router, searchParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(filterParamName!, value);
    } else {
      params.delete(filterParamName!);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedFilterValue = filterParamName ? searchParams.get(filterParamName) || "" : "";

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      <div className="w-full sm:flex-grow">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {filterParamName && filterOptions && (
        <div className="w-full sm:w-64">
          <Select
            value={selectedFilterValue}
            onChange={handleFilterChange}
            options={filterOptions}
            placeholder={filterPlaceholder || "All"}
          />
        </div>
      )}
    </div>
  );
}
