"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton({ data, filename }: { data: any[]; filename: string }) {
  const handleExport = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).filter((k) => !["id", "company_id", "assigned_to"].includes(k));
    
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val && typeof val === "object") {
          const innerVal = val.name || val.full_name || JSON.stringify(val);
          return JSON.stringify(innerVal);
        }
        return JSON.stringify(val ?? "");
      }).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download size={15} /> Export CSV
    </Button>
  );
}
