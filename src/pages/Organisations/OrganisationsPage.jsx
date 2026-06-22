import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllOrganizations,
  getOrganizationDatasetCount,
  getOrganizationsPageContent,
  getOrganizationTypes,
  useOrganizationsContent,
} from '../../features/organizations/organizationsData'
import './OrganisationsPage.css'

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export default function OrganisationsPage() {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState('all')
  const { content, loading } = useOrganizationsContent()

  const organizations = useMemo(() => getAllOrganizations(content), [content])
  const organizationTypes = useMemo(() => getOrganizationTypes(content), [content])
  const page = useMemo(() => getOrganizationsPageContent(content), [content])

  const enriched = useMemo(
    () => organizations.map((item) => ({ ...item, datasetCount: getOrganizationDatasetCount(content, item.slug) })),
    [organizations, content]
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return enriched.filter((item) => {
      const inType = activeType === 'all' || item.type === activeType
      const inText =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.shortName.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)

      return inType && inText
    })
  }, [enriched, activeType, query])

  const totalDatasets = useMemo(
    () => enriched.reduce((sum, item) => sum + item.datasetCount, 0),
    [enriched]
  )

  const topOrganizations = useMemo(
    () => [...enriched].sort((a, b) => b.datasetCount - a.datasetCount).slice(0, 4),
    [enriched]
  )

  const maxDatasetCount = useMemo(
    () => topOrganizations.reduce((max, item) => Math.max(max, item.datasetCount), 0),
    [topOrganizations]
  )

  const impact = page.impact || { highlights: [] }

  function renderTemplate(template) {
    return String(template || '')
      .replace('{count}', formatNumber(enriched.length))
      .replace('{datasets}', formatNumber(totalDatasets))
  }

  if (loading && organizations.length === 0) {
    return (
      <section className="organisations-page">
        <div className="container organisations-shell">
          <div className="organisations-empty">
            <p>Chargement du répertoire des organisations...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="organisations-page">
      <div className="container organisations-shell">
        <header className="organisations-hero">
          {/*<span className="organisations-hero__badge">{page.badge}</span> */}
          <h1>
            {page.titlePrefix}
            <span> {page.titleHighlight}</span>
          </h1>
          <p>{page.description}</p>

          <div className="organisations-toolbar" role="region" aria-label="Recherche et filtre des organisations">
            <div className="organisations-search">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={page.searchPlaceholder}
                aria-label="Rechercher une organisation"
              />
            </div>

            <div className="organisations-filters">
              {organizationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={activeType === type.value ? 'is-active' : ''}
                  onClick={() => setActiveType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="organisations-grid" aria-label="Liste des organisations">
          {filtered.map((organization) => (
            <article key={organization.slug} className="organisation-card">
              <div className="organisation-card__top">
                {organization.logo && (
                  <div className="organisation-card__logo">
                    <img src={organization.logo} alt={`Logo ${organization.shortName || organization.name}`} width={64} height={64} />
                  </div>
                )}
                <div>
                  <h2>{organization.name}</h2>
                  <p>{organization.typeLabel}</p>
                </div>
              </div>

              <div className="organisation-card__bottom">
                <div>
                  <strong>{formatNumber(organization.datasetCount)}</strong>
                  <span>jeux de donnees</span>
                </div>

                <Link to={`/organisations/${organization.slug}`} aria-label={`Voir les détails de ${organization.name}`}>
                  <span aria-hidden="true">&#8250;</span>
                </Link>
              </div>
            </article>
          ))}

          <aside className="organisation-cta">
            <h2>{page.cta?.title}</h2>
            <p>{page.cta?.description}</p>
            <Link to="/contact">{page.cta?.linkLabel || 'Demander l’accès'}</Link>
          </aside>
        </section>

        {filtered.length === 0 && (
          <div className="organisations-empty">
            <p>Aucune organisation ne correspond à votre recherche.</p>
            <button type="button" onClick={() => { setQuery(''); setActiveType('all') }}>
              Reinitialiser
            </button>
          </div>
        )}

        <section className="organisations-impact" aria-label="Impact des organisations">
          <div className="organisations-impact__content">
            <h2>{impact.title}</h2>
            <p>{renderTemplate(impact.description)}</p>

            <div className="organisations-impact__highlights">
              {(impact.highlights || []).map((item) => (
                <article key={item.title}>
                  <h3>{renderTemplate(item.title)}</h3>
                  <p>{renderTemplate(item.description)}</p>
                </article>
              ))}
            </div>
          </div>

          <figure className="organisations-impact__visual">
            <div className="organisations-impact__visual-head">
              <span>{impact.visualCaption}</span>
              <strong>{impact.visualTitle}</strong>
            </div>

            <div className="organisations-impact__visual-metrics" aria-label="Indicateurs d’analyse en cours">
              <article>
                <p>Organisations actives</p>
                <strong>{formatNumber(enriched.length)}</strong>
              </article>
              <article>
                <p>Jeux de donnees relies</p>
                <strong>{formatNumber(totalDatasets)}</strong>
              </article>
            </div>

            <div className="organisations-impact__visual-chart" aria-label="Distribution des jeux par organisation">
              {topOrganizations.map((item) => {
                const ratio = maxDatasetCount > 0 ? (item.datasetCount / maxDatasetCount) * 100 : 0
                return (
                  <div key={item.slug} className="organisations-impact__bar-row">
                    <div className="organisations-impact__bar-meta">
                      <span>{item.shortName || item.name}</span>
                      <strong>{formatNumber(item.datasetCount)}</strong>
                    </div>
                    <div className="organisations-impact__bar-track">
                      <span style={{ width: `${Math.max(8, ratio)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <figcaption>
              <p>Analyse en direct des flux de publication et de mise à jour institutionnelle.</p>
            </figcaption>
          </figure>
        </section>
      </div>
    </section>
  )
}
