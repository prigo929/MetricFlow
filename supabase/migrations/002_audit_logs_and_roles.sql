-- ============================================================
-- Platforma B2B MetricFlow: jurnale de audit și gestionarea rolurilor
-- Migrarea: 002_audit_logs_and_roles.sql
-- ============================================================

-- ─── Tabela de jurnale de audit ───
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

-- Activează RLS pe jurnalele de audit
alter table public.audit_logs enable row level security;

-- Politică: doar adminii pot vedea jurnalele de audit
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── Funcția trigger de audit ───
create or replace function public.process_audit_log()
returns trigger as $$
declare
  current_user_id uuid;
begin
  -- Identifică utilizatorul autentificat care execută acțiunea
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

-- Atașează trigger-ele pe tabela companies
drop trigger if exists audit_companies_trigger on public.companies;
create trigger audit_companies_trigger
  after insert or update or delete on public.companies
  for each row execute procedure public.process_audit_log();

-- Atașează trigger-ele pe tabela orders
drop trigger if exists audit_orders_trigger on public.orders;
create trigger audit_orders_trigger
  after insert or update or delete on public.orders
  for each row execute procedure public.process_audit_log();


-- ─── Funcție RPC SECURITY DEFINER pentru gestionarea rolurilor ───
create or replace function public.update_user_role(target_user_id uuid, new_role user_role)
returns void as $$
begin
  -- Verificare de securitate: confirmă că utilizatorul curent (auth.uid()) este admin
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

-- Acordă drept de execuție utilizatorilor autentificați
grant execute on function public.update_user_role(uuid, user_role) to authenticated;
