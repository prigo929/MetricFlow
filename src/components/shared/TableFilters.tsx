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

/**
 * REUSABLE TABLE FILTER PANEL:
 * This component renders a search text input and an optional dropdown selector.
 * 
 * WHY USE THE URL FOR SEARCH STATE?
 * Instead of keeping search values in a transient React `useState`, we sync them directly
 * to URL search parameters (like `?q=Acme&tier=enterprise`).
 * This pattern ensures that:
 * 1. Page refreshes don't wipe out the user's active filter state.
 * 2. Users can copy/paste and share links with filters intact.
 * 3. Browser Back/Forward navigation triggers filter history state naturally.
 */
export function TableFilters({
  searchPlaceholder,
  filterParamName,
  filterOptions,
  filterPlaceholder,
}: Props) {
  const router = useRouter(); // Triggers page transitions
  const pathname = usePathname(); // Retrieves the current path (e.g. "/companies")
  const searchParams = useSearchParams(); // Reads active URL queries (e.g. "?q=test")

  // Local state to keep the input text typing responsive before writing to the URL
  const [search, setSearch] = useState(searchParams.get("q") || "");

  /**
   * WHAT IS DEBOUNCING?
   * If we updated the URL query on every keypress, Next.js would trigger a new server-side database
   * fetch for every single character typed (e.g. typing "Apple" triggers 5 queries).
   * 
   * Debouncing delays the URL write until the user has stopped typing for a specific window (300ms here).
   */
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Create a mutable copy of the current URL search parameters
      const params = new URLSearchParams(searchParams.toString());
      
      if (search) {
        params.set("q", search);
      } else {
        params.delete("q"); // Remove query key if search bar is empty
      }
      
      // RESET PAGINATION:
      // If we are on page 5 and search for "Acme", the new results might only have 1 page total.
      // Leaving page=5 would render an empty screen. We force it back to page 1.
      params.delete("page"); 
      
      // Push the updated search query string to the browser URL, triggering Server Component re-renders
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    // CLEANUP FUNCTION:
    // If the user types another letter before the 300ms timeout completes, React runs this cleanup,
    // which clears the previous timer and starts a brand new 300ms countdown.
    return () => clearTimeout(delayDebounce);
  }, [search, pathname, router, searchParams]);

  // Handler for dropdown selection updates
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(filterParamName!, value);
    } else {
      params.delete(filterParamName!);
    }
    
    params.delete("page"); // Reset pagination on filter change
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

