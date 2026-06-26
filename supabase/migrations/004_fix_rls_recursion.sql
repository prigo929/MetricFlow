-- ============================================================
-- Platforma B2B MetricFlow: corecția recursivității RLS
-- Migrarea: 004_fix_rls_recursion.sql
-- ============================================================
--
-- DE CE EXISTĂ ACEASTĂ MIGRARE:
-- Politicile pe roluri din 001/002 verificau rolul apelantului printr-un
-- exists (select 1 from public.user_profiles where id = auth.uid() and role = ...) inline.
-- Când acest tipar apare într-o politică CHIAR PE user_profiles, evaluarea
-- politicii redeclanșează aceeași politică → PostgreSQL eșuează cu
-- "infinite recursion detected in policy for relation user_profiles".
--
-- SOLUȚIA:
-- O funcție ajutătoare SECURITY DEFINER, get_user_role, citește rolul ocolind RLS
-- (rulează cu privilegiile proprietarului), deci nu reintră niciodată în politică. Toate
-- verificările de rol sunt rescrise să o apeleze. set search_path = public protejează
-- funcția împotriva deturnării search-path, o capcană cunoscută a SECURITY DEFINER.

-- 1. Șterge politicile recursive / de verificare a rolului create în 001 și 002.
drop policy if exists "Admins can view all profiles" on public.user_profiles;
drop policy if exists "Sales reps and admins can manage companies" on public.companies;
drop policy if exists "Sales reps and admins can manage contacts" on public.contacts;
drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Sales reps see their own orders" on public.orders;
drop policy if exists "Sales reps can create/update their orders" on public.orders;
drop policy if exists "Sales reps can update their own orders" on public.orders;
drop policy if exists "View order items for accessible orders" on public.order_items;
drop policy if exists "Manage order items for accessible orders" on public.order_items;
drop policy if exists "Admins can view audit logs" on public.audit_logs;

-- 2. Funcție ajutătoare SECURITY DEFINER care citește rolul fără a reintra în RLS.
create or replace function public.get_user_role(user_id uuid)
returns user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  r user_role;
begin
  select role into r from public.user_profiles where id = user_id;
  return r;
end;
$$;

-- 3. Recreează politicile folosind funcția ajutătoare.
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Sales reps and admins can manage companies"
  on public.companies for all
  using (public.get_user_role(auth.uid()) in ('admin', 'sales_rep'));

create policy "Sales reps and admins can manage contacts"
  on public.contacts for all
  using (public.get_user_role(auth.uid()) in ('admin', 'sales_rep'));

create policy "Admins can manage products"
  on public.products for all
  using (public.get_user_role(auth.uid()) = 'admin');

create policy "Sales reps see their own orders"
  on public.orders for select
  using (
    assigned_to = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );

create policy "Sales reps can create/update their orders"
  on public.orders for insert
  with check (public.get_user_role(auth.uid()) in ('admin', 'sales_rep'));

create policy "Sales reps can update their own orders"
  on public.orders for update
  using (
    assigned_to = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );

create policy "View order items for accessible orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.assigned_to = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
    )
  );

create policy "Manage order items for accessible orders"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.assigned_to = auth.uid() or public.get_user_role(auth.uid()) = 'admin')
    )
  );

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.get_user_role(auth.uid()) = 'admin');

-- 4. Inițializează contul de administrator demo (corespunde utilizatorilor de test din lucrare).
-- Se poate re-rula în siguranță; fără efect dacă contul nu există încă.
update public.user_profiles
set role = 'admin'
where email = 'admin@metricflow.com';
