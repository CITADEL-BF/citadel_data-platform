

create schema if not exists app;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Enum-like constraint helper for platform roles
-- ------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'platform_role'
  ) then
    create type public.platform_role as enum (
      'visitor',
      'citizen',
      'sys_collaborator',
      'sys_admin'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  username text,
  about text,
  platform_role public.platform_role not null default 'citizen',
  avatar_seed text not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_platform_role on public.profiles (platform_role);

-- ------------------------------------------------------------
-- Notification preferences
-- ------------------------------------------------------------
create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  submission_validated boolean not null default true,
  submission_rejected boolean not null default true,
  membership_accepted boolean not null default true,
  membership_rejected boolean not null default true,
  group_message boolean not null default true,
  dataset_published boolean not null default true,
  epidemio_alert boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Activity feed (read-only for users)
-- ------------------------------------------------------------
create table if not exists public.user_activity_feed (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  activity_type text not null,
  activity_label text not null,
  activity_detail text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_user_activity_feed_user_time
  on public.user_activity_feed (user_id, occurred_at desc);

-- ------------------------------------------------------------
-- Generic updated_at trigger
-- ------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function app.set_updated_at();

drop trigger if exists trg_notif_prefs_set_updated_at on public.user_notification_preferences;
create trigger trg_notif_prefs_set_updated_at
before update on public.user_notification_preferences
for each row execute function app.set_updated_at();

-- ------------------------------------------------------------
-- New auth.users hook: profile + prefs + first activity
-- ------------------------------------------------------------
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md jsonb;
  role_value public.platform_role;
  safe_email text;
begin
  md := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  safe_email := coalesce(new.email, '');

  role_value := case
    when (md ->> 'platform_role') in ('sys_collaborator', 'sys_admin') then 'citizen'::public.platform_role
    when (md ->> 'platform_role') in ('visitor', 'citizen') then (md ->> 'platform_role')::public.platform_role
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
    about = coalesce(excluded.about, public.profiles.about);

  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_activity_feed (user_id, activity_type, activity_label)
  values (new.id, 'connexion', 'Connexion au portail');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app.handle_new_user();

-- ------------------------------------------------------------
-- Optional helper to append activity entries
-- ------------------------------------------------------------
create or replace function public.log_user_activity(
  p_activity_type text,
  p_activity_label text,
  p_activity_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'auth_required';
  end if;

  insert into public.user_activity_feed (user_id, activity_type, activity_label, activity_detail)
  values (uid, p_activity_type, p_activity_label, p_activity_detail);
end;
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_notification_preferences to authenticated;
grant select, insert on public.user_activity_feed to authenticated;

alter table public.profiles enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.user_activity_feed enable row level security;

-- Profiles: user can read/update only own profile

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow service role (server/admin) to manage profiles

drop policy if exists profiles_all_service_role on public.profiles;
create policy profiles_all_service_role
on public.profiles
for all
to service_role
using (true)
with check (true);

-- Notification preferences: read/update own

drop policy if exists notif_select_own on public.user_notification_preferences;
create policy notif_select_own
on public.user_notification_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists notif_update_own on public.user_notification_preferences;
create policy notif_update_own
on public.user_notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Activity feed: read own, insert own

drop policy if exists activity_select_own on public.user_activity_feed;
create policy activity_select_own
on public.user_activity_feed
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists activity_insert_own on public.user_activity_feed;
create policy activity_insert_own
on public.user_activity_feed
for insert
to authenticated
with check (auth.uid() = user_id);



