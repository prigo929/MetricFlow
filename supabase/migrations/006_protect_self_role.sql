-- ============================================================
-- MetricFlow B2B Platform — Self-Role Protection
-- Migration: 006_protect_self_role.sql
-- ============================================================
--
-- WHY THIS MIGRATION EXISTS:
-- An admin could previously change their OWN role to sales_rep/viewer and immediately
-- lose access to the role-management UI — with no way back unless another admin exists
-- (and in a single-admin deployment, no way back at all). This redefines update_user_role
-- to forbid an admin from changing their own role; role changes for an account must be
-- performed by a *different* admin. (The UI mirrors this by disabling the caller's own row.)

create or replace function public.update_user_role(target_user_id uuid, new_role user_role)
returns void as $$
begin
  -- Only admins may manage roles.
  if not exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Access Denied: Only admins can manage roles';
  end if;

  -- An admin cannot change their own role (prevents self-lockout).
  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  update public.user_profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;
