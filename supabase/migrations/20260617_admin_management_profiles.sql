-- ============================================================
-- Admin management support on profiles
-- ============================================================

alter table public.profiles
  add column if not exists profile_state text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_profile_state_chk'
  ) then
    alter table public.profiles
      add constraint profiles_profile_state_chk
      check (profile_state in ('active', 'suspended'));
  end if;
end $$;

create index if not exists idx_profiles_platform_role_state
  on public.profiles (platform_role, profile_state);

create or replace function app.current_user_is_sys_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.platform_role = 'sys_admin'
  );
$$;

drop policy if exists profiles_select_sys_admin on public.profiles;
create policy profiles_select_sys_admin
on public.profiles
for select
to authenticated
using (app.current_user_is_sys_admin());

drop policy if exists profiles_update_sys_admin on public.profiles;
create policy profiles_update_sys_admin
on public.profiles
for update
to authenticated
using (app.current_user_is_sys_admin())
with check (app.current_user_is_sys_admin());
