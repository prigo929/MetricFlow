/**
 * typed-client.ts
 * Provides typed query helpers that work around Supabase's generic inference
 * in hand-authored (non-generated) type definitions.
 *
 * Pattern: use the `as unknown as T` cast on `.data` to preserve
 * end-to-end type safety while avoiding the `never` propagation issue.
 */
import type {
  Company, Contact, Product, Order, OrderItem,
  UserProfile, RevenueByMonth, TopCustomer, ProductPerf, SalesByRep,
} from "@/types/database";

// These are type-only helpers — used for explicit casting in server actions & pages
export type { Company, Contact, Product, Order, OrderItem, UserProfile };
export type { RevenueByMonth, TopCustomer, ProductPerf, SalesByRep };
