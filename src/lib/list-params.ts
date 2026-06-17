/**
 * Shared helpers for server-rendered list pages (companies, orders, …).
 *
 * Every list page reads the same family of URL query parameters — search term, page,
 * page size, sort column and sort direction — and derives the same pagination range and
 * sortable-header links from them. Centralising that logic here removes the copy-pasted
 * (and easy-to-get-subtly-wrong) parsing + offset math that previously lived in each page.
 */

export type SortOrder = "asc" | "desc";

export interface ListParams {
  q: string;
  page: number;
  limit: number;
  sort: string;
  order: SortOrder;
  /** Inclusive lower bound for Supabase `.range(from, to)` (0-indexed). */
  from: number;
  /** Inclusive upper bound for Supabase `.range(from, to)`. */
  to: number;
}

/** Raw `searchParams` as Next.js hands them to a page (all values are strings or absent). */
export type RawSearchParams = Record<string, string | undefined>;

/**
 * Parses the common list query parameters, applying sensible defaults and computing the
 * pagination range. `defaults.sort` is required because each entity sorts by a different
 * default column (e.g. companies by `created_at`, orders by `order_date`).
 */
export function parseListParams(
  searchParams: RawSearchParams,
  defaults: { sort: string; order?: SortOrder; limit?: number }
): ListParams {
  const fallbackLimit = defaults.limit ?? 10;

  // `|| value` guards against NaN from a malformed ?page= / ?limit= value.
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const limit = parseInt(searchParams.limit || String(fallbackLimit), 10) || fallbackLimit;

  const sort = searchParams.sort || defaults.sort;
  const order: SortOrder =
    searchParams.order === "asc" || searchParams.order === "desc"
      ? searchParams.order
      : defaults.order ?? "desc";

  // range(from, to) in Supabase is inclusive: page 1 / limit 10 → 0..9, page 2 → 10..19.
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { q: searchParams.q || "", page, limit, sort, order, from, to };
}

/**
 * Builds the href for a sortable column header. Clicking a column sorts by it ascending;
 * clicking the already-active ascending column flips it to descending. All other active
 * query parameters (search term, secondary filters, page size) are preserved, and the page
 * is reset to 1 because the result ordering changed.
 */
export function buildSortHref(
  basePath: string,
  current: RawSearchParams,
  columnKey: string,
  sort: string,
  order: SortOrder
): string {
  const nextOrder: SortOrder = sort === columnKey && order === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value && key !== "sort" && key !== "order" && key !== "page") {
      params.set(key, value);
    }
  }
  params.set("page", "1");
  params.set("sort", columnKey);
  params.set("order", nextOrder);

  return `${basePath}?${params.toString()}`;
}
