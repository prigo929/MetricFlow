import { z } from "zod";

/**
 * WHAT IS ZOD?
 * Zod is a TypeScript-first schema declaration and validation library.
 * Instead of checking types only during development, Zod validates the data shape at RUNTIME.
 * If a user submits an email that lacks an "@" symbol or leaves a required field blank,
 * Zod intercepts it and returns helpful user-facing error messages.
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  // Rules: must be a string, and must be formatted like an email address
  email:    z.string().email("Invalid email address"),
  // Rules: must be a string, and at least 6 characters long
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    full_name:       z.string().min(2, "Full name is required"),
    email:           z.string().email("Invalid email address"),
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  /**
   * WHAT IS .refine()?
   * `.refine` allows us to run custom validation checks that compare multiple fields.
   * Here, we verify if `password` matches the `confirmPassword` input exactly.
   * If it fails, the error message is attached to the `confirmPassword` field.
   */
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match", path: ["confirmPassword"],
  });

// ─── Company ───────────────────────────────────────────────────────────────────

export const companySchema = z.object({
  name:           z.string().min(2, "Company name is required"),
  industry:       z.string().min(1, "Industry is required"),
  country:        z.string().min(1, "Country is required"),
  city:           z.string().optional(), // `.optional()` means this field can be omitted/empty
  tier:           z.enum(["enterprise", "mid_market", "smb"]), // Enforces options matching the database tier ENUM
  
  /**
   * WHAT IS z.preprocess()?
   * Form inputs in HTML browsers (like `<input type="number">`) always submit values as raw strings.
   * `z.preprocess()` intercepts the raw input value before validation, converting empty strings 
   * to `null` and non-empty strings into numbers using `Number()`, so it complies with our numeric constraints.
   */
  annual_revenue: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  employee_count: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  // Allow the field to be a valid URL, or an empty string, or skipped entirely
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes:   z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

// ─── Contact ───────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  company_id: z.string().uuid("Must be linked to a company"), // Enforces UUID format constraint
  full_name:  z.string().min(2, "Full name is required"),
  email:      z.string().email("Invalid email address"),
  phone:      z.string().optional(),
  job_title:  z.string().optional(),
  is_primary: z.boolean().default(false), // Sets value to false if checkbox is left untoggled
});

export type ContactFormValues = z.infer<typeof contactSchema>;

// ─── Product ───────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name:        z.string().min(2, "Product name is required"),
  sku:         z.string().min(2, "SKU is required"),
  category:    z.enum(["software", "hardware", "services", "consulting", "support"]),
  description: z.string().optional(),
  /**
   * WHAT IS z.coerce.number()?
   * Coercion is a shorthand for preprocessing. It automatically casts string inputs 
   * (e.g. "49.99") into native JavaScript numbers (49.99) during parsing.
   */
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
  // Validates that the order has a list of items, containing at least 1 line item
  items:             z.array(orderItemSchema).min(1, "Order must have at least one item"),
});

export type OrderFormValues  = z.infer<typeof orderSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

