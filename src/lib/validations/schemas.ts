import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    full_name:       z.string().min(2, "Full name is required"),
    email:           z.string().email("Invalid email address"),
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match", path: ["confirmPassword"],
  });

// ─── Company ───────────────────────────────────────────────────────────────────

export const companySchema = z.object({
  name:           z.string().min(2, "Company name is required"),
  industry:       z.string().min(1, "Industry is required"),
  country:        z.string().min(1, "Country is required"),
  city:           z.string().optional(),
  tier:           z.enum(["enterprise", "mid_market", "smb"]),
  annual_revenue: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  employee_count: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes:   z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

// ─── Contact ───────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  company_id: z.string().uuid("Must be linked to a company"),
  full_name:  z.string().min(2, "Full name is required"),
  email:      z.string().email("Invalid email address"),
  phone:      z.string().optional(),
  job_title:  z.string().optional(),
  is_primary: z.boolean().default(false),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

// ─── Product ───────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name:        z.string().min(2, "Product name is required"),
  sku:         z.string().min(2, "SKU is required"),
  category:    z.enum(["software", "hardware", "services", "consulting", "support"]),
  description: z.string().optional(),
  unit_price:  z.coerce.number().positive("Price must be positive"),
  stock_qty:   z.coerce.number().int().min(0, "Stock cannot be negative"),
  is_active:   z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ─── Order ─────────────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  product_id: z.string().uuid("Select a product"),
  quantity:   z.coerce.number().int().positive("Quantity must be at least 1"),
  unit_price: z.coerce.number().positive("Price must be positive"),
});

export const orderSchema = z.object({
  company_id:        z.string().uuid("Select a company"),
  assigned_to:       z.string().uuid("Assign to a sales rep"),
  status:            z.enum(["draft","pending","confirmed","processing","shipped","delivered","cancelled"]).default("draft"),
  order_date:        z.string().min(1, "Order date is required"),
  expected_delivery: z.string().optional(),
  notes:             z.string().optional(),
  items:             z.array(orderItemSchema).min(1, "Order must have at least one item"),
});

export type OrderFormValues  = z.infer<typeof orderSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;
