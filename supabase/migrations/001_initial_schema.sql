-- ============================================================
-- Platforma B2B MetricFlow: schema bazei de date
-- Migrarea: 001_initial_schema.sql
-- Se rulează în: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── Extensii ───
create extension if not exists "uuid-ossp";

-- ─── Tipuri enumerate ───
create type user_role as enum ('admin', 'sales_rep', 'viewer');
create type order_status as enum (
  'draft', 'pending', 'confirmed', 'processing',
  'shipped', 'delivered', 'cancelled'
);
create type company_tier as enum ('enterprise', 'mid_market', 'smb');
create type product_category as enum (
  'software', 'hardware', 'services', 'consulting', 'support'
);

-- ─── user_profiles: profiluri utilizatori (rol, nume) ───
-- Extinde auth.users (Supabase) cu date de profil specifice aplicației.
-- Legat prin trigger: fiecare utilizator nou primește automat un rând de profil.
create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        user_role not null default 'sales_rep',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Creează automat profilul la înregistrarea utilizatorului
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── companies: companii (clienții B2B) ───
create table public.companies (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  industry        text not null,
  country         text not null default 'Romania',
  city            text,
  tier            company_tier not null default 'smb',
  annual_revenue  numeric(15,2),
  employee_count  integer,
  website         text,
  notes           text,
  created_by      uuid references public.user_profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_companies_tier on public.companies(tier);
create index idx_companies_country on public.companies(country);

-- ─── contacts: persoane de contact ───
create table public.contacts (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  job_title   text,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_contacts_company on public.contacts(company_id);

-- ─── products: produse din catalog ───
create table public.products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  sku          text not null unique,
  category     product_category not null,
  description  text,
  unit_price   numeric(10,2) not null check (unit_price > 0),
  stock_qty    integer not null default 0 check (stock_qty >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_products_category on public.products(category);
create index idx_products_active on public.products(is_active);

-- ─── orders: comenzi (antet) ───
create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  order_number      text not null unique default 'ORD-' || upper(substr(uuid_generate_v4()::text, 1, 8)),
  company_id        uuid not null references public.companies(id),
  assigned_to       uuid not null references public.user_profiles(id),
  status            order_status not null default 'draft',
  total_amount      numeric(15,2) not null default 0,
  order_date        date not null default current_date,
  expected_delivery date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_orders_company on public.orders(company_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_date on public.orders(order_date desc);
create index idx_orders_assigned on public.orders(assigned_to);

-- ─── order_items: linii de comandă (legătură comenzi–produse) ───
create table public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10,2) not null check (unit_price > 0),
  line_total  numeric(15,2) generated always as (quantity * unit_price) stored
);

create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

-- ─── Actualizare automată a totalului la modificarea liniilor ───
create or replace function public.recalculate_order_total()
returns trigger as $$
begin
  update public.orders
  set
    total_amount = (
      select coalesce(sum(line_total), 0)
      from public.order_items
      where order_id = coalesce(new.order_id, old.order_id)
    ),
    updated_at = now()
  where id = coalesce(new.order_id, old.order_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger sync_order_total
  after insert or update or delete on public.order_items
  for each row execute procedure public.recalculate_order_total();

-- ─── Trigger ajutător pentru updated_at ───
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_companies_updated_at  before update on public.companies  for each row execute procedure public.set_updated_at();
create trigger set_contacts_updated_at   before update on public.contacts   for each row execute procedure public.set_updated_at();
create trigger set_products_updated_at   before update on public.products   for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at     before update on public.orders     for each row execute procedure public.set_updated_at();

-- ─── Vizualizări analitice ───

-- Vizualizare venit lunar (folosită de graficul din dashboard)
create or replace view public.v_revenue_by_month as
select
  to_char(o.order_date, 'YYYY-MM') as month,
  count(o.id)                       as order_count,
  sum(o.total_amount)               as revenue
from public.orders o
where o.status not in ('draft', 'cancelled')
group by 1
order by 1;

-- Vizualizare top clienți
create or replace view public.v_top_customers as
select
  c.id           as company_id,
  c.name         as company_name,
  c.tier,
  count(o.id)    as order_count,
  sum(o.total_amount) as total_revenue,
  avg(o.total_amount) as avg_order_value
from public.companies c
join public.orders o on o.company_id = c.id
where o.status not in ('draft', 'cancelled')
group by c.id, c.name, c.tier
order by total_revenue desc;

-- Vizualizare performanță produse
create or replace view public.v_product_performance as
select
  p.id           as product_id,
  p.name         as product_name,
  p.category,
  sum(oi.quantity)    as units_sold,
  sum(oi.line_total)  as revenue
from public.products p
join public.order_items oi on oi.product_id = p.id
join public.orders o on o.id = oi.order_id
where o.status not in ('draft', 'cancelled')
group by p.id, p.name, p.category
order by revenue desc;

-- Performanța reprezentanților de vânzări
create or replace view public.v_sales_by_rep as
select
  up.id           as user_id,
  up.full_name,
  count(o.id)     as order_count,
  sum(o.total_amount)  as total_revenue,
  avg(o.total_amount)  as avg_order_value
from public.user_profiles up
join public.orders o on o.assigned_to = up.id
where o.status not in ('draft', 'cancelled')
group by up.id, up.full_name
order by total_revenue desc;

-- ─── Securitate la nivel de rând (RLS) ───
-- Idee-cheie: RLS impune controlul accesului la nivelul bazei de date,
-- nu la nivelul aplicației. Nici măcar o cheie API compromisă nu îl poate ocoli.

alter table public.user_profiles enable row level security;
alter table public.companies     enable row level security;
alter table public.contacts      enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;

-- user_profiles: utilizatorii își văd doar propriul profil; adminii văd tot
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- companies: toți utilizatorii autentificați pot citi; doar adminii/reprezentanții pot scrie
create policy "Authenticated users can view companies"
  on public.companies for select
  using (auth.uid() is not null);

create policy "Sales reps and admins can manage companies"
  on public.companies for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('admin', 'sales_rep')
    )
  );

-- contacts: la fel ca la companies
create policy "Authenticated users can view contacts"
  on public.contacts for select
  using (auth.uid() is not null);

create policy "Sales reps and admins can manage contacts"
  on public.contacts for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('admin', 'sales_rep')
    )
  );

-- products: toți utilizatorii autentificați pot citi; doar adminii pot scrie
create policy "Authenticated users can view products"
  on public.products for select
  using (auth.uid() is not null);

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- orders: reprezentanții văd doar comenzile proprii; adminii văd tot
create policy "Sales reps see their own orders"
  on public.orders for select
  using (
    assigned_to = auth.uid()
    or exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Sales reps can create/update their orders"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('admin', 'sales_rep')
    )
  );

create policy "Sales reps can update their own orders"
  on public.orders for update
  using (
    assigned_to = auth.uid()
    or exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- order_items: urmează politica RLS a comenzii-părinte
create policy "View order items for accessible orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.assigned_to = auth.uid()
          or exists (
            select 1 from public.user_profiles
            where id = auth.uid() and role = 'admin'
          )
        )
    )
  );

create policy "Manage order items for accessible orders"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.assigned_to = auth.uid()
          or exists (
            select 1 from public.user_profiles
            where id = auth.uid() and role = 'admin'
          )
        )
    )
  );

-- Acordă acces la vizualizări utilizatorilor autentificați
grant select on public.v_revenue_by_month    to authenticated;
grant select on public.v_top_customers       to authenticated;
grant select on public.v_product_performance to authenticated;
grant select on public.v_sales_by_rep        to authenticated;
