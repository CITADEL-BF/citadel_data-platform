import { normalizeRole } from './roles'
import { ensureSupabaseConfigured, isSupabaseConfigured } from '../../lib/supabaseClient'
import { logUserActivity } from './supabaseActivity'

function toLegacyUserPayload(authUser, profile) {
  const role = normalizeRole(profile?.platform_role || authUser?.user_metadata?.platform_role, true)
  const fullName = String(profile?.full_name || authUser?.user_metadata?.full_name || '').trim()

  return {
    id: authUser?.id,
    email: authUser?.email || profile?.email || '',
    name: fullName || profile?.username || 'Utilisateur connecté',
    firstName: fullName,
    lastName: '',
    username: profile?.username || authUser?.user_metadata?.username || '',
    apropos: profile?.about || '',
    role,
    platformRole: role,
    at: new Date().toISOString(),
    provider: 'supabase',
  }
}

function persistLegacySession(payload) {
  localStorage.setItem('citadel_auth_session', JSON.stringify({
    email: payload.email,
    at: payload.at,
    provider: 'supabase',
  }))
  localStorage.setItem('citadel_user', JSON.stringify(payload))
  localStorage.setItem('citadel_is_authenticated', 'true')
}

export function clearLegacySession() {
  localStorage.removeItem('citadel_auth_session')
  localStorage.removeItem('citadel_auth_token')
  localStorage.removeItem('citadel_user_session')
  localStorage.removeItem('citadel_user')
  localStorage.removeItem('citadel_is_authenticated')
}

async function fetchMyProfile(client, userId) {
  const { data, error } = await client
    .from('profiles')
    .select('user_id,email,full_name,username,about,platform_role,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

async function ensureProfile(client, authUser) {
  const existing = await fetchMyProfile(client, authUser.id)
  if (existing) return

  const initialPayload = {
    user_id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || null,
    username: authUser.user_metadata?.username || null,
    platform_role: 'citizen',
  }

  const { error } = await client
    .from('profiles')
    .insert(initialPayload)

  if (error) throw error
}

export async function syncSessionFromSupabase() {
  if (!isSupabaseConfigured) {
    return {
      isConnected: false,
      user: null,
      role: normalizeRole('', false),
    }
  }

  const client = ensureSupabaseConfigured()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError

  const session = sessionData?.session
  const authUser = session?.user

  if (!authUser) {
    clearLegacySession()
    return {
      isConnected: false,
      user: null,
      role: normalizeRole('', false),
    }
  }

  await ensureProfile(client, authUser)
  const profile = await fetchMyProfile(client, authUser.id)

  const payload = toLegacyUserPayload(authUser, profile)
  persistLegacySession(payload)

  return {
    isConnected: true,
    user: payload,
    role: payload.platformRole,
    profile,
  }
}

export function onSupabaseAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} }
  }

  const client = ensureSupabaseConfigured()
  const { data } = client.auth.onAuthStateChange((_event, _session) => {
    callback?.()
  })

  return {
    unsubscribe: () => {
      data?.subscription?.unsubscribe()
    },
  }
}

function normalizeAuthError(error) {
  const raw = String(error?.message || 'Erreur inconnue').toLowerCase()

  if (raw.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.'
  }
  if (raw.includes('email not confirmed')) {
    return 'Confirmez votre email avant de vous connecter.'
  }
  if (raw.includes('password should be at least')) {
    return 'Le mot de passe est trop court (8 caracteres minimum).'
  }
  if (raw.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email.'
  }

  return error?.message || 'Une erreur est survenue.'
}

export async function signInWithSupabase({ email, password }) {
  const client = ensureSupabaseConfigured()

  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(normalizeAuthError(error))
  }

  const session = await syncSessionFromSupabase()

  try {
    await logUserActivity({
      type: 'connexion',
      label: 'Connexion au portail',
      detail: null,
    })
  } catch {
    // Non bloquant si la fonction SQL n'est pas encore déployée.
  }

  return session
}

export async function signUpWithSupabase({ email, password, username, fullName }) {
  const client = ensureSupabaseConfigured()

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw new Error(normalizeAuthError(error))
  }

  if (data?.session) {
    return {
      ...(await syncSessionFromSupabase()),
      needsEmailConfirmation: false,
    }
  }

  return {
    isConnected: false,
    user: null,
    role: normalizeRole('', false),
    needsEmailConfirmation: true,
  }
}

export async function signOutFromSupabase() {
  if (!isSupabaseConfigured) {
    clearLegacySession()
    return
  }

  const client = ensureSupabaseConfigured()
  await client.auth.signOut()
  clearLegacySession()
}
