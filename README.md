# MetricFlow — B2B Sales Intelligence & Order Management Platform

Bachelor thesis project: **"B2B Sales Intelligence and Order Management Web Application Based on Data Analysis"**

MetricFlow is a premium, enterprise-grade B2B Customer Relationship Management (CRM) and Order Management System designed to bridge the gap between transactional databases and predictive business intelligence. Developed with a modern Next.js server-first architecture and integrated directly with Supabase, it provides robust, high-performance sales diagnostics, customer segmentation, database audit logs, and security enforcement.

---

## 🚀 Key Features & Modules

### 1. Sales Intelligence & Predictive Analytics (Thesis Anchor)
To support advanced analytical requirements, MetricFlow bypasses simple dashboard summaries by running database-level diagnostic and predictive queries through Postgres database views:
*   **RFM Customer Segmentation (`v_rfm_segments`)**: Uses the SQL `NTILE(4)` window function to grade clients on Recency, Frequency, and Monetary parameters. Assigns dynamic cohort codes (e.g. `4-4-4`) and segment labels (e.g., *Champions*, *Loyal Customers*, *At Risk*, *About to Sleep*, *Lost*) displayed on dynamic Recharts visualizations and filtering matrices.
*   **Automated Churn Risk Analysis (`v_churn_risk`)**: Measures historical purchase intervals per client. If a client's days since last order exceeds their average interval by 1.5x, they are flagged as a churn risk, showing warnings and risk factors on the executive alert feed.
*   **Product velocity & Stockout Forecasting (`v_product_velocity`)**: Measures daily run rate over a rolling 30-day window. Calculates remaining days to stockout and triggers preemptive replenishment alerts.

### 2. Database-Level Audit Logs & Access Security
*   **Transaction Audit Logging (`audit_logs`)**: Automatic Postgres triggers monitor operations (`INSERT`, `UPDATE`, `DELETE`) on core entities (`companies`, `orders`), logging previous and new state payloads as `jsonb` snapshots alongside user IDs.
*   **Role-Based Access Control (RBAC)**: Supports roles (`admin`, `sales_rep`, `customer`). Admin features are protected on the schema level, utilizing a security-definer RPC function (`update_user_role`) to prevent unauthorized role escalations.
*   **Row-Level Security (RLS)**: Enforces table data visibility directly inside Supabase, isolating client data based on user login sessions.

### 3. UX & Data Management Enhancements
*   **Interactive Column Sorting**: Column headers support ascending and descending sort toggles directly linked to Supabase queries via URL params, maintaining full pagination integrity.
*   **Layout Shift Mitigation**: Key tables use fixed relative width percentages (e.g. `w-[30%]`, `w-[20%]`) preventing layout jumps when data content reloads or filters are applied.
*   **Database-Level Server Pagination**: Implements server-side list slicing using range indexes (`.range()`) and resets pagination to page `1` on new search inputs, ensuring low-latency loads.
*   **Real-time Toast Notifications**: Integrated with Radix UI Toast primitives and a custom `useToast` state hook to provide animated notifications for successes, errors, and out-of-stock validation blocks.
*   **CSV Exporter Engine**: Flattens nested JSON objects (e.g., retrieving related values like company name and assigned representative) and downloads complete matched datasets separate from the active paginated list.
*   **Loading Skeletons & Error Boundaries**: Implements route-specific Next.js `loading.tsx` layout grids and global `error.tsx` boundaries to ensure graceful user experiences.

---

## 🛠 Tech Stack

*   **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers, Middlewares)
*   **Language**: TypeScript (Strict typing check)
*   **Styling**: Tailwind CSS + CSS Variables (harmonious dark mode / light mode controls)
*   **UI Components**: Radix UI Primitives (Toasts, Dropdowns, Dialogs, etc.)
*   **Visualizations**: Recharts (Dynamic responsiveness, tooltips, HSL-tailored charts)
*   **Database & Auth**: Supabase (PostgreSQL, Auth, RLS, Triggers, Custom Database Views)

---

## 📂 Project Structure

```text
src/
├── actions/             # Secure Next.js Server Actions (mutations & RPC executions)
├── app/
│   ├── (auth)/          # Authentication pages (Login, Register)
│   ├── (dashboard)/     # Protected app pages (Dashboard, Companies, Orders, Analytics, etc.)
│   │   ├── loading.tsx  # Route-specific suspense skeleton screens
│   │   └── error.tsx    # React error boundaries
│   └── auth/callback/   # Supabase OAuth callback route handler
├── components/
│   ├── charts/          # Custom responsive Recharts wrappers
│   ├── forms/           # React Hook Form + Zod validated forms
│   ├── layout/          # Sidebar navigation, User profile dropdowns
│   ├── shared/          # Reusable inputs, Pagination, ExportButton, TableFilters
│   └── ui/              # Base UI primitives (buttons, inputs, cards, toast, etc.)
├── hooks/               # Custom React hooks (use-toast, client state)
├── lib/
│   ├── supabase/        # Supabase client/server connection declarations & middleware
│   ├── utils/           # Data aggregation helpers (date groupings, formatting)
│   └── validations/     # Zod schemas for forms
└── types/               # Database-generated and custom TypeScript declarations
supabase/
├── migrations/          # Incremental database migrations (schema, audit logs, analytics views)
└── seed/                # Python scripts to seed the database with synthetic B2B data
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase project keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy Database Migrations
Deploy the migrations sequentially in your Supabase SQL Editor or through the Supabase CLI:
1.  **Schema Base**: [supabase/migrations/001_initial_schema.sql](file:///Users/alinprigoreanu/Documents/Bachelor's%20Thesis/MetricFlow/supabase/migrations/001_initial_schema.sql)
2.  **Audit Logs & RBAC**: [supabase/migrations/002_audit_logs_and_roles.sql](file:///Users/alinprigoreanu/Documents/Bachelor's%20Thesis/MetricFlow/supabase/migrations/002_audit_logs_and_roles.sql)
3.  **Sales Intelligence Views**: [supabase/migrations/003_sales_intelligence.sql](file:///Users/alinprigoreanu/Documents/Bachelor's%20Thesis/MetricFlow/supabase/migrations/003_sales_intelligence.sql)

### 4. Seed Seed-Data
To generate high-quality B2B dataset for demonstration:
```bash
cd supabase/seed
pip install faker
python seed_data.py > seed.sql
```
*Note: Open `seed.sql`, replace `ADMIN_USER_ID` references with your authenticated User ID, and run the SQL script in your Supabase editor.*

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚢 Deployment

Ensure environment variables are configured on the deployment provider (e.g., Vercel):
```bash
vercel --prod
```
All route handlers compile statically or dynamically depending on dynamic params.
