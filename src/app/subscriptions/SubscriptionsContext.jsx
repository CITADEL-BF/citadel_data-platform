/**
 * SubscriptionsContext
 *
 * Gère les abonnements des utilisateurs aux organisations.
 * Persisté en localStorage côté client.
 * Conçu pour être remplacé par un appel API quand le backend sera disponible.
 *
 * Clés localStorage :
 *   citadel_subscriptions  → Set des slugs auxquels l'utilisateur est abonné
 *   citadel_sub_counts     → Map { slug → nombre d'abonnés }
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getRolePermissions, hasRolePermission, normalizeRole } from '../auth/roles'
import { onSupabaseAuthStateChange, syncSessionFromSupabase } from '../auth/supabaseAuth'
import { logUserActivity } from '../auth/supabaseActivity'

const STORAGE_KEY_MY_SUBS = 'citadel_subscriptions'
const STORAGE_KEY_SUBS_BY_USER = 'citadel_subscriptions_by_user'
const STORAGE_KEY_COUNTS = 'citadel_sub_counts'
const STORAGE_KEY_MY_MEMBERSHIPS = 'citadel_memberships'
const STORAGE_KEY_MEMBERSHIPS_BY_USER = 'citadel_memberships_by_user'
const STORAGE_KEY_MEMBER_COUNTS = 'citadel_member_counts'
const STORAGE_KEY_MEMBER_DIRECTORY = 'citadel_member_directory'
const AUTH_STORAGE_KEYS = [
  'citadel_auth_session',
  'citadel_auth_token',
  'citadel_user_session',
  'citadel_user',
  'citadel_is_authenticated',
]

function readConnectedState() {
  try {
    return AUTH_STORAGE_KEYS.some((key) => {
      const value = localStorage.getItem(key)
      return value && value !== 'false' && value !== 'null'
    })
  } catch {
    return false
  }
}

function readMySubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MY_SUBS)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function readSubscriptionsByUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBS_BY_USER)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw)
    return new Map(Object.entries(parsed).map(([userId, slugs]) => [userId, new Set(slugs)]))
  } catch {
    return new Map()
  }
}

function writeSubscriptionsByUser(map) {
  const obj = {}
  for (const [userId, slugsSet] of map.entries()) {
    obj[userId] = [...slugsSet]
  }
  localStorage.setItem(STORAGE_KEY_SUBS_BY_USER, JSON.stringify(obj))
}

function readMembershipsByUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERSHIPS_BY_USER)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw)
    return new Map(Object.entries(parsed).map(([userId, slugs]) => [userId, new Set(slugs)]))
  } catch {
    return new Map()
  }
}

function writeMembershipsByUser(map) {
  const obj = {}
  for (const [userId, slugsSet] of map.entries()) {
    obj[userId] = [...slugsSet]
  }
  localStorage.setItem(STORAGE_KEY_MEMBERSHIPS_BY_USER, JSON.stringify(obj))
}

function writeMySubscriptions(set) {
  localStorage.setItem(STORAGE_KEY_MY_SUBS, JSON.stringify([...set]))
}

function readCounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUNTS)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw)
    return new Map(Object.entries(parsed).map(([slug, count]) => [slug, Number(count) || 0]))
  } catch {
    return new Map()
  }
}

function writeCounts(map) {
  localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(Object.fromEntries(map)))
}

function readMyMemberships() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MY_MEMBERSHIPS)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeMyMemberships(set) {
  localStorage.setItem(STORAGE_KEY_MY_MEMBERSHIPS, JSON.stringify([...set]))
}

function readMemberCounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBER_COUNTS)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw)
    return new Map(Object.entries(parsed).map(([slug, count]) => [slug, Number(count) || 0]))
  } catch {
    return new Map()
  }
}

function writeMemberCounts(map) {
  localStorage.setItem(STORAGE_KEY_MEMBER_COUNTS, JSON.stringify(Object.fromEntries(map)))
}

function readMemberDirectory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBER_DIRECTORY)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw)
    return new Map(Object.entries(parsed).map(([slug, members]) => [slug, Array.isArray(members) ? members : []]))
  } catch {
    return new Map()
  }
}

function writeMemberDirectory(map) {
  localStorage.setItem(STORAGE_KEY_MEMBER_DIRECTORY, JSON.stringify(Object.fromEntries(map)))
}

function getCurrentUserIdentity() {
  const rawUser = localStorage.getItem('citadel_user')
  if (!rawUser) {
    return {
      id: `local-${Date.now()}`,
      name: 'Utilisateur connecte',
      email: '',
      role: 'member',
    }
  }

  try {
    const parsed = JSON.parse(rawUser)
    const firstName = String(parsed.firstName || parsed.prenom || '').trim()
    const lastName = String(parsed.lastName || parsed.nom || '').trim()
    const fullName = String(`${firstName} ${lastName}`).trim()
    const email = String(parsed.email || '').trim().toLowerCase()
    const id = String(parsed.id || parsed.userId || email || `local-${Date.now()}`)
    const role = String(parsed.role || 'member').toLowerCase()

    return {
      id,
      name: fullName || parsed.name || parsed.username || 'Utilisateur connecté',
      email,
      role: ['admin', 'editor', 'member'].includes(role) ? role : 'member',
    }
  } catch {
    return {
      id: `local-${Date.now()}`,
      name: 'Utilisateur connecte',
      email: '',
      role: 'member',
    }
  }
}

function readCurrentPlatformRole(isConnected = readConnectedState()) {
  try {
    const rawUser = localStorage.getItem('citadel_user')
    if (!rawUser) return normalizeRole('', isConnected)
    const parsed = JSON.parse(rawUser)
    return normalizeRole(parsed.platformRole || parsed.role, isConnected)
  } catch {
    return normalizeRole('', isConnected)
  }
}

async function resolveAuthStateFromSupabase() {
  try {
    const session = await syncSessionFromSupabase()
    return {
      isConnected: session.isConnected,
      role: session.role,
    }
  } catch {
    const connected = readConnectedState()
    return {
      isConnected: connected,
      role: readCurrentPlatformRole(connected),
    }
  }
}

const SubscriptionsContext = createContext(null)

export function SubscriptionsProvider({ children }) {
  const [isConnected, setIsConnected] = useState(readConnectedState)
  const [currentRole, setCurrentRole] = useState(readCurrentPlatformRole)
  const [subscriptionsByUser, setSubscriptionsByUser] = useState(readSubscriptionsByUser)
  const [counts, setCounts] = useState(readCounts)
  const [membershipsByUser, setMembershipsByUser] = useState(readMembershipsByUser)
  const [memberCounts, setMemberCounts] = useState(readMemberCounts)
  const [memberDirectory, setMemberDirectory] = useState(readMemberDirectory)
  const [currentUserId, setCurrentUserId] = useState(() => getCurrentUserIdentity().id)

  // Calculer mySubscriptions et myMemberships basé sur l'utilisateur actuel
  const mySubscriptions = useMemo(
    () => subscriptionsByUser.get(currentUserId) || new Set(),
    [subscriptionsByUser, currentUserId]
  )

  const myMemberships = useMemo(
    () => membershipsByUser.get(currentUserId) || new Set(),
    [membershipsByUser, currentUserId]
  )

  useEffect(() => {
    let isMounted = true

    async function refreshConnectionState() {
      const state = await resolveAuthStateFromSupabase()
      if (!isMounted) return

      setIsConnected(state.isConnected)
      setCurrentRole(state.role)
      
      // Mettre à jour l'ID de l'utilisateur actuel
      const identity = getCurrentUserIdentity()
      setCurrentUserId(identity.id)
    }

    refreshConnectionState()

    const authSubscription = onSupabaseAuthStateChange(() => {
      refreshConnectionState()
    })

    window.addEventListener('storage', refreshConnectionState)
    window.addEventListener('focus', refreshConnectionState)

    return () => {
      isMounted = false
      authSubscription.unsubscribe()
      window.removeEventListener('storage', refreshConnectionState)
      window.removeEventListener('focus', refreshConnectionState)
    }
  }, [])

  const isSubscribed = useCallback(
    (slug) => mySubscriptions.has(slug),
    [mySubscriptions]
  )

  const getSubscriberCount = useCallback(
    (slug) => counts.get(slug) ?? 0,
    [counts]
  )

  const isMember = useCallback(
    (slug) => myMemberships.has(slug),
    [myMemberships]
  )

  const hasAnyMembership = useMemo(
    () => myMemberships.size > 0,
    [myMemberships]
  )

  const getMemberCount = useCallback(
    (slug) => memberCounts.get(slug) ?? 0,
    [memberCounts]
  )

  const getMembers = useCallback(
    (slug) => {
      const members = memberDirectory.get(slug) || []
      const expected = memberCounts.get(slug) ?? members.length

      if (members.length >= expected) return members

      const placeholders = Array.from({ length: Math.max(0, expected - members.length) }, (_, idx) => ({
        id: `placeholder-${slug}-${idx + 1}`,
        name: `Membre ${members.length + idx + 1}`,
        email: '',
        role: 'member',
        joinedAt: null,
      }))

      return [...members, ...placeholders]
    },
    [memberDirectory, memberCounts]
  )

  const getMembersByRole = useCallback(
    (slug, role) => {
      const allMembers = memberDirectory.get(slug) || []
      return allMembers.filter((member) => member.role === role)
    },
    [memberDirectory]
  )

  const subscribe = useCallback((slug) => {
    let created = false
    const userId = getCurrentUserIdentity().id

    setSubscriptionsByUser((prev) => {
      const userSubs = prev.get(userId) || new Set()
      if (userSubs.has(slug)) return prev
      
      const next = new Map(prev)
      const newUserSubs = new Set(userSubs)
      newUserSubs.add(slug)
      next.set(userId, newUserSubs)
      writeSubscriptionsByUser(next)
      created = true
      return next
    })

    if (created) {
      setCounts((prev) => {
        const next = new Map(prev)
        next.set(slug, Number(next.get(slug) ?? 0) + 1)
        writeCounts(next)
        return next
      })

      logUserActivity({
        type: 'newsletter_subscription',
        label: "a active un abonnement newsletter",
        detail: `Organisation: ${slug}`,
      })
    }
  }, [])

  const unsubscribe = useCallback((slug) => {
    let removed = false
    const userId = getCurrentUserIdentity().id

    setSubscriptionsByUser((prev) => {
      const userSubs = prev.get(userId) || new Set()
      if (!userSubs.has(slug)) return prev
      
      const next = new Map(prev)
      const newUserSubs = new Set(userSubs)
      newUserSubs.delete(slug)
      next.set(userId, newUserSubs)
      writeSubscriptionsByUser(next)
      removed = true
      return next
    })

    if (removed) {
      setCounts((prev) => {
        const current = Number(prev.get(slug) ?? 0)
        if (current <= 0) return prev
        const next = new Map(prev)
        next.set(slug, current - 1)
        writeCounts(next)
        return next
      })

      logUserActivity({
        type: 'newsletter_unsubscription',
        label: "a desactive un abonnement newsletter",
        detail: `Organisation: ${slug}`,
      })
    }
  }, [])

  const joinAsMember = useCallback((slug) => {
    if (!isConnected) return

    const identity = getCurrentUserIdentity()
    let created = false

    setMembershipsByUser((prev) => {
      const userMemberships = prev.get(identity.id) || new Set()
      if (userMemberships.has(slug)) return prev
      
      const next = new Map(prev)
      const newUserMemberships = new Set(userMemberships)
      newUserMemberships.add(slug)
      next.set(identity.id, newUserMemberships)
      writeMembershipsByUser(next)
      created = true
      return next
    })

    if (created) {
      setMemberCounts((prev) => {
        const next = new Map(prev)
        next.set(slug, Number(next.get(slug) ?? 0) + 1)
        writeMemberCounts(next)
        return next
      })

      setMemberDirectory((prev) => {
        const next = new Map(prev)
        const current = next.get(slug) || []
        const exists = current.some((member) => member.id === identity.id || (identity.email && member.email === identity.email))
        if (!exists) {
          current.push({
            id: identity.id,
            name: identity.name,
            email: identity.email,
            role: identity.role || 'member',
            joinedAt: new Date().toISOString(),
          })
          next.set(slug, current)
          writeMemberDirectory(next)
        }
        return next
      })
    }
  }, [isConnected])

  const leaveAsMember = useCallback((slug) => {
    if (!isConnected) return

    const identity = getCurrentUserIdentity()
    let removed = false

    setMembershipsByUser((prev) => {
      const userMemberships = prev.get(identity.id) || new Set()
      if (!userMemberships.has(slug)) return prev
      
      const next = new Map(prev)
      const newUserMemberships = new Set(userMemberships)
      newUserMemberships.delete(slug)
      next.set(identity.id, newUserMemberships)
      writeMembershipsByUser(next)
      removed = true
      return next
    })

    if (removed) {
      setMemberCounts((prev) => {
        const current = Number(prev.get(slug) ?? 0)
        if (current <= 0) return prev
        const next = new Map(prev)
        next.set(slug, current - 1)
        writeMemberCounts(next)
        return next
      })
    }
  }, [isConnected])

  const permissions = useMemo(
    () => getRolePermissions(currentRole, isConnected),
    [currentRole, isConnected]
  )

  const can = useCallback(
    (permission) => hasRolePermission(currentRole, permission, isConnected),
    [currentRole, isConnected]
  )

  const value = useMemo(
    () => ({
      isConnected,
      currentRole,
      permissions,
      can,
      isSubscribed,
      getSubscriberCount,
      subscribe,
      unsubscribe,
      isMember,
      hasAnyMembership,
      getMemberCount,
      getMembers,
      getMembersByRole,
      joinAsMember,
      leaveAsMember,
    }),
    [
      isConnected,
      currentRole,
      permissions,
      can,
      isSubscribed,
      getSubscriberCount,
      subscribe,
      unsubscribe,
      isMember,
      hasAnyMembership,
      getMemberCount,
      getMembers,
      getMembersByRole,
      joinAsMember,
      leaveAsMember,
    ]
  )

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  )
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionsContext)
  if (!ctx) throw new Error('useSubscriptions doit être utilisé dans SubscriptionsProvider')
  return ctx
}
