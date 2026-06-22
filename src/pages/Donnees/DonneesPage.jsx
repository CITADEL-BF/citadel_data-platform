import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DATASETS, DOMAIN_OPTIONS, DOMAIN_STYLES, REGION_OPTIONS } from '../../features/datasets/catalogueData'
import './DonneesPage.css'

const ITEMS_PER_PAGE = 10
const QUICK_SEARCHES = ['PDI', 'Taux d’emploi', 'Prix alimentaires']
const FILTER_PREVIEW_COUNT = 4

function withBase(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function normalizeDatasetItem(item) {
  const domain = item?.domain || 'population'
  const title = String(item?.title || item?.id || 'Jeu de données').trim()
  const fallbackId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'dataset'
  const format = String(item?.format || '').trim() || 'CSV'
  const downloads = Array.isArray(item?.downloads) ? item.downloads : []

  return {
    id: String(item?.id || fallbackId),
    title,
    description: String(item?.description || 'Jeu de données disponible dans la diffusion CITADEL.'),
    domain,
    domainLabel: item?.domainLabel || DOMAIN_OPTIONS.find((opt) => opt.value === domain)?.label || 'Autre',
    organization: String(item?.organization || 'CITADEL'),
    region: String(item?.region || 'National'),
    format,
    status: String(item?.status || 'actif'),
    updatedLabel: String(item?.updatedLabel || 'Automatique'),
    updatedAt: String(item?.updatedAt || '2026-01-01'),
    rows: Number(item?.rows || 0),
    variables: Number(item?.variables || 0),
    sizeMb: Number(item?.sizeMb || 0),
    license: String(item?.license || 'CC BY 4.0'),
    coverage: String(item?.coverage || 'National'),
    collectionPeriod: String(item?.collectionPeriod || 'Non spécifié'),
    methodology: String(item?.methodology || 'Non spécifiée'),
    apiPath: String(item?.apiPath || ''),
    contact: String(item?.contact || 'citadel.uvbf@gmail.com'),
    downloads,
    sample: Array.isArray(item?.sample) ? item.sample : [],
    detailEnabled: item?.detailEnabled !== false,
    origin: String(item?.origin || 'catalogue'),
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function daysSince(dateIso) {
  const today = new Date()
  const target = new Date(dateIso)
  const delta = today.getTime() - target.getTime()
  return Math.max(0, Math.floor(delta / (24 * 60 * 60 * 1000)))
}

export default function DonneesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get('q') || ''
  const initialQuery = queryFromUrl
  const [query, setQuery] = useState(initialQuery)
  const [selectedDomains, setSelectedDomains] = useState(['all'])
  const [selectedOrgs, setSelectedOrgs] = useState([])
  const [selectedRegions, setSelectedRegions] = useState([])
  const [selectedFormats, setSelectedFormats] = useState([])
  const [updatedAfter, setUpdatedAfter] = useState('')
  const [page, setPage] = useState(1)
  const [expandedFilters, setExpandedFilters] = useState({ organizations: false, regions: false, formats: false })
  const [catalogDatasets, setCatalogDatasets] = useState(DATASETS.map(normalizeDatasetItem))

  useEffect(() => {
    setQuery(queryFromUrl)
    setPage(1)
  }, [queryFromUrl])

  useEffect(() => {
    let isActive = true

    async function loadAutoCatalog() {
      try {
        const response = await fetch(withBase('data/catalogue_datasets.json'))
        if (!response.ok) return
        const payload = await response.json()
        const generated = Array.isArray(payload?.datasets)
          ? payload.datasets.map(normalizeDatasetItem)
          : []

        if (!generated.length) return

        const map = new Map()
        DATASETS.map(normalizeDatasetItem).forEach((item) => map.set(item.id, item))
        generated.forEach((item) => map.set(item.id, item))

        if (isActive) {
          setCatalogDatasets([...map.values()])
        }
      } catch {
        // fallback silencieux vers le catalogue statique
      }
    }

    loadAutoCatalog()
    return () => {
      isActive = false
    }
  }, [])

  const organizations = useMemo(() => {
    return [...new Set(catalogDatasets.map((item) => item.organization))].sort((a, b) => a.localeCompare(b))
  }, [catalogDatasets])

  const regions = useMemo(() => {
    const dyn = catalogDatasets.map((item) => item.region).filter(Boolean)
    return [...new Set([...REGION_OPTIONS, ...dyn])].sort((a, b) => a.localeCompare(b))
  }, [catalogDatasets])

  const formats = useMemo(() => {
    return [...new Set(catalogDatasets.map((item) => item.format))]
  }, [catalogDatasets])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeDomains = selectedDomains.includes('all') ? [] : selectedDomains

    return catalogDatasets.filter((item) => {
      const inDomain = !activeDomains.length || activeDomains.includes(item.domain)
      const inOrg = !selectedOrgs.length || selectedOrgs.includes(item.organization)
      const inRegion = !selectedRegions.length || selectedRegions.some((region) => region === item.region || item.region === 'National')
      const inFormat = !selectedFormats.length || selectedFormats.includes(item.format)
      const inDate = !updatedAfter || item.updatedAt >= updatedAfter
      const inQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.organization.toLowerCase().includes(normalizedQuery)

      return inDomain && inOrg && inRegion && inFormat && inDate && inQuery
    })
  }, [catalogDatasets, query, selectedDomains, selectedOrgs, selectedRegions, selectedFormats, updatedAfter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  const tableColumns = ['Nom du dataset', 'Domaine', 'Source', 'Mise à jour']

  const activeFilterChips = useMemo(() => {
    const chips = []

    selectedDomains
      .filter((domain) => domain !== 'all')
      .forEach((domain) => {
        chips.push({ type: 'domain', value: domain, label: DOMAIN_OPTIONS.find((opt) => opt.value === domain)?.label || domain })
      })

    selectedOrgs.forEach((organization) => {
      chips.push({ type: 'org', value: organization, label: organization })
    })

    selectedRegions.forEach((region) => {
      chips.push({ type: 'region', value: region, label: region })
    })

    selectedFormats.forEach((format) => {
      chips.push({ type: 'format', value: format, label: format })
    })

    if (updatedAfter) {
      chips.push({ type: 'updatedAfter', value: updatedAfter, label: `MAJ après ${updatedAfter}` })
    }

    return chips
  }, [selectedDomains, selectedOrgs, selectedRegions, selectedFormats, updatedAfter])

  const stats = useMemo(() => {
    const uniqueOrgs = new Set(filtered.map((item) => item.organization))
    return {
      datasets: filtered.length,
      organizations: uniqueOrgs.size,
    }
  }, [filtered])

  function toggleDomain(domain) {
    setPage(1)
    if (domain === 'all') {
      setSelectedDomains(['all'])
      return
    }

    setSelectedDomains((previous) => {
      const withoutAll = previous.filter((value) => value !== 'all')
      if (withoutAll.includes(domain)) {
        const next = withoutAll.filter((value) => value !== domain)
        return next.length ? next : ['all']
      }
      return [...withoutAll, domain]
    })
  }

  function toggleItem(values, setValues, value) {
    setPage(1)
    setValues((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value)
      }
      return [...previous, value]
    })
  }

  function clearAllFilters() {
    setQuery('')
    setSelectedDomains(['all'])
    setSelectedOrgs([])
    setSelectedRegions([])
    setSelectedFormats([])
    setUpdatedAfter('')
    setPage(1)
  }

  function removeChip(chip) {
    setPage(1)
    if (chip.type === 'domain') {
      setSelectedDomains((previous) => {
        const next = previous.filter((value) => value !== chip.value && value !== 'all')
        return next.length ? next : ['all']
      })
      return
    }

    if (chip.type === 'org') {
      setSelectedOrgs((previous) => previous.filter((value) => value !== chip.value))
      return
    }

    if (chip.type === 'region') {
      setSelectedRegions((previous) => previous.filter((value) => value !== chip.value))
      return
    }

    if (chip.type === 'format') {
      setSelectedFormats((previous) => previous.filter((value) => value !== chip.value))
      return
    }

    if (chip.type === 'updatedAfter') {
      setUpdatedAfter('')
    }
  }

  function changePage(nextPage) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)))
  }

  function openDataset(dataset) {
    if (dataset?.detailEnabled === false) {
      const preferred = dataset.downloads?.[0]?.href
      if (preferred) {
        window.open(withBase(preferred), '_blank', 'noopener,noreferrer')
        return
      }
    }
    navigate(`/donnees/${dataset.id}`)
  }

  function toggleFilterSection(sectionKey) {
    setExpandedFilters((previous) => ({ ...previous, [sectionKey]: !previous[sectionKey] }))
  }

  function visibleFilterItems(items, sectionKey) {
    if (expandedFilters[sectionKey]) return items
    return items.slice(0, FILTER_PREVIEW_COUNT)
  }

  return (
    <section className="donnees-page">
      <div className="donnees-shell">
        <aside className="donnees-sidebar" aria-label="Filtres du catalogue">
          <h2 className="donnees-sidebar__title">Filtres du catalogue</h2>

          <div className="donnees-filter-group">
            <h3>Domaine</h3>
            <div className="donnees-domain-chips">
              {DOMAIN_OPTIONS.map((option) => {
                const selected = selectedDomains.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`donnees-chip ${selected ? 'donnees-chip--active' : ''}`}
                    onClick={() => toggleDomain(option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="donnees-filter-group">
            <h3>Organisation</h3>
            <div className="donnees-checkbox-list">
              {visibleFilterItems(organizations, 'organizations').map((organization) => (
                <label key={organization}>
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(organization)}
                    onChange={() => toggleItem(selectedOrgs, setSelectedOrgs, organization)}
                  />
                  <span>{organization}</span>
                </label>
              ))}
            </div>
            {organizations.length > FILTER_PREVIEW_COUNT && (
              <button type="button" className="donnees-show-more" onClick={() => toggleFilterSection('organizations')}>
                {expandedFilters.organizations ? 'Voir moins' : `+ ${organizations.length - FILTER_PREVIEW_COUNT} plus`}
              </button>
            )}
          </div>

          <div className="donnees-filter-group">
            <h3>Region</h3>
            <div className="donnees-checkbox-list">
              {visibleFilterItems(regions, 'regions').map((region) => (
                <label key={region}>
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleItem(selectedRegions, setSelectedRegions, region)}
                  />
                  <span>{region}</span>
                </label>
              ))}
            </div>
            {regions.length > FILTER_PREVIEW_COUNT && (
              <button type="button" className="donnees-show-more" onClick={() => toggleFilterSection('regions')}>
                {expandedFilters.regions ? 'Voir moins' : `+ ${regions.length - FILTER_PREVIEW_COUNT} plus`}
              </button>
            )}
          </div>

          <div className="donnees-filter-group">
            <h3>Format</h3>
            <div className="donnees-checkbox-list">
              {visibleFilterItems(formats, 'formats').map((format) => (
                <label key={format}>
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes(format)}
                    onChange={() => toggleItem(selectedFormats, setSelectedFormats, format)}
                  />
                  <span>{format}</span>
                </label>
              ))}
            </div>
            {formats.length > FILTER_PREVIEW_COUNT && (
              <button type="button" className="donnees-show-more" onClick={() => toggleFilterSection('formats')}>
                {expandedFilters.formats ? 'Voir moins' : `+ ${formats.length - FILTER_PREVIEW_COUNT} plus`}
              </button>
            )}
          </div>

          <div className="donnees-filter-group">
            <h3>Date de mise à jour</h3>
            <input
              type="date"
              value={updatedAfter}
              onChange={(event) => {
                setUpdatedAfter(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <button type="button" className="donnees-reset" onClick={clearAllFilters}>
            Réinitialiser les filtres
          </button>
        </aside>

        <div className="donnees-content">
          <header className="donnees-header">
            <h1>Catalogue des Données</h1>
            <div className="donnees-search-row">
              <div className="donnees-search-wrap">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Rechercher un jeu de données, un indicateur ou une organisation..."
                  aria-label="Rechercher dans le catalogue"
                />
              </div>

              <div className="donnees-quick-searches">
                <span>Recherches fréquentes :</span>
                {QUICK_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item)
                      setPage(1)
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="donnees-kpis">
            <article>
              <strong>{formatNumber(stats.datasets)}</strong>
              <span>Jeux de données</span>
            </article>
            <article>
              <strong>{stats.organizations}</strong>
              <span>Organisations certifiées</span>
            </article>
            <article>
              <strong>{formatNumber(filtered.reduce((sum, item) => sum + Number(item.rows || 0), 0))}</strong>
              <span>Lignes recensées</span>
            </article>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="donnees-active-filters" aria-label="Filtres actifs">
              {activeFilterChips.map((chip) => (
                <button key={`${chip.type}-${chip.value}`} type="button" onClick={() => removeChip(chip)}>
                  {chip.label} <span aria-hidden="true">x</span>
                </button>
              ))}
            </div>
          )}

          <section className="donnees-results" aria-label="Résultats du catalogue">
            <div className="donnees-table-head" aria-hidden="true">
              {tableColumns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>

            <div className="donnees-results__card">
              <div className="donnees-table-wrap">
                <table>
                  <colgroup>
                    <col style={{ width: '46%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '18%' }} />
                  </colgroup>
                  <tbody>
                    {paginated.map((dataset) => {
                      const style = DOMAIN_STYLES[dataset.domain] || DOMAIN_STYLES.population
                      return (
                        <tr
                          key={dataset.id}
                          role="link"
                          tabIndex={0}
                          onClick={() => openDataset(dataset)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openDataset(dataset)
                            }
                          }}
                        >
                          <td>
                            <strong>{dataset.title}</strong>
                            <p>{dataset.description}</p>
                          </td>
                          <td>
                            <span className="donnees-domain-badge" style={{ background: style.bg, color: style.color }}>
                              {dataset.domainLabel}
                            </span>
                          </td>
                          <td>{dataset.organization}</td>
                          <td>{dataset.updatedLabel}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="donnees-empty">
                  <p>Aucun jeu de données ne correspond aux filtres sélectionnés.</p>
                  <button type="button" onClick={clearAllFilters}>Revenir au catalogue complet</button>
                </div>
              )}

              {filtered.length > 0 && (
                <footer className="donnees-pagination">
                  <p>
                    Affichage de {(page - 1) * ITEMS_PER_PAGE + 1}
                    {' - '}
                    {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
                    {' sur '}
                    {filtered.length} jeux de données
                  </p>

                  <div>
                    <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1}>
                      {'<'}
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                      const isNearCurrent = Math.abs(pageNumber - page) <= 1 || pageNumber === 1 || pageNumber === totalPages
                      if (!isNearCurrent) return null

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          className={pageNumber === page ? 'is-active' : ''}
                          onClick={() => changePage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                    <button type="button" onClick={() => changePage(page + 1)} disabled={page === totalPages}>
                      {'>'}
                    </button>
                  </div>
                </footer>
              )}
            </div>
          </section>

          <p className="donnees-last-sync">Dernière synchronisation des données: il y a {daysSince('2026-05-25')} jour(s)</p>
        </div>
      </div>
    </section>
  )
}
