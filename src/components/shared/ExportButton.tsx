"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * CLIENT-SIDE CSV EXPORTER COMPONENT:
 * This component takes an array of JavaScript objects, flattens relational fields,
 * converts the dataset into a comma-separated values (CSV) string, and triggers
 * an automatic file download in the user's browser without calling backend APIs.
 */
export function ExportButton({ data, filename }: { data: any[]; filename: string }) {
  const handleExport = () => {
    // If the table is currently empty, cancel export
    if (!data.length) return;
    
    // 1. EXTRACT HEADERS: Get the property names (keys) of the first object.
    // We filter out internal database columns (like UUIDs) that are irrelevant to B2B managers.
    const headers = Object.keys(data[0]).filter((k) => !["id", "company_id", "assigned_to"].includes(k));
    
    // 2. CONVERT OBJECTS TO CSV ROWS:
    // We map over each row object, extract values for each header, and format them.
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        
        // WHAT IS RELATIONAL FLATTENING?
        // Relational databases fetch joined objects (e.g. `company: { name: 'Acme Corp' }`).
        // If we write `row[h]` directly into the CSV cell, it would render as stringified JSON.
        // We detect objects and pull clean display attributes (like name or full_name) instead.
        if (val && typeof val === "object") {
          const innerVal = val.name || val.full_name || JSON.stringify(val);
          return JSON.stringify(innerVal);
        }
        
        // `JSON.stringify` automatically wraps text cell values in quotes, preventing
        // comma characters inside note text from breaking the CSV column alignment.
        return JSON.stringify(val ?? "");
      }).join(",")
    );

    // 3. GENERATE CSV STRING: Combine headers line and row lines separated by line breaks.
    const csv = [headers.join(","), ...rows].join("\n");
    
    // 4. TRIGGER BROWSER DOWNLOAD:
    // - `Blob` (Binary Large Object) represents our CSV text formatted as a raw file asset.
    const blob = new Blob([csv], { type: "text/csv" });
    
    // - `createObjectURL` generates a temporary virtual link pointing to the blob in browser memory.
    const url = URL.createObjectURL(blob);
    
    // - We create a virtual anchor (`<a>`) tag in memory, set its href to our virtual blob URL,
    //   give it a filename containing today's date, and trigger a click() event to start the download.
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    // - Immediately free up the browser's memory allocation once the download starts.
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download size={15} /> Export CSV
    </Button>
  );
}

