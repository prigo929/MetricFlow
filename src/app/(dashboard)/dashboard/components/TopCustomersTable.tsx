import { formatCurrency } from "@/lib/utils/formatting";
import { TierBadge } from "@/components/shared/StatusBadge";

interface Customer {
  company_name: string;
  tier: string;
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
}

export function TopCustomersTable({ data }: { data: Customer[] }) {
  if (!data.length) return <p className="text-sm text-gray-400 p-5">No data yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
          <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Tier</th>
          <th className="text-right py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Orders</th>
          <th className="text-right py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</th>
          <th className="text-right py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">AOV</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c, i) => (
          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="py-3 px-5 font-medium text-gray-900">{c.company_name}</td>
            <td className="py-3 px-5"><TierBadge tier={c.tier} /></td>
            <td className="py-3 px-5 text-right text-gray-600">{c.order_count}</td>
            <td className="py-3 px-5 text-right font-semibold text-gray-900">{formatCurrency(c.total_revenue)}</td>
            <td className="py-3 px-5 text-right text-gray-600">{formatCurrency(c.avg_order_value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
