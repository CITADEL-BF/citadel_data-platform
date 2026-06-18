import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoleDetails } from '../../app/auth/roles'
import { useSubscriptions } from '../../app/subscriptions/SubscriptionsContext'
import { useOrganizationsContent } from '../../features/organizations/organizationsData'
import { fetchUserActivityFeed } from '../../app/auth/supabaseActivity'
import {
  cancelCollaboratorInvitation,
  decideRequest,
  fetchCollaboratorsForAdmin,
  fetchManagedDatasetsForCurrentUser,
  fetchPendingCollaboratorInvitations,
  fetchRequestsForDashboard,
  inviteOrPromoteCollaborator,
  setCollaboratorState,
  setPlatformRole,
} from '../../app/dashboard/supabaseDashboard'
import './DashboardPage.css'

const BASE_TABS = [
  { key: 'feed', label: "Fil d'actualites" },
  { key: 'datasets', label: 'Mes ensembles de donnees' },
  { key: 'organizations', label: 'Mes organisations' },
  { key: 'requests', label: 'Demandes' },
]

function readCurrentUser() {
  try {
    const raw = localStorage.getItem('citadel_user')
    if (!raw) return { id: '', email: '' }
    const parsed = JSON.parse(raw)
    return {
      id: String(parsed.id || parsed.userId || ''),
      email: String(parsed.email || '').trim().toLowerCase(),
    }
  } catch {
    return { id: '', email: '' }
  }
}

