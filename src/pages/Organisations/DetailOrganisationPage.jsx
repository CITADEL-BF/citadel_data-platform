import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSubscriptions } from '../../app/subscriptions/SubscriptionsContext'
import { DOMAIN_STYLES } from '../../features/datasets/catalogueData'
import {
  getOrganizationBySlug,
  getOrganizationDatasets,
  useOrganizationsContent,
} from '../../features/organizations/organizationsData'
import './DetailOrganisationPage.css'

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
}

function getDomainStyle(domain) {
  return DOMAIN_STYLES[domain] || DOMAIN_STYLES.population
}

function formatDateFR(dateValue) {
  if (!dateValue) return 'Date non renseignée'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Date non renseignée'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function DetailOrganisationPage() {
  const { organizationSlug } = useParams()
  const { content, loading } = useOrganizationsContent()
  const {
    isConnected,
    isSubscribed,
    getSubscriberCount,
    subscribe,
    isMember,
    getMemberCount,
    getMembers,
    getMembersByRole,
    joinAsMember,
  } = useSubscriptions()
  const organization = useMemo(() => getOrganizationBySlug(content, organizationSlug), [content, organizationSlug])
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [activeTab, setActiveTab] = useState('datasets')
  const datasets = useMemo(() => getOrganizationDatasets(content, organizationSlug), [content, organizationSlug])
  const filteredDatasets = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    const inSearch = datasets.filter((dataset) => {
      if (!normalized) return true
      return (
        dataset.title.toLowerCase().includes(normalized) ||
        dataset.description.toLowerCase().includes(normalized) ||
        dataset.domainLabel.toLowerCase().includes(normalized)
      )
    })

    return [...inSearch].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'domain') return a.domainLabel.localeCompare(b.domainLabel)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [datasets, query, sortBy])
  const totalRows = useMemo(() => datasets.reduce((sum, item) => sum + Number(item.rows || 0), 0), [datasets])

  const subscribed = isSubscribed(organizationSlug)
  const member = isMember(organizationSlug)
  const subscriberCount = getSubscriberCount(organizationSlug)
  const memberCount = getMemberCount(organizationSlug)
  const members = useMemo(() => getMembers(organizationSlug), [getMembers, organizationSlug])
  const adminMembers = useMemo(() => getMembersByRole(organizationSlug, 'admin'), [getMembersByRole, organizationSlug])
  const editorMembers = useMemo(() => getMembersByRole(organizationSlug, 'editor'), [getMembersByRole, organizationSlug])
  const regularMembers = useMemo(() => getMembersByRole(organizationSlug, 'member'), [getMembersByRole, organizationSlug])

  // Rediriger vers datasets si l'utilisateur n'est pas connecté et tente d'accéder à l'onglet membres
  useEffect(() => {
    if (!isConnected && activeTab === 'members') {
      setActiveTab('datasets')
    }
  }, [isConnected, activeTab])

  const activityItems = useMemo(() => {
    const items = []

    items.push({
      id: 'feed-members',
      title: `${formatNumber(memberCount)} membres rattachés à l’organisation`,
      date: null,
      category: 'Communautaire',
    })

    items.push({
      id: 'feed-subscribers',
      title: `${formatNumber(subscriberCount)} abonnes recoivent les notifications`,
      date: null,
      category: 'Newsletter',
    })

    const latestDatasets = [...datasets]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4)

    latestDatasets.forEach((dataset) => {
      items.push({
        id: `dataset-${dataset.id}`,
        title: `${dataset.title} mis à jour`,
        date: dataset.updatedAt,
        category: dataset.domainLabel,
      })
    })

    return items
  }, [datasets, memberCount, subscriberCount])

  const statisticsByDomain = useMemo(() => {
    const counters = new Map()

    datasets.forEach((dataset) => {
      const previous = counters.get(dataset.domainLabel) || { datasets: 0, rows: 0 }
      counters.set(dataset.domainLabel, {
        datasets: previous.datasets + 1,
        rows: previous.rows + Number(dataset.rows || 0),
      })
    })

    return [...counters.entries()].map(([domainLabel, values]) => ({
      domainLabel,
      datasets: values.datasets,
      rows: values.rows,
    }))
  }, [datasets])

  const handleNotificationClick = useCallback(() => {
    setFeedbackMessage('')
    setNewsletterError('')
    if (!isConnected) setNewsletterEmail('')
    setNewsletterModalOpen(true)
  }, [isConnected])

  const closeNewsletterModal = useCallback(() => {
    setNewsletterModalOpen(false)
    setNewsletterError('')
  }, [])

  const closeMemberModal = useCallback(() => {
    setMemberModalOpen(false)
  }, [])

  const submitNewsletter = useCallback(() => {
    if (subscribed) {
      setFeedbackMessage('Vous recevez déjà les notifications de cette organisation.')
      setNewsletterModalOpen(false)
      return
    }

    if (!isConnected) {
      const email = newsletterEmail.trim().toLowerCase()
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      if (!isValidEmail) {
        setNewsletterError('Veuillez renseigner une adresse email valide.')
        return
      }
    }

    subscribe(organizationSlug)
    setFeedbackMessage('Inscription aux notifications enregistree avec succes.')
    setNewsletterModalOpen(false)
  }, [subscribed, isConnected, newsletterEmail, subscribe, organizationSlug])

  const submitMembership = useCallback(() => {
    if (member) {
      setMemberModalOpen(false)
      return
    }

    joinAsMember(organizationSlug)
    setFeedbackMessage('Votre demande d’adhésion a été enregistrée.')
    setMemberModalOpen(false)
  }, [member, joinAsMember, organizationSlug])

  function getAvatarText(item) {
    const source = String(item?.shortName || item?.name || '').trim()
    if (!source) return 'ORG'
    if (source.includes('/')) {
      return source
        .split('/')
        .map((part) => part.trim().charAt(0).toUpperCase())
        .join('')
        .slice(0, 3)
    }
    const words = source.split(/\s+/).filter(Boolean)
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('')
  }

  if (!organizationSlug) {
    return <Navigate to="/organisations" replace />
  }

  if (loading && !organization) {
    return (
      <section className="detail-organisation detail-organisation--missing">
        <div className="container">
          <h1>Chargement en cours</h1>
          <p>La fiche organisation est en cours de préparation.</p>
          <Link to="/organisations">Retour a la liste des organisations</Link>
        </div>
      </section>
    )
  }

  if (!organization) {
    return (
      <section className="detail-organisation detail-organisation--missing">
        <div className="container">
          <h1>Organisation introuvable</h1>
          <p>La fiche demandée n’existe pas ou a été déplacée.</p>
          <Link to="/organisations">Retour a la liste des organisations</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="detail-organisation">
      <div className="container detail-organisation-shell">
        <header className="detail-org-hero">
          <div className="detail-org-hero__logo-wrap">
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-org-hero__logo-link"
              aria-label={`Visiter le site de ${organization.name}`}
            >
              {organization.logo ? (
                <img src={organization.logo} alt={`Logo ${organization.shortName || organization.name}`} />
              ) : (
                <span className="detail-org-avatar" aria-hidden="true">
                  {getAvatarText(organization)}
                </span>
              )}
            </a>
          </div>

          <div className="detail-org-hero__content">
            <div className="detail-org-hero__head">
              <h1>{organization.name}</h1>
             {/* {organization.verified && <span className="detail-org-verified">Vérifié</span>} */}
            </div>
            <p>{organization.longDescription}</p>

            <div className="detail-org-actions">
              <button
                type="button"
                className={`detail-org-subscribe-btn${subscribed ? ' is-subscribed' : ''}`}
                onClick={handleNotificationClick}
                aria-pressed={subscribed}
              >
                {subscribed ? (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span>Se desabonner</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span>Recevoir les notifications</span>
                  </>
                )}
              </button>

              {isConnected && (
                <button
                  type="button"
                  className={`detail-org-membership-btn${member ? ' is-member' : ''}`}
                  onClick={() => setMemberModalOpen(true)}
                >
                  {member ? 'Demande d’adhésion envoyée' : 'Demande d’adhésion'}
                </button>
              )}
            </div>

            {feedbackMessage && <p className="detail-org-feedback-note">{feedbackMessage}</p>}

            <p className="detail-org-inline-counts">
              <strong>{formatNumber(subscriberCount)}</strong> abonnes
              <span aria-hidden="true">•</span>
              <strong>{formatNumber(memberCount)}</strong> membres
            </p>
          </div>
        </header>

        <section className="detail-org-tabs" aria-label="Navigation des blocs organisation">
          <button type="button" className={activeTab === 'datasets' ? 'is-active' : ''} onClick={() => setActiveTab('datasets')}>
            Ensemble de donnees
          </button>
          {isConnected && (
            <button type="button" className={activeTab === 'members' ? 'is-active' : ''} onClick={() => setActiveTab('members')}>
              Membres
            </button>
          )}
          <button type="button" className={activeTab === 'activity' ? 'is-active' : ''} onClick={() => setActiveTab('activity')}>
            Flux d’activité
          </button>
          <button type="button" className={activeTab === 'stats' ? 'is-active' : ''} onClick={() => setActiveTab('stats')}>
            Statistiques
          </button>
        </section>

        <section className="detail-org-block" aria-live="polite">
          {activeTab === 'datasets' && (
            <section className="detail-org-catalogue" aria-label="Catalogue des jeux de donnees">
              <div className="detail-org-catalogue__toolbar">
                <h2>Ensemble de donnees</h2>
                <div className="detail-org-catalogue__actions">
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filtrer par titre, description ou domaine"
                    aria-label="Filtrer les jeux de donnees"
                  />

                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Trier les jeux de donnees">
                    <option value="updatedAt">Trier: mise à jour</option>
                    <option value="title">Trier: nom</option>
                    <option value="domain">Trier: domaine</option>
                  </select>
                </div>
              </div>

              <div className="detail-org-catalogue__columns" aria-hidden="true">
                <span>Nom du jeu de donnees</span>
                <span>Domaine</span>
                <span>Mise à jour</span>
                <span>Format</span>
              </div>

              <div className="detail-org-catalogue__card">
                <div className="detail-org-catalogue__table-wrap">
                  <table>
                    <tbody>
                      {filteredDatasets.map((dataset) => {
                        const style = getDomainStyle(dataset.domain)
                        return (
                          <tr key={dataset.id}>
                            <td>
                              <Link to={`/donnees/${dataset.id}`} className="detail-org-dataset-link">
                                <strong>{dataset.title}</strong>
                              </Link>
                              <p>{dataset.description}</p>
                            </td>
                            <td>{dataset.domainLabel}</td>
                            <td>{dataset.updatedLabel}</td>
                            <td>
                              <span style={{ background: style.bg, color: style.color }}>{dataset.format}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredDatasets.length === 0 && <p className="detail-org-empty">Aucun jeu ne correspond au filtre saisi.</p>}

                <footer className="detail-org-catalogue__footer">
                  <span>{formatNumber(totalRows)} lignes recensees au total</span>
                </footer>
              </div>
            </section>
          )}

          {activeTab === 'members' && (
            <section className="detail-org-members" aria-label="Liste des membres">
              <h2>Membres de l’organisation</h2>
              <p className="detail-org-members__summary">{formatNumber(memberCount)} membres au total.</p>

              <div className="detail-org-members__section">
                <h3>Administrateurs</h3>
                {adminMembers.length > 0 ? (
                  <div className="detail-org-members__grid">
                    {adminMembers.map((item) => (
                      <article key={item.id} className="detail-org-member-card detail-org-member-card--admin">
                        <strong>{item.name || 'Administrateur'}</strong>
                        <span>{item.email || 'Email non public'}</span>
                        <small>{item.joinedAt ? `Depuis le ${formatDateFR(item.joinedAt)}` : 'Date d’adhésion non renseignée'}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="detail-org-members__empty">Aucun administrateur pour le moment.</p>
                )}
              </div>

              <div className="detail-org-members__section">
                <h3>Editeurs</h3>
                {editorMembers.length > 0 ? (
                  <div className="detail-org-members__grid">
                    {editorMembers.map((item) => (
                      <article key={item.id} className="detail-org-member-card detail-org-member-card--editor">
                        <strong>{item.name || 'Editeur'}</strong>
                        <span>{item.email || 'Email non public'}</span>
                        <small>{item.joinedAt ? `Depuis le ${formatDateFR(item.joinedAt)}` : 'Date d’adhésion non renseignée'}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="detail-org-members__empty">Aucun editeur pour le moment.</p>
                )}
              </div>

              <div className="detail-org-members__section">
                <h3>Membres</h3>
                {regularMembers.length > 0 ? (
                  <div className="detail-org-members__grid">
                    {regularMembers.map((item) => (
                      <article key={item.id} className="detail-org-member-card">
                        <strong>{item.name || 'Membre'}</strong>
                        <span>{item.email || 'Email non public'}</span>
                        <small>{item.joinedAt ? `Depuis le ${formatDateFR(item.joinedAt)}` : 'Date d’adhésion non renseignée'}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="detail-org-members__empty">Aucune demande d’adhésion pour le moment.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'activity' && (
            <section className="detail-org-activity" aria-label="Flux d’activité">
              <h2>Flux d’activité</h2>
              <ul className="detail-org-activity__list">
                {activityItems.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category}</span>
                    </div>
                    <small>{item.date ? formatDateFR(item.date) : 'À l’instant'}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'stats' && (
            <section className="detail-org-stats" aria-label="Statistiques de l’organisation">
              <h2>Statistiques</h2>

              <div className="detail-org-stats__kpis">
                <article>
                  <strong>{formatNumber(datasets.length)}</strong>
                  <span>Jeux de donnees</span>
                </article>
                <article>
                  <strong>{formatNumber(subscriberCount)}</strong>
                  <span>Abonnes newsletter</span>
                </article>
                <article>
                  <strong>{organization.updateFrequency}</strong>
                  <span>Fréquence de mise à jour</span>
                </article>
              </div>

              <div className="detail-org-stats__table">
                <h3>Repartition par domaine</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Domaine</th>
                      <th>Jeux</th>
                      <th>Lignes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statisticsByDomain.map((row) => (
                      <tr key={row.domainLabel}>
                        <td>{row.domainLabel}</td>
                        <td>{formatNumber(row.datasets)}</td>
                        <td>{formatNumber(row.rows)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      </div>

      {newsletterModalOpen && (
        <div className="detail-org-modal" role="dialog" aria-modal="true" aria-label="Notifications organisation">
          <div className="detail-org-modal__panel">
            <h2>Recevoir les notifications</h2>
            {isConnected ? (
              <p>Confirmez-vous vouloir recevoir les nouvelles publications de cette organisation ?</p>
            ) : (
              <>
                <p>Renseignez votre adresse email pour recevoir les nouvelles publications de cette organisation.</p>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => {
                    setNewsletterEmail(event.target.value)
                    if (newsletterError) setNewsletterError('')
                  }}
                  placeholder="nom@exemple.com"
                  aria-label="Adresse email"
                />
                {newsletterError && <span className="detail-org-modal__error">{newsletterError}</span>}
              </>
            )}

            <div className="detail-org-modal__actions">
              <button type="button" className="detail-org-modal__btn detail-org-modal__btn--ghost" onClick={closeNewsletterModal}>
                Annuler
              </button>
              <button type="button" className="detail-org-modal__btn" onClick={submitNewsletter}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {memberModalOpen && (
        <div className="detail-org-modal" role="dialog" aria-modal="true" aria-label="Demande d adhesion">
          <div className="detail-org-modal__panel">
            <h2>Demande d adhesion</h2>
            <p>
              {member
                ? 'Votre demande d’adhésion a déjà été enregistrée pour cette organisation.'
                : 'Confirmez-vous l’envoi de votre demande pour devenir membre de cette organisation ?'}
            </p>

            <div className="detail-org-modal__actions">
              <button type="button" className="detail-org-modal__btn detail-org-modal__btn--ghost" onClick={closeMemberModal}>
                Fermer
              </button>
              {!member && (
                <button type="button" className="detail-org-modal__btn" onClick={submitMembership}>
                  Envoyer la demande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
