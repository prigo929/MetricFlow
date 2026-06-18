-- ============================================================
-- MetricFlow B2B Platform — RLS Recursion Fix
-- Migration: 004_fix_rls_recursion.sql
-- ============================================================
--
-- WHY THIS MIGRATION EXISTS:
-- The role-based policies in 001/002 checked the caller's role with an inline
-- `exists (select 1 from public.user_profiles where id = auth.uid() and role = ...)`.
-- When that pattern appears in a policy ON `user_profiles` itself, evaluating the
-- policy re-triggers the same policy → PostgreSQL aborts with
-- "infinite recursion detected in policy for relation user_profiles".
--
-- THE FIX:
-- A `SECURITY DEFINER` helper, `get_user_role`, reads the role while bypassing RLS
-- (it runs with the owner's privileges), so it never re-enters the policy. All
-- role checks are rewritten to call it. `set search_path = public` hardens the
-- function against search-path hijacking, a known SECURITY DEFINER pitfall.

-- 1. Drop the recursive / role-checking policies created in 001 and 002.
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

-- 2. SECURITY DEFINER helper to read a user's role without re-entering RLS.
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

-- 3. Re-create the policies using the helper function.
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

-- 4. Bootstrap the demo administrator account (matches the thesis test users).
--    Safe to re-run; no-op if the account does not exist yet.
update public.user_profiles
set role = 'admin'
where email = 'admin@metricflow.com';
