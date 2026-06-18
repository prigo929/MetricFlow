"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, PackageX, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * NotificationsBell
 * A working notifications dropdown that surfaces the same proactive sales-intelligence
 * signals the dashboard uses: customers flagged at churn risk (v_churn_risk) and products
 * running low on stock. The unread dot reflects the real total; clicking opens a panel with
 * links to the relevant pages. Data is fetched once via the browser Supabase client.
 */

interface ChurnAlert {
  company_id: string;
  company_name: string;
  risk_factor: number;
}

interface StockAlert {
  id: string;
  name: string;
  stock_qty: number;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [churn, setChurn] = useState<ChurnAlert[]>([]);
  const [lowStock, setLowStock] = useState<StockAlert[]>([]);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      // At-risk customers (degrades gracefully if the analytics view isn't deployed).
      const { data: churnData } = await supabase
        .from("v_churn_risk")
        .select("company_id, company_name, risk_factor")
        .eq("is_at_risk", true)
        .order("risk_factor", { ascending: false })
        .limit(5);

      // Low-stock active products.
      const { data: stockData } = await supabase
        .from("products")
        .select("id, name, stock_qty")
        .eq("is_active", true)
        .lt("stock_qty", 10)
        .order("stock_qty", { ascending: true })
        .limit(5);

      setChurn((churnData as ChurnAlert[]) ?? []);
      setLowStock((stockData as StockAlert[]) ?? []);
      setLoaded(true);
    })();
  }, []);

  const total = churn.length + lowStock.length;
  const hasAlerts = total > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {hasAlerts && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full">
            {total}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {!loaded ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>
              ) : !hasAlerts ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">You're all caught up 🎉</p>
              ) : (
                <>
                  {churn.map((c) => (
                    <Link
                      key={`churn-${c.company_id}`}
                      href="/analytics?tab=customers"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.company_name}</p>
                        <p className="text-xs text-gray-500">
                          At churn risk — {c.risk_factor}× usual gap since last order
                        </p>
                      </div>
                    </Link>
                  ))}

                  {lowStock.map((p) => (
                    <Link
                      key={`stock-${p.id}`}
                      href="/products"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <PackageX size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Low stock — {p.stock_qty} units left</p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
