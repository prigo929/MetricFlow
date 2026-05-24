"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  draft:       "#e5e7eb",
  pending:     "#fde68a",
  confirmed:   "#93c5fd",
  processing:  "#c4b5fd",
  shipped:     "#a5b4fc",
  delivered:   "#6ee7b7",
  cancelled:   "#fca5a5",
};

interface Props { data: { name: string; value: number }[] }

export function OrderStatusChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#d1d5db"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
