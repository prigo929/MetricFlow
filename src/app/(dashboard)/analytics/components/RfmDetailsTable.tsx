"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TierBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

interface RfmCompany {
  company_id: string;
  company_name: string;
  tier: string;
  recency: number;
  frequency: number;
  monetary: number;
  r_score: number;
  f_score: number;
  m_score: number;
  rfm_code: string;
  rfm_segment: string;
}

interface Props {
  data: RfmCompany[];
}

export function RfmDetailsTable({ data }: Props) {
  // Extract all unique segments that have at least one company
  const segments = ["All", "Champions", "Loyal Customers", "Promising", "New Customers", "At Risk", "About to Sleep", "Lost / Hibernating"];
  const [selectedSegment, setSelectedSegment] = useState("All");

  const filteredData = selectedSegment === "All"
    ? data
    : data.filter((c) => c.rfm_segment === selectedSegment);

  const getSegmentCount = (seg: string) => {
    if (seg === "All") return data.length;
    return data.filter((c) => c.rfm_segment === seg).length;
  };

  const getSegmentColor = (seg: string) => {
    switch (seg) {
      case "Champions":
        return "bg-green-500 text-white";
      case "Loyal Customers":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Promising":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "New Customers":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "At Risk":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "About to Sleep":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "Lost / Hibernating":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Segment Selector Tags */}
      <div className="flex flex-wrap gap-2 pb-2">
        {segments.map((seg) => {
          const count = getSegmentCount(seg);
          const active = selectedSegment === seg;
          return (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
                active
                  ? "bg-brand-500 text-white border-brand-500 ring-2 ring-brand-500 ring-offset-1"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{seg}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                active ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Companies List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Company", "Tier", "Segment", "Recency", "Frequency", "Monetary", "RFM Score", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!filteredData.length ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-gray-400 italic">
                    No customers classified in this segment.
                  </td>
                </tr>
              ) : (
                filteredData.map((c) => (
                  <tr key={c.company_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <Link href={`/companies/${c.company_id}`} className="hover:text-brand-600">
                        {c.company_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4"><TierBadge tier={c.tier as any} /></td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold ${getSegmentColor(c.rfm_segment)}`}>
                        {c.rfm_segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {c.recency} {c.recency === 1 ? "day ago" : "days ago"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {c.frequency} {c.frequency === 1 ? "order" : "orders"}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 text-xs">
                      {formatCurrency(c.monetary)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {c.rfm_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/companies/${c.company_id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
