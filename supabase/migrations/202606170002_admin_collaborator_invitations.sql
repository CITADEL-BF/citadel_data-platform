-- ============================================================
-- Admin collaborator invitations
-- ============================================================

create table if not exists public.admin_collaborator_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by_user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_collaborator_invitations_status_chk check (status in ('pending', 'accepted', 'cancelled'))
);

create unique index if not exists idx_admin_collab_invite_pending_email
  on public.admin_collaborator_invitations (lower(email))
  where status = 'pending';

drop trigger if exists trg_admin_collab_invitations_set_updated_at on public.admin_collaborator_invitations;
create trigger trg_admin_collab_invitations_set_updated_at
before update on public.admin_collaborator_invitations
for each row execute function app.set_updated_at();

grant select, insert, update on public.admin_collaborator_invitations to authenticated;

alter table public.admin_collaborator_invitations enable row level security;

drop policy if exists admin_collab_invite_select_sys_admin on public.admin_collaborator_invitations;
create policy admin_collab_invite_select_sys_admin
on public.admin_collaborator_invitations
for select
to authenticated
using (app.current_user_is_sys_admin());

drop policy if exists admin_collab_invite_insert_sys_admin on public.admin_collaborator_invitations;
create policy admin_collab_invite_insert_sys_admin
on public.admin_collaborator_invitations
for insert
to authenticated
with check (app.current_user_is_sys_admin());

drop policy if exists admin_collab_invite_update_sys_admin on public.admin_collaborator_invitations;
create policy admin_collab_invite_update_sys_admin
on public.admin_collaborator_invitations
for update
to authenticated
using (app.current_user_is_sys_admin())
with check (app.current_user_is_sys_admin());
