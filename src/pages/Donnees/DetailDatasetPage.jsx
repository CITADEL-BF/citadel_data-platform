import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getDatasetById, getRelatedDatasets } from '../../features/datasets/catalogueData'
import { useOrganizationsContent, getAllOrganizations } from '../../features/organizations/organizationsData'
import './DetailDatasetPage.css'

function withBase(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const ORG_WEBSITES = {
  'INSD Burkina': 'https://www.insd.bf',
  MENAPLN: 'https://www.education.gov.bf',
  'Ministere Sante': 'https://www.sante.gov.bf',
  'SP/CONASUR': 'https://www.conasur.gov.bf',
  AFRISTAT: 'https://www.afristat.org',
  'DSF / Ministere Sante': 'https://www.sante.gov.bf',
  'HRP / ACLED': 'https://acleddata.com'
}

export default function DetailDatasetPage() {
  const { datasetId } = useParams()
  const dataset = getDatasetById(datasetId)
  const related = useMemo(() => getRelatedDatasets(datasetId, 4), [datasetId])
  const { content: orgContent } = useOrganizationsContent()
  
  const datasetOrganization = useMemo(() => {
    if (!dataset) return null
    const organizations = getAllOrganizations(orgContent)
    return organizations.find(org => 
      org.aliases.some(alias => 
        alias.toLowerCase().trim() === dataset.organization.toLowerCase().trim()
      )
    )
  }, [dataset, orgContent])

  if (!datasetId) {
    return <Navigate to="/donnees" replace />
  }

  if (!dataset) {
    return (
      <section className="detail-dataset detail-dataset--missing">
        <div className="container">
          <h1>Dataset introuvable</h1>
          <p>Le jeu de données demandé n’existe pas ou a été renommé.</p>
          <Link to="/donnees" className="detail-dataset__back">Retour au catalogue</Link>
        </div>
      </section>
    )
  }

  const [visibleRows, setVisibleRows] = useState(10)
  const [realPreviewRows, setRealPreviewRows] = useState([])

  const sampleRows = useMemo(() => (dataset.sample || []).slice(0, 200), [dataset])

  const orgWebsite = ORG_WEBSITES[dataset.organization] || '#'
  const previewRows = realPreviewRows.length ? realPreviewRows : sampleRows
  const renderedRows = previewRows.slice(0, visibleRows)
  const tableColumns = useMemo(() => {
    if (!previewRows.length) return []
    const ordered = []
    const seen = new Set()
    previewRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      })
    })
    return ordered
  }, [previewRows])

  useEffect(() => {
    let isActive = true

    function normalizeHeader(value, index) {
      const cleaned = String(value || '').trim().replace(/^"|"$/g, '')
      return cleaned || `col_${index + 1}`
    }

    function parseCsv(text) {
      const records = []
      let row = []
      let field = ''
      let inQuotes = false

      for (let i = 0; i < text.length; i += 1) {
        const char = text[i]
        const next = text[i + 1]

        if (char === '"') {
          if (inQuotes && next === '"') {
            field += '"'
            i += 1
          } else {
            inQuotes = !inQuotes
          }
          continue
        }

        if (!inQuotes && char === ',') {
          row.push(field)
          field = ''
          continue
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
          if (char === '\r' && next === '\n') {
            i += 1
          }
          row.push(field)
          field = ''
          if (row.some((item) => String(item).trim() !== '')) {
            records.push(row)
          }
          row = []
          continue
        }

        field += char
      }

      if (field.length > 0 || row.length > 0) {
        row.push(field)
      }
      if (row.some((item) => String(item).trim() !== '')) {
        records.push(row)
      }

      if (!records.length) return []

      const headers = records[0].map((header, idx) => normalizeHeader(header, idx))
      const usedHeaders = new Map()
      const uniqueHeaders = headers.map((header) => {
        const count = usedHeaders.get(header) || 0
        usedHeaders.set(header, count + 1)
        return count === 0 ? header : `${header}_${count + 1}`
      })

      return records.slice(1, 201).map((values) => {
        const entry = {}
        uniqueHeaders.forEach((header, index) => {
          entry[header] = String(values[index] ?? '').trim()
        })
        return entry
      })
    }

    function parseJson(payload) {
      if (!payload) return []
      if (Array.isArray(payload)) return payload.slice(0, 200)
      if (Array.isArray(payload.data)) return payload.data.slice(0, 200)
      if (Array.isArray(payload.rows)) return payload.rows.slice(0, 200)
      return []
    }

    async function loadPreviewFromDownloads() {
      const downloads = dataset.downloads || []
      const preferred =
        downloads.find((item) => /\.csv$/i.test(item.href) || /csv/i.test(item.label)) ||
        downloads.find((item) => /\.json$/i.test(item.href) || /json/i.test(item.label))

      if (!preferred) {
        if (isActive) setRealPreviewRows([])
        return
      }

      try {
        const response = await fetch(withBase(preferred.href))
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        let rows = []
        if (/\.json$/i.test(preferred.href) || /json/i.test(preferred.label)) {
          const json = await response.json()
          rows = parseJson(json)
        } else {
          const text = await response.text()
          rows = parseCsv(text)
        }

        if (isActive) {
          setRealPreviewRows(rows)
          setVisibleRows(10)
        }
      } catch {
        if (isActive) {
          setRealPreviewRows([])
          setVisibleRows(10)
        }
      }
    }

    loadPreviewFromDownloads()

    return () => {
      isActive = false
    }
  }, [dataset])
  const metadataTags = useMemo(
    () => [
      dataset.domainLabel,
      dataset.organization,
      dataset.region,
      dataset.format,
      dataset.status,
      ...related.map((item) => item.title)
    ],
    [dataset, related]
  )

  function triggerDownloadFromHref(href, fallbackName) {
    if (!href) return
    const a = document.createElement('a')
    a.href = withBase(href)
    a.download = fallbackName
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function handleDatasetDownload() {
    const downloads = dataset.downloads || []
    if (!downloads.length) return

    const csvItem = downloads.find((item) => /\.csv$/i.test(item.href) || /csv/i.test(item.label))
    const jsonItem = downloads.find((item) => /\.json$/i.test(item.href) || /json/i.test(item.label))
    const preferred = csvItem || jsonItem || downloads[0]

    const ext = /json/i.test(preferred.label) || /\.json$/i.test(preferred.href) ? 'json' : 'csv'
    triggerDownloadFromHref(preferred.href, `${dataset.id}.${ext}`)
  }

  function handleMetadataExport() {
    const metadata = {
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      domain: dataset.domain,
      domainLabel: dataset.domainLabel,
      organization: dataset.organization,
      coverage: dataset.coverage,
      collectionPeriod: dataset.collectionPeriod,
      methodology: dataset.methodology,
      format: dataset.format,
      rows: dataset.rows,
      variables: dataset.variables,
      sizeMb: dataset.sizeMb,
      license: dataset.license,
      updatedAt: dataset.updatedAt,
      contact: dataset.contact,
      downloads: dataset.downloads
    }

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataset.id}-metadonnees.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="detail-dataset">
      <div className="detail-dataset-shell">
        <div className="detail-dataset-content">
          <header className="detail-dataset-header">
            <div className="detail-dataset-hero">
              <div className="detail-dataset-hero__grid">
                <div className="detail-dataset-hero__main">
                  <h1>{dataset.title}</h1>
                  <p>{dataset.description}</p>
                </div>

                <aside className="detail-dataset-hero__org">
                  <a
                    href={orgWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-org-link"
                    aria-label={`Visiter le site de ${dataset.organization}`}
                  >
                    {datasetOrganization?.logo ? (
                      <img 
                        src={datasetOrganization.logo} 
                        alt={`Logo ${datasetOrganization.shortName || dataset.organization}`}
                        className="detail-org-logo"
                        width={320}
                        height={180}
                      />
                    ) : (
                      <span className="detail-org-fallback">{dataset.organization}</span>
                    )}
                  </a>
                </aside>
              </div>
            </div>
          </header>

          <div className="detail-dataset-grid">
            <main>
              <div className="detail-apercu-grid">
                <section id="metadonnees" className="detail-card">
                  <h2>Informations complémentaires</h2>
                  <ul className="detail-complement-items">
                    <li>
                      <p className="detail-complement-label">Période de l’ensemble de données <span className="detail-help-tip">[?]</span></p>
                      <p className="detail-complement-value">{dataset.collectionPeriod}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Modifié <span className="detail-help-tip">[?]</span></p>
                      <p className="detail-complement-value">{dataset.updatedAt}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Jeu de données ajouté sur data.citadel.bf <span className="detail-help-tip">[?]</span></p>
                      <p className="detail-complement-value">{dataset.updatedAt}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Fréquence de mise à jour prévue</p>
                      <p className="detail-complement-value">Mensuelle</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Emplacement</p>
                      <p className="detail-complement-value">{dataset.coverage}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Source</p>
                      <p className="detail-complement-value">{dataset.organization}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Donateur</p>
                      <p className="detail-complement-value">{dataset.organization}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Méthodologie</p>
                      <p className="detail-complement-value">{dataset.methodology}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Avertissements / Commentaires</p>
                      <p className="detail-complement-value">Bien que la fréquence de mise à jour prévue soit mensuelle, les mises à jour des données peuvent être plus ou moins fréquentes.</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Licence</p>
                      <p className="detail-complement-value">{dataset.license}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Étiquettes</p>
                      <div className="detail-tags-grid detail-tags-grid--inline">
                        {metadataTags.map((tag) => (
                          <span key={tag} className="detail-tag-chip">{tag}</span>
                        ))}
                      </div>
                    </li>
                    <li>
                      <p className="detail-complement-label">Format de fichier</p>
                      <p className="detail-complement-value">{dataset.format}</p>
                    </li>
                    <li>
                      <p className="detail-complement-label">Visibilité</p>
                      <p className="detail-complement-value">Publique</p>
                    </li>
                  </ul>
                </section>

                <section id="apercu" className="detail-card">
                  <div className="detail-card__topbar">
                    <h2>Aperçu du Jeu de Données</h2>
                    <div className="detail-card__actions">
                      <button type="button" onClick={handleDatasetDownload}>Télécharger</button>
                      <button type="button" onClick={handleMetadataExport}>Exporter métadonnées</button>
                    </div>
                  </div>
                  <header className="detail-card__header">
                    <h3>Aperçu de l’échantillon</h3>
                    <small>Glisser dans le tableau pour voir toutes les colonnes</small>
                  </header>
                  <div className="detail-table-wrap">
                    {tableColumns.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            {tableColumns.map((column) => (
                              <th key={column}>{column.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {renderedRows.map((row, index) => (
                            <tr key={row.id || `row-${index}`}>
                              {tableColumns.map((column) => (
                                <td key={`${row.id || index}-${column}`}>{String(row[column] ?? '-')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="detail-table-empty">Aucun échantillon disponible pour ce jeu de données.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="detail-table-cta"
                    onClick={() => setVisibleRows((prev) => Math.min(prev + 10, previewRows.length))}
                    disabled={visibleRows >= previewRows.length}
                  >
                    {visibleRows >= previewRows.length ? 'Toutes les lignes sont affichées' : 'Voir plus de lignes'}
                  </button>
                </section>
              </div>

            </main>
          </div>
        </div>
      </div>
    </section>
  )
}
