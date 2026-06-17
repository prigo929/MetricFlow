"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * CLIENT-SIDE CSV EXPORTER COMPONENT
 *
 * Takes an array of JavaScript objects (rows returned by Supabase, possibly carrying
 * nested relational data) and turns them into an RFC 4180 CSV file downloaded entirely
 * in the browser — no backend call, no external library.
 *
 * RELATIONAL FLATTENING (thesis §3.5.3):
 * Supabase rows can embed nested objects (e.g. `company: { name }`) and child collections
 * (e.g. `order_items: [...]`). A flat CSV cannot hold those directly. The algorithm below:
 *   1. extracts the parent's scalar fields, resolving nested objects to a display value;
 *   2. expands each row of a child collection into its OWN CSV row, repeating the parent's
 *      fields on every line (a classic one-to-many → flat-table projection);
 *   3. serialises everything with proper RFC 4180 quoting so commas, quotes and newlines
 *      inside values never break the column layout.
 */

// Internal identifier columns that carry no meaning for a business reader.
const EXCLUDED_KEYS = new Set([
  "id",
  "company_id",
  "assigned_to",
  "order_id",
  "product_id",
  "created_by",
]);

type Row = Record<string, unknown>;

/** Resolves any value to a single human-readable cell string. */
function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Nested relation (e.g. company / product / assigned_user) → pick a label field.
    return String(obj.name ?? obj.full_name ?? JSON.stringify(value));
  }
  return String(value);
}

/** Wraps a cell per RFC 4180: surround with quotes and double any embedded quotes. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Parent scalar fields (skip identifiers and child arrays). */
function scalarFields(row: Row): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (EXCLUDED_KEYS.has(key) || Array.isArray(value)) continue;
    out[key] = displayValue(value);
  }
  return out;
}

/** Returns the name of the first non-empty child-collection field, if any. */
function childCollectionKey(row: Row): string | null {
  for (const [key, value] of Object.entries(row)) {
    if (Array.isArray(value) && value.length > 0) return key;
  }
  return null;
}

/** Projects the dataset into flat CSV rows, expanding one-to-many children. */
function flattenRows(data: Row[]): Record<string, string>[] {
  const flat: Record<string, string>[] = [];

  for (const row of data) {
    const parent = scalarFields(row);
    const arrayKey = childCollectionKey(row);

    if (!arrayKey) {
      flat.push(parent);
      continue;
    }

    // Expand: one output row per child, repeating the parent's columns.
    for (const child of row[arrayKey] as Row[]) {
      const childCols: Record<string, string> = {};
      for (const [key, value] of Object.entries(child)) {
        if (EXCLUDED_KEYS.has(key)) continue;
        childCols[`item_${key}`] = displayValue(value);
      }
      flat.push({ ...parent, ...childCols });
    }
  }

  return flat;
}

export function ExportButton({ data, filename }: { data: Row[]; filename: string }) {
  const handleExport = () => {
    if (!data.length) return;

    const flatRows = flattenRows(data);
    if (!flatRows.length) return;

    // Header = union of all keys, preserving first-seen order (parent cols, then item_ cols).
    const headers: string[] = [];
    const seen = new Set<string>();
    for (const row of flatRows) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      }
    }

    const lines = [
      headers.map(csvCell).join(","),
      ...flatRows.map((row) => headers.map((h) => csvCell(row[h] ?? "")).join(",")),
    ];
    // RFC 4180 mandates CRLF line breaks between records.
    const csv = lines.join("\r\n");

    // Materialise the CSV as an in-memory Blob and trigger a download via a temporary URL.
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    // Free the object URL immediately so the browser can reclaim the heap memory (W3C File API).
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download size={15} /> Export CSV
    </Button>
  );
}
