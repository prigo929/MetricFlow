-- ============================================================
-- Platforma B2B MetricFlow: protecția propriului rol
-- Migrarea: 006_protect_self_role.sql
-- ============================================================
--
-- DE CE EXISTĂ ACEASTĂ MIGRARE:
-- Un administrator își putea schimba anterior PROPRIUL rol în sales_rep/viewer și
-- pierdea imediat accesul la gestiunea rolurilor, fără cale de întoarcere dacă nu există alt admin
-- (iar într-un deployment cu un singur admin, deloc). Aceasta redefinește update_user_role
-- pentru a interzice unui admin să-și schimbe propriul rol; schimbarea rolului unui cont trebuie
-- făcută de un alt admin. (Interfața reflectă asta dezactivând rândul propriu al apelantului.)

create or replace function public.update_user_role(target_user_id uuid, new_role user_role)
returns void as $$
begin
  -- Doar adminii pot gestiona rolurile.
  if not exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Access Denied: Only admins can manage roles';
  end if;

  -- Un admin nu își poate schimba propriul rol (previne auto-blocarea).
  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  update public.user_profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;
