export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_sales_by_rep"
            referencedColumns: ["user_id"]
          },
        ]
      }
      companies: {
        Row: {
          annual_revenue: number | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          employee_count: number | null
          id: string
          industry: string
          name: string
          notes: string | null
          tier: Database["public"]["Enums"]["company_tier"]
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          id?: string
          industry: string
          name: string
          notes?: string | null
          tier?: Database["public"]["Enums"]["company_tier"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          id?: string
          industry?: string
          name?: string
          notes?: string | null
          tier?: Database["public"]["Enums"]["company_tier"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_sales_by_rep"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_churn_risk"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_rfm_segments"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_top_customers"
            referencedColumns: ["company_id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total?: number | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_performance"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_velocity"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string
          company_id: string
          created_at: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          assigned_to: string
          company_id: string
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          company_id?: string
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_sales_by_rep"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_churn_risk"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_rfm_segments"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_top_customers"
            referencedColumns: ["company_id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sku: string
          stock_qty: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sku: string
          stock_qty?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string
          stock_qty?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_churn_risk: {
        Row: {
          avg_days_between: number | null
          company_id: string | null
          company_name: string | null
          days_since_last_order: number | null
          is_at_risk: boolean | null
          risk_factor: number | null
          tier: Database["public"]["Enums"]["company_tier"] | null
        }
        Relationships: []
      }
      v_product_performance: {
        Row: {
          category: Database["public"]["Enums"]["product_category"] | null
          product_id: string | null
          product_name: string | null
          revenue: number | null
          units_sold: number | null
        }
        Relationships: []
      }
      v_product_velocity: {
        Row: {
          avg_daily_velocity: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          days_to_stockout: number | null
          product_id: string | null
          product_name: string | null
          sku: string | null
          stock_qty: number | null
          units_sold_30d: number | null
        }
        Relationships: []
      }
      v_revenue_by_month: {
        Row: {
          month: string | null
          order_count: number | null
          revenue: number | null
        }
        Relationships: []
      }
      v_rfm_segments: {
        Row: {
          company_id: string | null
          company_name: string | null
          f_score: number | null
          frequency: number | null
          m_score: number | null
          monetary: number | null
          r_score: number | null
          recency: number | null
          rfm_code: string | null
          rfm_segment: string | null
          tier: Database["public"]["Enums"]["company_tier"] | null
        }
        Relationships: []
      }
      v_sales_by_rep: {
        Row: {
          avg_order_value: number | null
          full_name: string | null
          order_count: number | null
          total_revenue: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_top_customers: {
        Row: {
          avg_order_value: number | null
          company_id: string | null
          company_name: string | null
          order_count: number | null
          tier: Database["public"]["Enums"]["company_tier"] | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      company_tier: "enterprise" | "mid_market" | "smb"
      order_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_category:
        | "software"
        | "hardware"
        | "services"
        | "consulting"
        | "support"
      user_role: "admin" | "sales_rep" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      company_tier: ["enterprise", "mid_market", "smb"],
      order_status: [
        "draft",
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_category: [
        "software",
        "hardware",
        "services",
        "consulting",
        "support",
      ],
      user_role: ["admin", "sales_rep", "viewer"],
    },
  },
} as const

// ─── Custom UI type helpers (merged from database.ts) ────────────────────────

/**
 * WHAT IS A MAPPED TYPE?
 * `NonNullableFields<T>` is a custom TypeScript utility type. It loops through all keys `K`
 * of a given type `T` and strips out `null` and `undefined` markers using `NonNullable<T[K]>`.
 *
 * WHY DO WE NEED IT?
 * Our Supabase Views (like analytical views) have columns marked as potentially `null` because 
 * of outer joins. However, in our UI we know they are computed and always present. This type
 * saves us from writing `data.revenue!` or `data.revenue ?? 0` everywhere in chart components.
 */
type NonNullableFields<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

// --- Enums ---
// Extract union string literal types directly from our Postgres enum definitions.
// Example: UserRole becomes exactly "admin" | "sales_rep" | "viewer".
export type UserRole        = Database["public"]["Enums"]["user_role"];
export type OrderStatus     = Database["public"]["Enums"]["order_status"];
export type CompanyTier     = Database["public"]["Enums"]["company_tier"];
export type ProductCategory = Database["public"]["Enums"]["product_category"];

// --- Row Types ---
// Row types represent the shape of a record when we fetch (SELECT) it from the database tables.
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Company     = Database["public"]["Tables"]["companies"]["Row"];
export type Contact     = Database["public"]["Tables"]["contacts"]["Row"];
export type Product     = Database["public"]["Tables"]["products"]["Row"];
export type Order       = Database["public"]["Tables"]["orders"]["Row"];

// WHAT IS Omit<T, K>?
// `Omit` is a built-in TypeScript utility that creates a new type by taking all properties
// of `T` and removing the specified keys `K`.
//
// Here, we take the default generated `order_items` Row type, remove the `line_total` field 
// (which is nullable in database schemas because it's a generated virtual column), and force it 
// to be a strict non-nullable `number` so our calculations don't throw type errors.
export type OrderItem   = Omit<Database["public"]["Tables"]["order_items"]["Row"], "line_total"> & { line_total: number };

// --- Insert Types ---
// Insert types represent the fields required/allowed when creating (INSERT) a new record.
// Fields with default values (like `id` or `created_at`) are automatically marked as optional.
export type CompanyInsert   = Database["public"]["Tables"]["companies"]["Insert"];
export type ContactInsert   = Database["public"]["Tables"]["contacts"]["Insert"];
export type ProductInsert   = Database["public"]["Tables"]["products"]["Insert"];
export type OrderInsert     = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

// --- Update Types ---
// Update types represent the fields we can modify (UPDATE) on an existing record.
// All fields are marked as optional, so we can send only the columns that changed.
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type OrderUpdate   = Database["public"]["Tables"]["orders"]["Update"];

// --- Joined Types (for UI components) ---
// When we query Supabase using joins (e.g., fetching an order and its associated company name),
// the return type is a combination of the base Order row and nesting related records.

/**
 * WHAT IS Pick<T, K>?
 * `Pick` creates a new type by selecting only the set of keys `K` from type `T`.
 *
 * Here, `OrderWithCompany` represents an Order record that also includes a nested `company` object
 * containing only the company's `id`, `name`, and `tier`, plus the user profile of the assigned rep.
 */
export interface OrderWithCompany extends Order {
  company: Pick<Company, "id" | "name" | "tier">;
  assigned_user: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
}

export interface OrderWithItems extends Order {
  company: Pick<Company, "id" | "name">;
  // An array of order items where each item also includes its related product's core details
  order_items: (OrderItem & { product: Pick<Product, "id" | "name" | "sku" | "category"> })[];
}

// --- Analytics Types (Derived from Views) ---
export type RevenueByMonth  = NonNullableFields<Database["public"]["Views"]["v_revenue_by_month"]["Row"]>;
export type TopCustomer     = NonNullableFields<Database["public"]["Views"]["v_top_customers"]["Row"]>;
export type ProductPerf     = NonNullableFields<Database["public"]["Views"]["v_product_performance"]["Row"]>;
export type SalesByRep      = NonNullableFields<Database["public"]["Views"]["v_sales_by_rep"]["Row"]>;

// ─── Common utility types (merged from common.ts) ──────────────────────────

/**
 * ActionResult is a TypeScript Generic interface (`<T>`). It enforces a consistent return
 * format for all our Server Actions (mutations), making frontend response handling standardized.
 *
 * If success is true: it returns the database record of type `T` (e.g. Company).
 * If success is false: it returns an error message and optional field-level validation errors.
 */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Standard pagination parameters requested by tables
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Standard paginated wrapper return shape containing row subset metadata
export interface PaginatedResult<T> {
  data: T[]; // The subset array of records for the active page
  total: number; // The total matching records in the entire database table
  page: number;
  pageSize: number;
  totalPages: number; // Computed count of total pages: ceil(total / pageSize)
}

// Configuration for active column sorting
export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

// Standard utility for rendering options in select elements
export interface SelectOption {
  value: string;
  label: string;
}

// Date boundaries for dashboard search filters
export interface DateRange {
  from: Date;
  to: Date;
}