function formatRelative(isoValue) {
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return 'il y a quelques instants'

  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (abs < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
  if (abs < day) return rtf.format(Math.round(diffMs / hour), 'hour')
  if (abs < month) return rtf.format(Math.round(diffMs / day), 'day')
  if (abs < year) return rtf.format(Math.round(diffMs / month), 'month')
  return rtf.format(Math.round(diffMs / year), 'year')
}

function mapRoleLabel(role) {
  const raw = String(role || '').toLowerCase()
  if (raw === 'admin') return 'Admin'
  if (raw === 'editor') return 'Editeur'
  return 'Membre'
}

export default function DashboardPage() {
  const {
    currentRole,
    isConnected,
    isMember,
    getMembers,
    getMembersByRole,
    leaveAsMember,
  } = useSubscriptions()
  const { content } = useOrganizationsContent()
  const [activeTab, setActiveTab] = useState('feed')
  const [feedItems, setFeedItems] = useState([])
  const [managedDatasets, setManagedDatasets] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [openRequests, setOpenRequests] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [orgStatusMap, setOrgStatusMap] = useState({})
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteNotice, setInviteNotice] = useState('')

  const role = useMemo(() => getRoleDetails(currentRole, isConnected), [currentRole, isConnected])
  const currentUser = useMemo(() => readCurrentUser(), [])
  const isCollaborator = useMemo(() => String(currentRole || '') === 'sys_collaborator', [currentRole])
  const isSystemAdmin = useMemo(() => String(currentRole || '') === 'sys_admin', [currentRole])
  const canReviewRequests = useMemo(() => ['sys_collaborator', 'sys_admin'].includes(String(currentRole || '')), [currentRole])
  const tabs = useMemo(() => {
    const next = [...BASE_TABS]
    if (isCollaborator) {
      next.push({ key: 'collaborator_data_viz', label: 'Gestion donnees & visualisations' })
    }
    if (isSystemAdmin) {
      next.push({ key: 'admin_users_orgs', label: 'Gestion utilisateurs et organisations' })
    }
    return next
  }, [isCollaborator, isSystemAdmin])

  const myOrganizations = useMemo(() => {
    const orgs = Array.isArray(content?.organizations) ? content.organizations : []

    return orgs
      .filter((org) => isMember(org.slug))
      .map((org) => {
        const members = getMembers(org.slug)
        const me = members.find((member) => {
          const sameId = currentUser.id && String(member.id || '') === currentUser.id
          const sameEmail = currentUser.email && String(member.email || '').trim().toLowerCase() === currentUser.email
          return sameId || sameEmail
        })

        return {
          slug: org.slug,
          name: org.name,
          role: mapRoleLabel(me?.role),
          joinedAt: me?.joinedAt,
        }
      })
  }, [content, isMember, getMembers, currentUser.id, currentUser.email])

  useEffect(() => {
    fetchUserActivityFeed({ excludeTypes: ['connexion'], limit: 25 })
      .then((items) => setFeedItems(Array.isArray(items) ? items : []))
      .catch(() => setFeedItems([]))
  }, [])

  useEffect(() => {
    fetchManagedDatasetsForCurrentUser()
      .then((items) => setManagedDatasets(Array.isArray(items) ? items : []))
      .catch(() => setManagedDatasets([]))
  }, [])

  const refreshCollaborators = useCallback(() => {
    if (!isSystemAdmin) {
      setCollaborators([])
      setPendingInvitations([])
      return
    }

    Promise.all([
      fetchCollaboratorsForAdmin(),
      fetchPendingCollaboratorInvitations(),
    ])
      .then(([collabs, invites]) => {
        setCollaborators(Array.isArray(collabs) ? collabs : [])
        setPendingInvitations(Array.isArray(invites) ? invites : [])
      })
      .catch(() => setCollaborators([]))
  }, [isSystemAdmin])

  useEffect(() => {
    refreshCollaborators()
  }, [refreshCollaborators])

  const toggleOrganizationStatus = useCallback((slug, state) => {
    setOrgStatusMap((prev) => ({ ...prev, [slug]: state }))
  }, [])

  const handleCollaboratorAction = useCallback((collaboratorId, action) => {
    const actionMap = {
      suspend: () => setCollaboratorState({ userId: collaboratorId, state: 'suspended' }),
      unsuspend: () => setCollaboratorState({ userId: collaboratorId, state: 'active' }),
      promote_admin: () => setPlatformRole({ userId: collaboratorId, role: 'sys_admin' }),
      revoke_role: () => setPlatformRole({ userId: collaboratorId, role: 'citizen' }),
      name_collaborator: () => setPlatformRole({ userId: collaboratorId, role: 'sys_collaborator' }),
      delete: () => setPlatformRole({ userId: collaboratorId, role: 'citizen' }),
    }

    const runner = actionMap[action]
    if (!runner) return

    runner().then((ok) => {
      if (ok) refreshCollaborators()
    })
  }, [refreshCollaborators])

  const handleInviteCollaborator = useCallback((event) => {
    event.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteNotice('Veuillez renseigner une adresse email valide.')
      return
    }

    setInviteBusy(true)
    setInviteNotice('')

    inviteOrPromoteCollaborator({ email })
      .then((result) => {
        if (!result?.ok) {
          setInviteNotice("Impossible de traiter l'ajout du collaborateur.")
          return
        }

        if (result.mode === 'promoted') {
          setInviteNotice('Compte existant detecte: role collaborateur attribue.')
        } else if (result.mode === 'invited') {
          setInviteNotice('Invitation creee. Le collaborateur n a pas encore de compte.')
        } else if (result.mode === 'already_pending') {
          setInviteNotice('Une invitation en attente existe déjà pour cet email.')
        }

        setInviteEmail('')
        refreshCollaborators()
      })
      .finally(() => {
        setInviteBusy(false)
      })
  }, [inviteEmail, refreshCollaborators])

  const handleCancelInvitation = useCallback((invitationId) => {
    cancelCollaboratorInvitation({ invitationId })
      .then((ok) => {
        if (ok) refreshCollaborators()
      })
  }, [refreshCollaborators])

  const refreshRequests = useCallback(() => {
    fetchRequestsForDashboard({ reviewerView: canReviewRequests })
      .then((payload) => {
        setPendingRequests(payload.pending || [])
        setOpenRequests(payload.open || [])
      })
      .catch(() => {
        setPendingRequests([])
        setOpenRequests([])
      })
  }, [canReviewRequests])

  useEffect(() => {
    refreshRequests()
  }, [refreshRequests])

  const handleRequestDecision = useCallback((id, status) => {
    decideRequest({ requestId: id, status })
      .then((ok) => {
        if (ok) refreshRequests()
      })
  }, [refreshRequests])

  const renderFeedTab = () => (
    <>
      <div className="dashboard-block__head">
        <h2>Fil d'actualites</h2>
        <p>Le fil d'actualités affiche l'activité récente sur le portail, notamment les mises à jour des jeux de données que vous suivez et les modifications apportées.</p>
      </div>
      {feedItems.length === 0 ? (
        <p className="dashboard-empty-note">Aucune actualite recente pour le moment.</p>
      ) : (
        <ul className="dashboard-feed-list">
          {feedItems.map((item) => (
            <li key={item.id} className="dashboard-feed-item">
              <div>
                <p className="dashboard-feed-item__label">{item.message || 'Mise à jour récente'}</p>
                {item.detail && <p className="dashboard-feed-item__detail">{item.detail}</p>}
              </div>
              <time dateTime={item.at}>{formatRelative(item.at)}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const renderDatasetsTab = () => (
    <>
      <div className="dashboard-block__head">
        <h2>Mes ensembles de donnees</h2>
        <p>Affiche tous les jeux de données que vous gérez sur le portail, ainsi que leur état de mise à jour.</p>
      </div>
      {managedDatasets.length === 0 ? (
        <div className="dashboard-empty-block">
          <p>Nous n'avons pas trouve de jeux de donnees. Rejoignez une organisation gerer vos propres jeux de donnees.</p>
        </div>
      ) : (
        <ul className="dashboard-datasets-list">
          {managedDatasets.map((dataset) => {
            const isLate = dataset.nextExpectedUpdate && new Date(dataset.nextExpectedUpdate) < new Date()
            return (
              <li key={dataset.id} className="dashboard-dataset-item">
                <div>
                  <h3>{dataset.title}</h3>
                  <p>Periode de l'ensemble de donnees: {dataset.period || 'Non renseignée'}</p>
                  <p>
                    Fréquence de mise à jour prévue: {dataset.frequency || 'Non renseignée'}
                    {isLate ? <span className="dashboard-warning"> - Date de mise à jour dépassée</span> : null}
                  </p>
                </div>
                <div className="dashboard-dataset-item__actions">
                  <Link to="/contribution">Modifier</Link>
                  <button type="button">Supprimer</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  const renderOrganizationsTab = () => (
    <>
      <div className="dashboard-block__head">
        <h2>Mes organisations</h2>
        <p>Liste des organisations dont vous etes membre.</p>
      </div>
      {myOrganizations.length === 0 ? (
        <div className="dashboard-empty-block">
          <p>Pour partager des donnees, vous devez associer votre compte a une organisation existante ou demander la creation d'une nouvelle organisation.</p>
          <p>Votre demande d’association de votre compte à une organisation existante sera évaluée par l’administrateur de cette organisation. Vous devrez justifier votre demande.</p>
          <Link to="/organisations/adhesion-organisation" className="btn-primary">Rejoindre une organisation</Link>
        </div>
      ) : (
        <ul className="dashboard-org-list">
          {myOrganizations.map((org) => (
            <li key={org.slug} className="dashboard-org-item">
              <div>
                <h3>{org.name}</h3>
                <p>Role: {org.role}</p>
                <p>Rejoint: {org.joinedAt ? formatRelative(org.joinedAt) : 'Date non renseignée'}</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => leaveAsMember(org.slug)}>
                Quitter l'organisation
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const renderRequestSection = (title, items, open = false) => (
    <section className="dashboard-requests-group" aria-label={title}>
      <h3>{title} [{items.length}]</h3>
      {items.length === 0 ? (
        <p className="dashboard-empty-note">Aucune demande n'a été trouvée.</p>
      ) : (
        <ul className="dashboard-request-list">
          {items.map((request) => (
            <li key={request.id} className="dashboard-request-item">
              <div>
                <p className="dashboard-request-item__title">{request.title}</p>
                <p className="dashboard-request-item__detail">{request.detail}</p>
              </div>
              {open ? (
                <span className={`dashboard-request-status dashboard-request-status--${request.status || 'accepte'}`}>
                  {request.status === 'refuse' ? 'Refusee' : 'Acceptee'}
                </span>
              ) : (
                <div className="dashboard-request-actions">
                  <button type="button" onClick={() => handleRequestDecision(request.id, 'accepte')}>Accepter</button>
                  <button type="button" onClick={() => handleRequestDecision(request.id, 'refuse')}>Refuser</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  const renderRequestsTab = () => {
    if (!canReviewRequests) {
      return (
        <>
          <div className="dashboard-block__head">
            <h2>Demandes</h2>
            <p>L'onglet existe mais reste vide pour votre profil.</p>
          </div>
          <div className="dashboard-requests-shell">
            <h3>Mes demandes [0]</h3>
            {renderRequestSection('Nouveau', [])}
            {renderRequestSection('Ouvrir', [], true)}
          </div>
        </>
      )
    }

    return (
      <>
        <div className="dashboard-block__head">
          <h2>Demandes</h2>
          <p>Gérez les demandes d'accès aux données, d'adhésion organisation et de création d'organisation.</p>
        </div>
        <div className="dashboard-requests-shell">
          <h3>Mes demandes [{pendingRequests.length + openRequests.length}]</h3>
          {renderRequestSection('Nouveau', pendingRequests)}
          {renderRequestSection('Ouvrir', openRequests, true)}
        </div>
      </>
    )
  }

  const renderCollaboratorDataVizTab = () => (
    <>
      <div className="dashboard-block__head">
        <h2>Gestion donnees & visualisations</h2>
        <p>Cet onglet est visible pour le collaborateur et regroupera les sections de pilotage des donnees en V2.</p>
      </div>
      <div className="dashboard-empty-block">
        <p>Fonctionalite a venir</p>
      </div>
    </>
  )

  const renderAdminUsersOrgsTab = () => {
    const organizations = Array.isArray(content?.organizations) ? content.organizations : []

    return (
      <>
        <div className="dashboard-block__head">
          <h2>Gestion utilisateurs et organisations</h2>
          <p>Sections admin système pour la gestion des collaborateurs et de l’arborescence des organisations.</p>
        </div>

        <section className="dashboard-admin-section">
          <h3>Collaborateurs</h3>
          <form className="dashboard-invite-form" onSubmit={handleInviteCollaborator}>
            <label htmlFor="invite-collaborator-email">Ajouter un collaborateur</label>
            <div className="dashboard-invite-form__row">
              <input
                id="invite-collaborator-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="email@organisation.bf"
              />
              <button type="submit" disabled={inviteBusy}>{inviteBusy ? 'Traitement...' : 'Ajouter'}</button>
            </div>
            {inviteNotice && <p className="dashboard-empty-note">{inviteNotice}</p>}
          </form>

          {pendingInvitations.length > 0 && (
            <section className="dashboard-admin-subsection" aria-label="Invitations en attente">
              <h4>Invitations en attente ({pendingInvitations.length})</h4>
              <ul className="dashboard-request-list">
                {pendingInvitations.map((invite) => (
                  <li key={invite.id} className="dashboard-request-item">
                    <div>
                      <p className="dashboard-request-item__title">{invite.email}</p>
                      <p className="dashboard-request-item__detail">Invitation en attente</p>
                    </div>
                    <div className="dashboard-request-actions">
                      <button type="button" onClick={() => handleCancelInvitation(invite.id)}>Supprimer</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {collaborators.length === 0 ? (
            <p className="dashboard-empty-note">Aucun collaborateur trouve.</p>
          ) : (
            <ul className="dashboard-request-list">
              {collaborators.map((item) => (
                <li key={item.id} className="dashboard-request-item">
                  <div>
                    <p className="dashboard-request-item__title">{item.name}</p>
                    <p className="dashboard-request-item__detail">{item.email || 'Email non renseigné'} • État: {item.state}</p>
                  </div>
                  <div className="dashboard-request-actions">
                    <button type="button" onClick={() => handleCollaboratorAction(item.id, 'suspend')}>Suspendre</button>
                    <button type="button" onClick={() => handleCollaboratorAction(item.id, 'delete')}>Supprimer</button>
                    <button type="button" onClick={() => handleCollaboratorAction(item.id, 'name_collaborator')}>Nommer</button>
                    <button type="button" onClick={() => handleCollaboratorAction(item.id, 'revoke_role')}>Revoquer role</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-admin-section">
          <h3>Organisations</h3>
          <ul className="dashboard-org-tree">
            {organizations.map((org) => {
              const orgAdmins = getMembersByRole(org.slug, 'admin')
              const state = orgStatusMap[org.slug] || 'active'

              return (
                <li key={org.slug} className="dashboard-org-tree__item">
                  <div className="dashboard-org-tree__head">
                    <strong>{org.name}</strong>
                    <div className="dashboard-request-actions">
                      <button type="button" onClick={() => toggleOrganizationStatus(org.slug, 'deleted')}>Supprimer</button>
                      {state === 'active' ? (
                        <button type="button" onClick={() => toggleOrganizationStatus(org.slug, 'disabled')}>Désactiver</button>
                      ) : (
                        <button type="button" onClick={() => toggleOrganizationStatus(org.slug, 'active')}>Activer</button>
                      )}
                    </div>
                  </div>

                  <details>
                    <summary>Admins de l'organisation ({orgAdmins.length})</summary>
                    {orgAdmins.length === 0 ? (
                      <p className="dashboard-empty-note">Aucun admin d'organisation reference.</p>
                    ) : (
                      <ul className="dashboard-org-tree__admins">
                        {orgAdmins.map((admin) => (
                          <li key={admin.id || admin.email || admin.name}>
                            <span>{admin.name || admin.email || 'Admin organisation'}</span>
                            <div className="dashboard-request-actions">
                              <button type="button">Suspendre</button>
                              <button type="button">Revoquer role</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                </li>
              )
            })}
          </ul>
        </section>
      </>
    )
  }

  return (
    <section className="dashboard section">
      <div className="container dashboard__container">
        <header className="dashboard__hero">
          <h1>Tableau de bord utilisateur</h1>
          <p className="dashboard__subtitle">Profil: <span className="dashboard__role-badge">{role.label}</span></p>

          <div className="dashboard__hero-actions">
            <Link to="/dashboard/parametres" className="btn-ghost">Paramètres du compte</Link>
          </div>
        </header>

        <section className="dashboard-block">
          <section className="dashboard-tabs" aria-label="Navigation du dashboard">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </section>

          <section className="dashboard-tab-panel" aria-live="polite">
            {activeTab === 'feed' && renderFeedTab()}
            {activeTab === 'datasets' && renderDatasetsTab()}
            {activeTab === 'organizations' && renderOrganizationsTab()}
            {activeTab === 'requests' && renderRequestsTab()}
            {activeTab === 'collaborator_data_viz' && renderCollaboratorDataVizTab()}
            {activeTab === 'admin_users_orgs' && isSystemAdmin && renderAdminUsersOrgsTab()}
          </section>
        </section>
      </div>
    </section>
  )
}
