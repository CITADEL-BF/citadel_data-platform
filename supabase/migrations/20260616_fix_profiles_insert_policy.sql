-- ============================================================
-- Fix RLS: allow authenticated users to insert their own profile
-- and backfill profiles for existing auth users.
-- ============================================================

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_notification_preferences to authenticated;
grant select, insert on public.user_activity_feed to authenticated;

-- 1) Add missing INSERT policy on profiles for authenticated users

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

-- 2) Ensure existing users have a profile row
insert into public.profiles (user_id, email, full_name, username, platform_role)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'username', '')), ''),
  case
    when (u.raw_user_meta_data ->> 'platform_role') in ('visitor', 'citizen', 'sys_collaborator', 'sys_admin')
      then (u.raw_user_meta_data ->> 'platform_role')::public.platform_role
    else 'citizen'::public.platform_role
  end
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

-- 3) Ensure notification preferences exist for existing users
insert into public.user_notification_preferences (user_id)
select p.user_id
from public.profiles p
left join public.user_notification_preferences n on n.user_id = p.user_id
where n.user_id is null;
