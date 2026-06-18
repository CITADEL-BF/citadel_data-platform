import { ensureSupabaseConfigured, isSupabaseConfigured } from '../../lib/supabaseClient'

export async function fetchManagedDatasetsForCurrentUser() {
  if (!isSupabaseConfigured) return []

  const client = ensureSupabaseConfigured()
  const { data, error } = await client
    .from('user_managed_datasets')
    .select('id,title,period_label,expected_update_frequency,next_expected_update_at,status,organization_slug,created_at')
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    period: row.period_label,
    frequency: row.expected_update_frequency,
    nextExpectedUpdate: row.next_expected_update_at,
    status: row.status,
    organizationSlug: row.organization_slug,
  }))
}

export async function fetchRequestsForDashboard({ reviewerView = false } = {}) {
  if (!isSupabaseConfigured) {
    return {
      pending: [],
      open: [],
    }
  }

  const client = ensureSupabaseConfigured()
  const { data, error } = await client
    .from('platform_requests')
    .select('id,request_type,target_organization_slug,request_payload,status,created_at,responded_at')
    .order('created_at', { ascending: false })

  if (error) {
    return {
      pending: [],
      open: [],
    }
  }

  const rows = reviewerView ? (data || []) : []
  const normalized = rows.map((row) => ({
    id: row.id,
    title: mapRequestTitle(row.request_type),
    detail: mapRequestDetail(row),
    status: row.status,
    createdAt: row.created_at,
    answeredAt: row.responded_at,
  }))

  return {
    pending: normalized.filter((item) => item.status === 'new'),
    open: normalized.filter((item) => item.status !== 'new'),
  }
}

export async function decideRequest({ requestId, status }) {
  if (!isSupabaseConfigured) return false
  if (!requestId || !['accepted', 'rejected'].includes(status)) return false

  const client = ensureSupabaseConfigured()
  const { error } = await client
    .from('platform_requests')
    .update({
      status,
      reviewer_user_id: (await client.auth.getUser()).data?.user?.id || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  return !error
}

export async function fetchCollaboratorsForAdmin() {
  if (!isSupabaseConfigured) return []

  const client = ensureSupabaseConfigured()
  const { data, error } = await client
    .from('profiles')
    .select('user_id,email,full_name,username,platform_role,profile_state,updated_at')
    .eq('platform_role', 'sys_collaborator')
    .order('updated_at', { ascending: false })

  if (error) return []

  return (data || []).map((row) => ({
    id: row.user_id,
    name: row.full_name || row.username || row.email || 'Collaborateur',
    email: row.email,
    role: row.platform_role,
    state: row.profile_state || 'active',
    updatedAt: row.updated_at,
  }))
}

export async function setCollaboratorState({ userId, state }) {
  if (!isSupabaseConfigured) return false
  if (!userId || !['active', 'suspended'].includes(state)) return false

  const client = ensureSupabaseConfigured()
  const { error } = await client
    .from('profiles')
    .update({ profile_state: state })
    .eq('user_id', userId)

  return !error
}

export async function setPlatformRole({ userId, role }) {
  if (!isSupabaseConfigured) return false
  if (!userId || !['citizen', 'sys_collaborator', 'sys_admin'].includes(role)) return false

  const client = ensureSupabaseConfigured()
  const { error } = await client
    .from('profiles')
    .update({ platform_role: role })
    .eq('user_id', userId)

  return !error
}

export async function fetchPendingCollaboratorInvitations() {
  if (!isSupabaseConfigured) return []

  const client = ensureSupabaseConfigured()
  const { data, error } = await client
    .from('admin_collaborator_invitations')
    .select('id,email,status,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }))
}

export async function inviteOrPromoteCollaborator({ email }) {
  if (!isSupabaseConfigured) return { ok: false, mode: 'unconfigured' }

  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return { ok: false, mode: 'invalid_email' }

  const client = ensureSupabaseConfigured()

  const { data: existingProfile } = await client
    .from('profiles')
    .select('user_id,email')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (existingProfile?.user_id) {
    const { error: promoteError } = await client
      .from('profiles')
      .update({ platform_role: 'sys_collaborator', profile_state: 'active' })
      .eq('user_id', existingProfile.user_id)

    return promoteError
      ? { ok: false, mode: 'promote_failed' }
      : { ok: true, mode: 'promoted' }
  }

  const { data: existingInvite } = await client
    .from('admin_collaborator_invitations')
    .select('id,email,status')
    .ilike('email', normalizedEmail)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite?.id) {
    return { ok: true, mode: 'already_pending' }
  }

  const { data: userData } = await client.auth.getUser()
  const adminId = userData?.user?.id
  if (!adminId) return { ok: false, mode: 'auth_required' }

  const { error: inviteError } = await client
    .from('admin_collaborator_invitations')
    .insert({
      email: normalizedEmail,
      invited_by_user_id: adminId,
      status: 'pending',
    })

  return inviteError
    ? { ok: false, mode: 'invite_failed' }
    : { ok: true, mode: 'invited' }
}

export async function cancelCollaboratorInvitation({ invitationId }) {
  if (!isSupabaseConfigured) return false
  if (!invitationId) return false

  const client = ensureSupabaseConfigured()
  const { error } = await client
    .from('admin_collaborator_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  return !error
}

function mapRequestTitle(type) {
  if (type === 'join_organization') return 'Demande pour rejoindre une organisation'
  if (type === 'create_organization') return 'Demande pour créer une organisation'
  if (type === 'data_access') return "Demande d’accès aux données"
  return 'Demande plateforme'
}

function mapRequestDetail(row) {
  const target = row.target_organization_slug ? `Organisation: ${row.target_organization_slug}` : ''
  const reason = row.request_payload?.reason ? `Motif: ${row.request_payload.reason}` : ''
  return [target, reason].filter(Boolean).join(' • ') || 'Sans detail complementaire'
}
