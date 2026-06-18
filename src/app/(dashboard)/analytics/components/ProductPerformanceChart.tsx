"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import type { ProductPerf } from "@/types";

interface Props { data: ProductPerf[] }

export function ProductPerformanceChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    name: d.product_name.length > 18 ? d.product_name.slice(0, 18) + "…" : d.product_name,
  }));

  // Reserve a vertical slot per product so every label is rendered. Recharts otherwise
  // auto-thins category ticks (showing every other one) when they don't fit the height.
  const chartHeight = Math.max(220, formatted.length * 34);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category" dataKey="name"
          interval={0}
          tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={120}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value: unknown) => [`€${(value as number).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill="#27996f" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
