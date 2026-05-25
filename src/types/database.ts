import { Database as DatabaseGenerated } from "./supabase";

export type Database = DatabaseGenerated;

// Helper to strip nullability/optionality from generated view row fields
type NonNullableFields<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole        = DatabaseGenerated["public"]["Enums"]["user_role"];
export type OrderStatus     = DatabaseGenerated["public"]["Enums"]["order_status"];
export type CompanyTier     = DatabaseGenerated["public"]["Enums"]["company_tier"];
export type ProductCategory = DatabaseGenerated["public"]["Enums"]["product_category"];

// ─── Row types ────────────────────────────────────────────────────────────────
export type UserProfile = DatabaseGenerated["public"]["Tables"]["user_profiles"]["Row"];
export type Company     = DatabaseGenerated["public"]["Tables"]["companies"]["Row"];
export type Contact     = DatabaseGenerated["public"]["Tables"]["contacts"]["Row"];
export type Product     = DatabaseGenerated["public"]["Tables"]["products"]["Row"];
export type Order       = DatabaseGenerated["public"]["Tables"]["orders"]["Row"];

// Make line_total strictly number since it's a generated column that is always computed in practice
export type OrderItem   = Omit<DatabaseGenerated["public"]["Tables"]["order_items"]["Row"], "line_total"> & { line_total: number };

// ─── Insert types ─────────────────────────────────────────────────────────────
export type CompanyInsert   = DatabaseGenerated["public"]["Tables"]["companies"]["Insert"];
export type ContactInsert   = DatabaseGenerated["public"]["Tables"]["contacts"]["Insert"];
export type ProductInsert   = DatabaseGenerated["public"]["Tables"]["products"]["Insert"];
export type OrderInsert     = DatabaseGenerated["public"]["Tables"]["orders"]["Insert"];
export type OrderItemInsert = DatabaseGenerated["public"]["Tables"]["order_items"]["Insert"];

// ─── Update types ─────────────────────────────────────────────────────────────
export type CompanyUpdate = DatabaseGenerated["public"]["Tables"]["companies"]["Update"];
export type ProductUpdate = DatabaseGenerated["public"]["Tables"]["products"]["Update"];
export type OrderUpdate   = DatabaseGenerated["public"]["Tables"]["orders"]["Update"];

// ─── Joined types (for UI) ────────────────────────────────────────────────────
export interface OrderWithCompany extends Order {
  company: Pick<Company, "id" | "name" | "tier">;
  assigned_user: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
}
export interface OrderWithItems extends Order {
  company: Pick<Company, "id" | "name">;
  order_items: (OrderItem & { product: Pick<Product, "id" | "name" | "sku" | "category"> })[];
}

// ─── Analytics types (Views) ──────────────────────────────────────────────────
export type RevenueByMonth  = NonNullableFields<DatabaseGenerated["public"]["Views"]["v_revenue_by_month"]["Row"]>;
export type TopCustomer     = NonNullableFields<DatabaseGenerated["public"]["Views"]["v_top_customers"]["Row"]>;
export type ProductPerf     = NonNullableFields<DatabaseGenerated["public"]["Views"]["v_product_performance"]["Row"]>;
export type SalesByRep      = NonNullableFields<DatabaseGenerated["public"]["Views"]["v_sales_by_rep"]["Row"]>;
