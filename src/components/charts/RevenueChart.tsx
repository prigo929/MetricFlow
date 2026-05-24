"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import type { RevenueByMonth } from "@/types/database";

interface Props { data: RevenueByMonth[] }

export function RevenueChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    month: new Date(d.month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#27996f" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#27996f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={45}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(value: unknown) => [`€${(value as number).toLocaleString()}`, "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#27996f" strokeWidth={2} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
