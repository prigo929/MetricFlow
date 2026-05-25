import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  format?: "currency" | "number" | "percent" | "raw";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function KpiCard({ title, value, change, format = "raw", icon, description, className }: KpiCardProps) {
  const displayValue =
    format === "currency" && typeof value === "number"
      ? formatCurrency(value)
      : format === "percent" && typeof value === "number"
      ? `${value.toFixed(1)}%`
      : String(value);

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 mb-1">{displayValue}</p>
            {description && <p className="text-xs text-gray-400">{description}</p>}
            {change !== undefined && (
              <div className={cn(
                "inline-flex items-center gap-1 mt-2 text-xs font-medium px-1.5 py-0.5 rounded-md",
                isPositive ? "text-green-700 bg-green-50" :
                isNegative ? "text-red-700 bg-red-50" :
                "text-gray-500 bg-gray-100"
              )}>
                {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
                {formatPercent(change)} vs last period
              </div>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
