/**
 * database.ts — TypeScript types for MetricFlow's Supabase schema.
 * In production, generate with: npx supabase gen types typescript --local
 * Hand-authored here for thesis clarity and offline development.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole        = "admin" | "sales_rep" | "viewer";
export type OrderStatus     = "draft" | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type CompanyTier     = "enterprise" | "mid_market" | "smb";
export type ProductCategory = "software" | "hardware" | "services" | "consulting" | "support";

// ─── Row types ────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string; email: string; full_name: string; role: UserRole;
  avatar_url: string | null; created_at: string; updated_at: string;
}
export interface Company {
  id: string; name: string; industry: string; country: string; city: string | null;
  tier: CompanyTier; annual_revenue: number | null; employee_count: number | null;
  website: string | null; notes: string | null; created_by: string;
  created_at: string; updated_at: string;
}
export interface Contact {
  id: string; company_id: string; full_name: string; email: string;
  phone: string | null; job_title: string | null; is_primary: boolean;
  created_at: string; updated_at: string;
}
export interface Product {
  id: string; name: string; sku: string; category: ProductCategory;
  description: string | null; unit_price: number; stock_qty: number;
  is_active: boolean; created_at: string; updated_at: string;
}
export interface Order {
  id: string; order_number: string; company_id: string; assigned_to: string;
  status: OrderStatus; total_amount: number; order_date: string;
  expected_delivery: string | null; notes: string | null;
  created_at: string; updated_at: string;
}
export interface OrderItem {
  id: string; order_id: string; product_id: string;
  quantity: number; unit_price: number; line_total: number;
}

// ─── Insert types ─────────────────────────────────────────────────────────────
export type CompanyInsert = Omit<Company, "id" | "created_at" | "updated_at">;
export type ContactInsert = Omit<Contact, "id" | "created_at" | "updated_at">;
export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type OrderInsert   = Omit<Order, "id" | "order_number" | "total_amount" | "created_at" | "updated_at">;
export type OrderItemInsert = Omit<OrderItem, "id" | "line_total">;

// ─── Update types ─────────────────────────────────────────────────────────────
export type CompanyUpdate  = Partial<CompanyInsert>;
export type ProductUpdate  = Partial<ProductInsert>;
export type OrderUpdate    = Partial<OrderInsert> & { total_amount?: number };

// ─── Joined types (for UI) ────────────────────────────────────────────────────
export interface OrderWithCompany extends Order {
  company: Pick<Company, "id" | "name" | "tier">;
  assigned_user: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
}
export interface OrderWithItems extends Order {
  company: Pick<Company, "id" | "name">;
  order_items: (OrderItem & { product: Pick<Product, "id" | "name" | "sku" | "category"> })[];
}

// ─── Analytics types ──────────────────────────────────────────────────────────
export interface RevenueByMonth  { month: string; revenue: number; order_count: number; }
export interface TopCustomer     { company_id: string; company_name: string; total_revenue: number; order_count: number; avg_order_value: number; tier: CompanyTier; }
export interface ProductPerf     { product_id: string; product_name: string; category: ProductCategory; units_sold: number; revenue: number; }
export interface SalesByRep      { user_id: string; full_name: string; total_revenue: number; order_count: number; avg_order_value: number; }

// ─── Supabase Database wrapper ────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      user_profiles: { Row: UserProfile; Insert: Omit<UserProfile, "created_at" | "updated_at">; Update: Partial<Omit<UserProfile, "id" | "created_at">>; };
      companies:     { Row: Company;     Insert: CompanyInsert; Update: CompanyUpdate; };
      contacts:      { Row: Contact;     Insert: ContactInsert; Update: Partial<ContactInsert>; };
      products:      { Row: Product;     Insert: ProductInsert; Update: ProductUpdate; };
      orders:        { Row: Order;       Insert: OrderInsert;   Update: OrderUpdate; };
      order_items:   { Row: OrderItem;   Insert: OrderItemInsert; Update: Partial<OrderItemInsert>; };
    };
    Views: {
      v_revenue_by_month:    { Row: RevenueByMonth };
      v_top_customers:       { Row: TopCustomer };
      v_product_performance: { Row: ProductPerf };
      v_sales_by_rep:        { Row: SalesByRep };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole; order_status: OrderStatus;
      company_tier: CompanyTier; product_category: ProductCategory;
    };
  };
};
