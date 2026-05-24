-- 1. Drop existing policies on user_profiles, companies, contacts, products, orders, order_items
drop policy if exists "Admins can view all profiles" on public.user_profiles;
drop policy if exists "Sales reps and admins can manage companies" on public.companies;
drop policy if exists "Sales reps and admins can manage contacts" on public.contacts;
drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Sales reps see their own orders" on public.orders;
drop policy if exists "Sales reps can create/update their orders" on public.orders;
drop policy if exists "Sales reps can update their own orders" on public.orders;
drop policy if exists "View order items for accessible orders" on public.order_items;
drop policy if exists "Manage order items for accessible orders" on public.order_items;

-- 2. Create the SECURITY DEFINER function to retrieve user role without infinite recursion
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

-- 3. Re-create the select policies using the helper function
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    public.get_user_role(auth.uid()) = 'admin'
  );

create policy "Sales reps and admins can manage companies"
  on public.companies for all
  using (
    public.get_user_role(auth.uid()) in ('admin', 'sales_rep')
  );

create policy "Sales reps and admins can manage contacts"
  on public.contacts for all
  using (
    public.get_user_role(auth.uid()) in ('admin', 'sales_rep')
  );

create policy "Admins can manage products"
  on public.products for all
  using (
    public.get_user_role(auth.uid()) = 'admin'
  );

create policy "Sales reps see their own orders"
  on public.orders for select
  using (
    assigned_to = auth.uid()
    or public.get_user_role(auth.uid()) = 'admin'
  );

create policy "Sales reps can create/update their orders"
  on public.orders for insert
  with check (
    public.get_user_role(auth.uid()) in ('admin', 'sales_rep')
  );

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
        and (
          o.assigned_to = auth.uid()
          or public.get_user_role(auth.uid()) = 'admin'
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
          or public.get_user_role(auth.uid()) = 'admin'
        )
    )
  );

-- 4. Update the user profile of the admin user to 'admin' role
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@metricflow.com';
