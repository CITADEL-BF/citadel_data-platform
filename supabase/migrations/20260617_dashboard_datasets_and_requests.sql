-- ============================================================
-- Dashboard data model: managed datasets + platform requests
-- ============================================================

create schema if not exists app;

create table if not exists public.user_managed_datasets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(user_id) on delete cascade,
  organization_slug text,
  title text not null,
  period_label text,
  expected_update_frequency text,
  next_expected_update_at date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_managed_datasets_status_chk check (status in ('active', 'archived'))
);

create index if not exists idx_user_managed_datasets_owner
  on public.user_managed_datasets (owner_user_id, created_at desc);

create table if not exists public.platform_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  requester_user_id uuid not null references public.profiles(user_id) on delete cascade,
  target_organization_slug text,
  request_payload jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  reviewer_user_id uuid references public.profiles(user_id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint platform_requests_type_chk check (request_type in ('data_access', 'join_organization', 'create_organization')),
  constraint platform_requests_status_chk check (status in ('new', 'accepted', 'rejected'))
);

create index if not exists idx_platform_requests_status
  on public.platform_requests (status, created_at desc);

create index if not exists idx_platform_requests_requester
  on public.platform_requests (requester_user_id, created_at desc);

create or replace function app.current_user_is_reviewer()
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
      and p.platform_role in ('sys_collaborator', 'sys_admin')
  );
$$;

grant select, insert, update, delete on public.user_managed_datasets to authenticated;
grant select, insert, update on public.platform_requests to authenticated;

alter table public.user_managed_datasets enable row level security;
alter table public.platform_requests enable row level security;

drop policy if exists managed_datasets_select_own on public.user_managed_datasets;
create policy managed_datasets_select_own
on public.user_managed_datasets
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists managed_datasets_insert_own on public.user_managed_datasets;
create policy managed_datasets_insert_own
on public.user_managed_datasets
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists managed_datasets_update_own on public.user_managed_datasets;
create policy managed_datasets_update_own
on public.user_managed_datasets
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists managed_datasets_delete_own on public.user_managed_datasets;
create policy managed_datasets_delete_own
on public.user_managed_datasets
for delete
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists platform_requests_select_own_or_reviewer on public.platform_requests;
create policy platform_requests_select_own_or_reviewer
on public.platform_requests
for select
to authenticated
using (
  auth.uid() = requester_user_id
  or app.current_user_is_reviewer()
);

drop policy if exists platform_requests_insert_own on public.platform_requests;
create policy platform_requests_insert_own
on public.platform_requests
for insert
to authenticated
with check (auth.uid() = requester_user_id);

drop policy if exists platform_requests_update_reviewer on public.platform_requests;
create policy platform_requests_update_reviewer
on public.platform_requests
for update
to authenticated
using (app.current_user_is_reviewer())
with check (
  app.current_user_is_reviewer()
  and status in ('new', 'accepted', 'rejected')
);
