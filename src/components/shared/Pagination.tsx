"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

/**
 * REUSABLE PAGINATION CONTROL BAR:
 * Renders next/prev page buttons, individual page links, and a rows-per-page limit dropdown.
 * 
 * Like our filters, this control keeps pagination state in the URL (`?page=2&limit=10`) 
 * so that table slicing can be executed efficiently on the server side via database range queries.
 */
export function Pagination({ currentPage, totalPages, pageSize, totalItems }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Updates the "page" query in the URL when a user clicks a page link
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Triggered when the user changes rows-per-page (e.g. from 10 to 50 rows)
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", value);
    params.set("page", "1"); // RESET TO PAGE 1: changing limit changes total page divisions.
    router.push(`${pathname}?${params.toString()}`);
  };

  // If there is only 1 page of data, hide the pagination bar entirely
  if (totalPages <= 1) return null;

  /**
   * SLIDING WINDOW PAGE CALCULATOR:
   * If a dataset has 100 pages, we don't want to render 100 buttons on the screen.
   * This helper computes a subset array of up to 5 visible page numbers centered around `currentPage`.
   * For example, if currentPage is 5, it returns `[3, 4, 5, 6, 7]`.
   */
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // INDEX MATHEMATICS:
  // Calculate the first and last item index currently displayed on screen.
  // Example: Page 2 with size 10 starts at item index 11.
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-gray-100 mt-4 text-sm text-gray-500 bg-white rounded-b-xl">
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
          <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span> entries
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="whitespace-nowrap text-xs text-gray-400">Show</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handleLimitChange}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex items-center gap-1 text-xs"
        >
          <ChevronLeft size={14} /> Prev
        </Button>

        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0 text-xs font-semibold"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex items-center gap-1 text-xs"
        >
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

