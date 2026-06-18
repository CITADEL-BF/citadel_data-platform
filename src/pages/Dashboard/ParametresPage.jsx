import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSubscriptions } from '../../app/subscriptions/SubscriptionsContext'
import { getRoleDetails } from '../../app/auth/roles'
import ProfilSection from './sections/ProfilSection'
import NotificationsSection from './sections/NotificationsSection'
import ActiviteSection from './sections/ActiviteSection'
import { fetchUserActivityFeed, logUserActivity } from '../../app/auth/supabaseActivity'
import './DashboardPage.css'
import './ParametresPage.css'

const TABS = [
  {
    key: 'profil',
    label: 'Profil & Mot de passe',
  },
  {
    key: 'notifications',
    label: 'Notifications',
  },
  {
    key: 'activite',
    label: "Flux d'activite",
  },
]

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem('citadel_user')
    if (!raw) return null
    const p = JSON.parse(raw)
    return {
      name: `${p.firstName || p.prenom || ''} ${p.lastName || p.nom || ''}`.trim() || p.username || p.name || 'Utilisateur',
      email: p.email || '',
      apropos: p.apropos || '',
      connectedAt: p.at || new Date().toISOString(),
    }
  } catch { return null }
}

export default function ParametresPage() {
  const { currentRole, isConnected } = useSubscriptions()
  const role = useMemo(() => getRoleDetails(currentRole, isConnected), [currentRole, isConnected])

  const [activeTab, setActiveTab] = useState('profil')
  const [user, setUser] = useState(readUserFromStorage)
  const [savedOk, setSavedOk] = useState(false)
  const [activityEntries, setActivityEntries] = useState([])

  const refreshActivity = useCallback(async () => {
    const entries = await fetchUserActivityFeed({
      excludeTypes: ['connexion'],
      limit: 80,
    })
    setActivityEntries(entries)
  }, [])

  useEffect(() => {
    refreshActivity()
  }, [refreshActivity])

  const handleSaveProfil = useCallback((updated) => {
    setUser(updated)
    const raw = localStorage.getItem('citadel_user')
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem('citadel_user', JSON.stringify({
      ...existing,
      name: updated.name,
      email: updated.email,
      apropos: updated.apropos,
    }))

    logUserActivity({
      type: 'profile_update',
      label: 'a mis à jour son profil',
      detail: null,
    }).then(() => refreshActivity())

    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3500)
  }, [refreshActivity])

  return (
    <div className="parametres">
      <div className="parametres__hero">
        <div className="container parametres__hero-inner">
          <div className="parametres__hero-body">
            <div>
              <p className="parametres__eyebrow">{role.profile} — {role.label}</p>
              <h1>Paramètres du compte</h1>
              <p className="parametres__subtitle">
                Gérez votre profil, vos notifications et consultez votre activité.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container parametres__body">
        <section className="parametres__tabs" aria-label="Navigation des paramètres">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </section>

        {savedOk && (
          <p className="parametres__saved" role="status">Modifications enregistrées ✓</p>
        )}

        <section className="parametres__content" aria-live="polite">
          <div className="parametres__content-head">
            <h2>{TABS.find((tab) => tab.key === activeTab)?.label || 'Paramètres'}</h2>
            <Link to="/dashboard" className="parametres__back-link">
              Retour au dashboard
            </Link>
          </div>

          {activeTab === 'profil' && (
            <ProfilSection user={user} onSave={handleSaveProfil} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsSection />
          )}
          {activeTab === 'activite' && (
            <ActiviteSection entries={activityEntries} displayName={user?.name} connectedAt={user?.connectedAt} />
          )}
        </section>
      </div>
    </div>
  )
}
