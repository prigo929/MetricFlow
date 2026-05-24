/**
 * Common utility types used across the app.
 */

// Server Action return type — consistent shape for all mutations
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter/sort
export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

// Generic select option (used in dropdowns)
export interface SelectOption {
  value: string;
  label: string;
}

// Date range filter
export interface DateRange {
  from: Date;
  to: Date;
}
