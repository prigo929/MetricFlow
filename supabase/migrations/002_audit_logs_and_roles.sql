-- ============================================================
-- MetricFlow B2B Platform — Audit Logs and Role Management
-- Migration: 002_audit_logs_and_roles.sql
-- ============================================================

-- ─── Audit Logs Table ───────────────────────────────────────
create table if not exists public.audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  table_name   text not null,
  action       text not null, -- 'INSERT', 'UPDATE', 'DELETE'
  record_id    uuid not null,
  old_data     jsonb,
  new_data     jsonb,
  changed_by   uuid references public.user_profiles(id) on delete set null,
  changed_at   timestamptz not null default now()
);

-- Enable RLS on audit logs
alter table public.audit_logs enable row level security;

-- Policy: Only admins can view the audit logs
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── Audit Trigger Function ───────────────────────────
create or replace function public.process_audit_log()
returns trigger as $$
declare
  current_user_id uuid;
begin
  -- Resolve authenticated user executing the action
  current_user_id := auth.uid();

  if (TG_OP = 'DELETE') then
    insert into public.audit_logs (table_name, action, record_id, old_data, changed_by)
    values (TG_TABLE_NAME, TG_OP, old.id, row_to_json(old)::jsonb, current_user_id);
    return old;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_logs (table_name, action, record_id, old_data, new_data, changed_by)
    values (TG_TABLE_NAME, TG_OP, new.id, row_to_json(old)::jsonb, row_to_json(new)::jsonb, current_user_id);
    return new;
  elsif (TG_OP = 'INSERT') then
    insert into public.audit_logs (table_name, action, record_id, new_data, changed_by)
    values (TG_TABLE_NAME, TG_OP, new.id, row_to_json(new)::jsonb, current_user_id);
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Attach triggers to companies table
drop trigger if exists audit_companies_trigger on public.companies;
create trigger audit_companies_trigger
  after insert or update or delete on public.companies
  for each row execute procedure public.process_audit_log();

-- Attach triggers to orders table
drop trigger if exists audit_orders_trigger on public.orders;
create trigger audit_orders_trigger
  after insert or update or delete on public.orders
  for each row execute procedure public.process_audit_log();


-- ─── Security Definer Role Manager RPC ──────────────────────
create or replace function public.update_user_role(target_user_id uuid, new_role user_role)
returns void as $$
begin
  -- Secure check: verify that the executing user (auth.uid()) is an admin
  if not exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Access Denied: Only admins can manage roles';
  end if;

  update public.user_profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users
grant execute on function public.update_user_role(uuid, user_role) to authenticated;
