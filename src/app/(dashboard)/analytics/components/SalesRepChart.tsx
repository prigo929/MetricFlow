"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import type { SalesByRep } from "@/types/database";

interface Props { data: SalesByRep[] }

export function SalesRepChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    name: d.full_name.split(" ")[0],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} width={42}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value: unknown) => [`€${(value as number).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="total_revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
