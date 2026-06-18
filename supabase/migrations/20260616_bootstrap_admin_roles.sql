

create table if not exists app.bootstrap_admin_emails (
  email text primary key,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_bootstrap_admin_single_enabled
on app.bootstrap_admin_emails ((enabled))
where enabled;

create or replace function app.is_bootstrap_admin_email(p_email text)
returns boolean
language sql
stable
set search_path = public, app
as $$
  select exists (
    select 1
    from app.bootstrap_admin_emails b
    where b.enabled
      and lower(b.email) = lower(coalesce(p_email, ''))
  );
$$;

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  md jsonb;
  role_value public.platform_role;
  safe_email text;
begin
  md := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  safe_email := coalesce(new.email, '');

  role_value := case
    when app.is_bootstrap_admin_email(safe_email) then 'sys_admin'::public.platform_role
    else 'citizen'::public.platform_role
  end;

  insert into public.profiles (
    user_id,
    email,
    full_name,
    username,
    about,
    platform_role
  )
  values (
    new.id,
    safe_email,
    nullif(trim(coalesce(md ->> 'full_name', '')), ''),
    nullif(trim(coalesce(md ->> 'username', '')), ''),
    nullif(trim(coalesce(md ->> 'about', '')), ''),
    role_value
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    username = coalesce(excluded.username, public.profiles.username),
    about = coalesce(excluded.about, public.profiles.about),
    platform_role = case
      when app.is_bootstrap_admin_email(excluded.email) then 'sys_admin'::public.platform_role
      else public.profiles.platform_role
    end;

  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_activity_feed (user_id, activity_type, activity_label)
  values (new.id, 'inscription', 's\'est inscrit');

  return new;
end;
$$;

-- Promote any existing account matching the bootstrap allowlist.
insert into public.profiles (
  user_id,
  email,
  full_name,
  username,
  about,
  platform_role
)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'username', '')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'about', '')), ''),
  case
    when app.is_bootstrap_admin_email(u.email) then 'sys_admin'::public.platform_role
    else 'citizen'::public.platform_role
  end
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
   or app.is_bootstrap_admin_email(u.email)
on conflict (user_id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  username = coalesce(excluded.username, public.profiles.username),
  about = coalesce(excluded.about, public.profiles.about),
  platform_role = case
    when app.is_bootstrap_admin_email(excluded.email) then 'sys_admin'::public.platform_role
    else public.profiles.platform_role
  end;

-- Backfill a real signup activity for existing users that do not yet have one.
insert into public.user_activity_feed (user_id, activity_type, activity_label, occurred_at)
select
  u.id,
  'inscription',
  's\'est inscrit',
  coalesce(u.created_at, now())
from auth.users u
left join public.user_activity_feed f
  on f.user_id = u.id
 and f.activity_type = 'inscription'
where f.id is null;
