import { ensureSupabaseConfigured, isSupabaseConfigured } from '../../lib/supabaseClient'

export async function logUserActivity({ type, label, detail = null }) {
  if (!isSupabaseConfigured) return false
  if (!type || !label) return false

  const client = ensureSupabaseConfigured()

  try {
    const { error } = await client.rpc('log_user_activity', {
      p_activity_type: type,
      p_activity_label: label,
      p_activity_detail: detail,
    })
    if (!error) return true
  } catch {
    // Fallback below if RPC is unavailable.
  }

  const { data: userData } = await client.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) return false

  const { error } = await client
    .from('user_activity_feed')
    .insert({
      user_id: userId,
      activity_type: type,
      activity_label: label,
      activity_detail: detail,
    })

  return !error
}

export async function fetchUserActivityFeed({ limit = 80, excludeTypes = [] } = {}) {
  if (!isSupabaseConfigured) return []

  const client = ensureSupabaseConfigured()
  const { data, error } = await client
    .from('user_activity_feed')
    .select('id,activity_type,activity_label,activity_detail,occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) return []

  const excluded = new Set((excludeTypes || []).map((value) => String(value || '').trim().toLowerCase()))

  return (data || [])
    .filter((item) => !excluded.has(String(item.activity_type || '').toLowerCase()))
    .map((item) => ({
      id: item.id,
      type: item.activity_type,
      message: item.activity_label,
      detail: item.activity_detail,
      at: item.occurred_at,
    }))
}
