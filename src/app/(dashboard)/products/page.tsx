import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, Package } from "lucide-react";
import type { Product } from "@/types/database";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data } = await (supabase as any).from("products").select("*").order("name");
  const products = (data ?? []) as Product[];

  const lowStockProducts = products.filter((p) => p.is_active && p.stock_qty < 10);

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle={`${products.length} products`}>
        <Link href="/products/new"><Button><Plus size={16} />Add Product</Button></Link>
      </PageHeader>

      {lowStockProducts.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2.5 shadow-sm">
          <span className="text-base mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold">Low Stock Alert</p>
            <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
              The following active products have less than 10 units remaining in stock:{" "}
              {lowStockProducts.map((p, idx) => (
                <span key={p.id} className="font-semibold">
                  {p.name} ({p.stock_qty} left){idx < lowStockProducts.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {!products.length ? (
        <EmptyState icon={Package} title="No products yet" description="Add products to your catalog." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Package size={18} />
                </div>
                <Badge variant={p.is_active ? "success" : "muted"}>{p.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{p.name}</p>
              <p className="text-xs text-gray-400 font-mono mb-2">{p.sku}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-600">{formatCurrency(p.unit_price)}</span>
                <span className={`text-xs ${p.stock_qty < 10 && p.is_active ? "text-red-600 bg-red-50 font-bold px-2 py-0.5 rounded-md" : "text-gray-500"}`}>
                  Stock: {p.stock_qty}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-t-gray-100">
                <Link href={`/products/${p.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
