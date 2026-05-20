import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { GeoJSON, MapContainer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ModuleLayout from '../ModuleLayout'
import './SantePage.css'

const BFA_CENTER = [12.3, -1.56]
const BFA_ZOOM = 6
const ACCENT = '#00695C'
const CPN2_INDICATOR = 'Evolution du taux de couverture en CPN2 par région'

const fmtInt = (value) => Number(value || 0).toLocaleString('fr-FR')
const fmtPct = (value) => `${Number(value || 0).toFixed(1)}%`
const fmtCompact = (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const normalizeName = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim()
    })
    return row
  })
}

const diseaseNameFromCategory = (value) => (
  String(value || '')
    .replace(/^Cas d['’]/i, '')
    .replace(/^Cas de /i, '')
    .replace(/^Décès d['’]/i, '')
    .replace(/^Décès de /i, '')
    .trim()
)

function ResetViewControl() {
  const map = useMap()
  return (
    <button
      type="button"
      className="sante-map-reset"
      title="Réinitialiser la vue"
      onClick={() => map.setView(BFA_CENTER, BFA_ZOOM)}
    >
      ⟳ Réinitialiser
    </button>
  )
}

function KpiCard({ label, value, hint, highlight }) {
  return (
    <article className={`sante-kpi${highlight ? ' sante-kpi--highlight' : ''}`}>
      <p className="sante-kpi__label label-sm">{label}</p>
      <p className="sante-kpi__value">{value}</p>
      {hint && <p className="sante-kpi__hint">{hint}</p>}
    </article>
  )
}

export default function SantePage() {
  const [centresDataset, setCentresDataset] = useState(null)
  const [coverageRows, setCoverageRows] = useState([])
  const [epiRows, setEpiRows] = useState([])
  const [infraRows, setInfraRows] = useState([])
  const [epiMeta, setEpiMeta] = useState(null)
  const [regionsGeo, setRegionsGeo] = useState(null)

  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedInfraYear, setSelectedInfraYear] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/json/sante/centres_sante_region.json')).then((response) => response.json()),
      fetch(withBase('data/viz/csv/sante_couverture_sanitaire.csv')).then((response) => response.text()),
      fetch(withBase('data/viz/csv/sante_kpi_epidemiologie.csv')).then((response) => response.text()),
      fetch(withBase('data/viz/csv/sante_infrastructures.csv')).then((response) => response.text()),
      fetch(withBase('data/viz/json/sante/kpi_epidemiologie.json')).then((response) => response.json()),
      fetch(withBase('data/viz/geojson/bfa_regions_boundaries.geojson')).then((response) => response.json()),
    ])
      .then(([
        centresJson,
        coverageText,
        epiText,
        infraText,
        epiJson,
        regionsGeoJson,
      ]) => {
        setCentresDataset(centresJson || null)
        setCoverageRows(parseCsv(coverageText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          region: String(row.region || '').trim(),
          region_norm: String(row.region_norm || row.region || '').trim(),
          milieu: String(row.milieu || '').trim(),
          sexe: String(row.sexe || '').trim(),
        })))
        setEpiRows(parseCsv(epiText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          categorie_1: String(row.categorie_1 || '').trim(),
        })))
        setInfraRows(parseCsv(infraText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          categorie_1: String(row.categorie_1 || '').trim(),
          region_norm: String(row.region_norm || row.region || '').trim(),
        })))
        setEpiMeta(epiJson || null)
        setRegionsGeo(regionsGeoJson || null)
      })
      .catch(() => {
        setCentresDataset(null)
        setCoverageRows([])
        setEpiRows([])
        setInfraRows([])
        setEpiMeta(null)
        setRegionsGeo(null)
      })
  }, [])

  const centreRows = useMemo(() => {
    if (!centresDataset?.categories?.length || !centresDataset?.series?.[0]?.data?.length) return []
    return centresDataset.categories.map((region, index) => ({
      region,
      value: Number(centresDataset.series[0].data[index] || 0),
    }))
  }, [centresDataset])

  const centreMap = useMemo(() => {
    const map = new Map()
    centreRows.forEach((row) => {
      map.set(normalizeName(row.region), row.value)
    })
    return map
  }, [centreRows])

  const availableRegions = useMemo(() => {
    return centreRows.map((row) => row.region).sort((left, right) => left.localeCompare(right, 'fr'))
  }, [centreRows])

  const totalCentres = useMemo(() => centreRows.reduce((sum, row) => sum + row.value, 0), [centreRows])

  const topCentreRegion = useMemo(() => {
    return [...centreRows].sort((left, right) => right.value - left.value)[0] || null
  }, [centreRows])

  const selectedRegionCentreCount = useMemo(() => {
    if (selectedRegion === 'all') return null
    return centreRows.find((row) => row.region === selectedRegion)?.value || 0
  }, [centreRows, selectedRegion])

  const maxCentreValue = useMemo(() => Math.max(...centreRows.map((row) => row.value), 1), [centreRows])

  const cpn2Rows = useMemo(() => {
    return coverageRows.filter((row) => row.indicateur === CPN2_INDICATOR)
  }, [coverageRows])

  const coverageSeries = useMemo(() => {
    const scopedRows = cpn2Rows
      .filter((row) => {
        if (selectedRegion === 'all') {
          return row.region === 'Burkina Faso'
        }
        return row.region_norm === selectedRegion || row.region === selectedRegion
      })
      .sort((left, right) => left.annee - right.annee)

    return scopedRows.map((row) => ({
      year: row.annee,
      value: Number(row.valeur || 0),
      label: row.region || row.region_norm || 'Burkina Faso',
    }))
  }, [cpn2Rows, selectedRegion])

  const latestCoveragePoint = coverageSeries[coverageSeries.length - 1] || null
  const firstCoveragePoint = coverageSeries[0] || null
  const coverageDelta = latestCoveragePoint && firstCoveragePoint && firstCoveragePoint.value > 0
    ? latestCoveragePoint.value - firstCoveragePoint.value
    : 0

  const availableInfraYears = useMemo(() => {
    const years = new Set(infraRows.map((row) => row.annee).filter(Boolean))
    return Array.from(years).sort((left, right) => left - right)
  }, [infraRows])

  useEffect(() => {
    if (selectedInfraYear !== 'all') return
    if (!availableInfraYears.length) return
    setSelectedInfraYear(String(availableInfraYears[availableInfraYears.length - 1]))
  }, [availableInfraYears, selectedInfraYear])

  const infrastructureRows = useMemo(() => {
    const targetYear = Number(selectedInfraYear)
    const scoped = infraRows.filter((row) => {
      if (selectedInfraYear !== 'all' && row.annee !== targetYear) return false
      if (selectedRegion !== 'all' && row.region_norm !== selectedRegion) return false
      return true
    })

    const grouped = new Map()
    scoped.forEach((row) => {
      const key = row.categorie_1 || 'Autres'
      grouped.set(key, (grouped.get(key) || 0) + Number(row.valeur || 0))
    })

    return Array.from(grouped.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8)
  }, [infraRows, selectedInfraYear, selectedRegion])

  const epidemiologyRows = useMemo(() => {
    const grouped = new Map()

    epiRows.forEach((row) => {
      const disease = diseaseNameFromCategory(row.categorie_1)
      if (!disease) return
      const current = grouped.get(disease) || { disease, explicitCases: [], explicitDeaths: [], fallback: [] }
      const category = row.categorie_1.toLowerCase()
      if (category.startsWith('cas ')) {
        current.explicitCases.push(Number(row.valeur || 0))
      } else if (category.startsWith('décès') || category.startsWith('deces')) {
        current.explicitDeaths.push(Number(row.valeur || 0))
      } else {
        current.fallback.push(Number(row.valeur || 0))
      }
      grouped.set(disease, current)
    })

    return Array.from(grouped.values())
      .map((entry) => {
        if (!entry.explicitCases.length && !entry.explicitDeaths.length && entry.fallback.length) {
          const sorted = [...entry.fallback].sort((left, right) => right - left)
          return {
            disease: entry.disease,
            cases: sorted[0] || 0,
            deaths: sorted.slice(1).reduce((sum, value) => sum + value, 0),
          }
        }

        return {
          disease: entry.disease,
          cases: entry.explicitCases.reduce((sum, value) => sum + value, 0),
          deaths: entry.explicitDeaths.reduce((sum, value) => sum + value, 0),
        }
      })
      .sort((left, right) => right.cases - left.cases)
  }, [epiRows])

  const totalCases = useMemo(() => epidemiologyRows.reduce((sum, row) => sum + row.cases, 0), [epidemiologyRows])
  const totalDeaths = useMemo(() => epidemiologyRows.reduce((sum, row) => sum + row.deaths, 0), [epidemiologyRows])
  const dominantDisease = epidemiologyRows[0] || null
  const lethalityRate = totalCases > 0 ? (totalDeaths / totalCases) * 100 : 0

  const coverageOption = useMemo(() => ({
    color: [ACCENT],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (!params?.length) return ''
        return `${params[0].axisValue}<br/><b>${fmtPct(params[0].value)}</b>`
      },
    },
    grid: { left: 56, right: 18, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: coverageSeries.map((point) => point.year),
      axisLine: { lineStyle: { color: '#d0d0d0' } },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `${value}%` },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { color: 'rgba(0, 105, 92, 0.14)' },
        lineStyle: { color: ACCENT, width: 2.8 },
        itemStyle: { color: ACCENT },
        data: coverageSeries.map((point) => Number(point.value.toFixed(2))),
      },
    ],
  }), [coverageSeries])

  const epidemiologyOption = useMemo(() => ({
    color: ['#00695C', '#fccc38'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        if (!params?.length) return ''
        const lines = params.map((item) => `${item.seriesName}: <b>${fmtInt(item.value)}</b>`)
        return `${params[0].axisValue}<br/>${lines.join('<br/>')}`
      },
    },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 120, right: 18, top: 16, bottom: 46 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => fmtCompact(value) },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    yAxis: {
      type: 'category',
      data: epidemiologyRows.slice(0, 8).map((row) => row.disease),
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        name: 'Cas',
        type: 'bar',
        stack: 'epi',
        barWidth: 16,
        data: epidemiologyRows.slice(0, 8).map((row) => row.cases),
        itemStyle: { borderRadius: [0, 0, 0, 0] },
      },
      {
        name: 'Décès',
        type: 'bar',
        stack: 'epi',
        barWidth: 16,
        data: epidemiologyRows.slice(0, 8).map((row) => row.deaths),
        itemStyle: { borderRadius: [0, 8, 8, 0] },
      },
    ],
  }), [epidemiologyRows])

  const infrastructureOption = useMemo(() => ({
    color: [ACCENT],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => `${params[0]?.axisValue || ''}<br/><b>${fmtInt(params[0]?.value || 0)}</b> structures`,
    },
    grid: { left: 170, right: 18, top: 16, bottom: 16 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => fmtCompact(value) },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    yAxis: {
      type: 'category',
      data: infrastructureRows.map((row) => row.type),
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        data: infrastructureRows.map((row) => row.value),
        itemStyle: { borderRadius: [0, 8, 8, 0] },
      },
    ],
  }), [infrastructureRows])

  return (
    <ModuleLayout
      accentColor={ACCENT}
      domaine="Santé"
      description="Carte d’accessibilité sanitaire, suivi de la couverture par région et lecture des indicateurs épidémiologiques. Sources : INSD, DGESS / Ministère de la Santé."
    >
      <div className="container">
        <div className="sante-page">
          <section className="sante-warning">
            <div>
              <h2>Couverture du module</h2>
              <p>
                Le module Santé est structuré autour de trois blocs principaux :
                une carte d’accessibilité aux formations sanitaires, une courbe de couverture sanitaire pilotable par région
                et un bloc d’indicateurs seuils épidémiologiques. La carte traduit ici un proxy d’accessibilité basé sur le
                nombre de centres recensés par région.
              </p>
            </div>
          </section>

          <section className="sante-filters">
            <label className="sante-filter-group">
              <span>Région</span>
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
                <option value="all">Toutes les régions</option>
                {availableRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </label>

            <label className="sante-filter-group">
              <span>Année infrastructures</span>
              <select value={selectedInfraYear} onChange={(event) => setSelectedInfraYear(event.target.value)}>
                {availableInfraYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="sante-kpis">
            <KpiCard
              label="Centres de santé recensés"
              value={fmtInt(totalCentres)}
              hint={topCentreRegion ? `Total national 2023 · région la mieux dotée : ${topCentreRegion.region}` : 'Chargement des centres'}
              highlight
            />
            <KpiCard
              label={selectedRegion === 'all' ? 'Région la mieux dotée' : 'Centres dans la région sélectionnée'}
              value={selectedRegion === 'all' ? (topCentreRegion ? fmtInt(topCentreRegion.value) : 'N/A') : fmtInt(selectedRegionCentreCount)}
              hint={selectedRegion === 'all' ? (topCentreRegion?.region || 'N/A') : `${selectedRegion} · proxy d’accessibilité`}
            />
            <KpiCard
              label="Couverture CPN2 la plus récente"
              value={latestCoveragePoint ? fmtPct(latestCoveragePoint.value) : 'N/A'}
              hint={latestCoveragePoint ? `${selectedRegion === 'all' ? 'Burkina Faso' : selectedRegion} · ${latestCoveragePoint.year} · variation ${coverageDelta >= 0 ? '+' : ''}${coverageDelta.toFixed(1)} pts` : 'Série indisponible'}
            />
            <KpiCard
              label="Pression épidémiologique 2024"
              value={fmtInt(totalCases)}
              hint={dominantDisease ? `${dominantDisease.disease} en tête · ${fmtInt(totalDeaths)} décès · létalité ${fmtPct(lethalityRate)}` : `Réf. ${epiMeta?.annee_reference || 'N/A'}`}
            />
          </section>

          <section className="sante-main-grid">
            <article className="sante-panel">
              <header className="sante-panel__header">
                <h2>Carte d’accessibilité aux centres de santé</h2>
                <p>Lecture choroplèthe par région sur le volume de centres fonctionnels recensés.</p>
              </header>

              <div className="sante-map-wrap">
                {regionsGeo ? (
                  <MapContainer center={BFA_CENTER} zoom={BFA_ZOOM} style={{ height: 420, width: '100%' }}>
                    <GeoJSON
                      data={regionsGeo}
                      style={(feature) => {
                        const region = feature?.properties?.shapeName || ''
                        const value = centreMap.get(normalizeName(region)) || 0
                        const ratio = Math.max(0.12, value / maxCentreValue)
                        const active = selectedRegion === 'all' || region === selectedRegion

                        return {
                          color: '#ffffff',
                          weight: active ? 1.2 : 0.9,
                          fillColor: `rgba(0, 105, 92, ${ratio.toFixed(3)})`,
                          fillOpacity: active ? 0.82 : 0.38,
                        }
                      }}
                      onEachFeature={(feature, layer) => {
                        const region = feature?.properties?.shapeName || 'N/A'
                        const value = centreMap.get(normalizeName(region)) || 0

                        layer.bindTooltip(
                          `<strong>${region}</strong><br/>${fmtInt(value)} centres de santé`,
                          { className: 'sante-leaflet-tooltip', sticky: true },
                        )

                        layer.on('click', () => {
                          setSelectedRegion((current) => (current === region ? 'all' : region))
                        })
                      }}
                    />
                    <ResetViewControl />
                  </MapContainer>
                ) : (
                  <div className="sante-placeholder">Chargement de la carte…</div>
                )}
              </div>

              <div className="sante-map-legend" aria-hidden="true">
                <span>Faible densité</span>
                <span className="sante-map-legend__bar" />
                <span>Forte densité</span>
              </div>
            </article>

            <article className="sante-panel">
              <header className="sante-panel__header">
                <h2>Courbe de couverture sanitaire par région</h2>
                <p>
                  Série CPN2 pour {selectedRegion === 'all' ? 'le Burkina Faso' : selectedRegion}, avec focalisation
                  régionale via la carte ou le filtre.
                </p>
              </header>

              {coverageSeries.length ? (
                <ReactECharts option={coverageOption} style={{ height: 360 }} notMerge lazyUpdate />
              ) : (
                <div className="sante-placeholder">Aucune série de couverture disponible pour cette sélection.</div>
              )}
            </article>
          </section>

          <section className="sante-bottom-grid">
            <article className="sante-panel">
              <header className="sante-panel__header">
                <h2>Indicateurs seuils épidémiologiques</h2>
                <p>
                  Cas et décès agrégés sur les principales maladies à surveillance. La sélection ci-dessus conserve la lecture
                  géographique sur les centres et infrastructures, tandis que ce bloc reste national pour l’année de référence.
                </p>
              </header>

              {epidemiologyRows.length ? (
                <ReactECharts option={epidemiologyOption} style={{ height: 360 }} notMerge lazyUpdate />
              ) : (
                <div className="sante-placeholder">Chargement des indicateurs épidémiologiques…</div>
              )}
            </article>

            <article className="sante-panel">
              <header className="sante-panel__header">
                <h2>Typologie des infrastructures sanitaires</h2>
                <p>
                  Répartition des structures pour {selectedRegion === 'all' ? 'l’ensemble des régions' : selectedRegion}
                  {selectedInfraYear !== 'all' ? ` en ${selectedInfraYear}` : ''}.
                </p>
              </header>

              {infrastructureRows.length ? (
                <ReactECharts option={infrastructureOption} style={{ height: 360 }} notMerge lazyUpdate />
              ) : (
                <div className="sante-placeholder">Aucune infrastructure disponible pour cette sélection.</div>
              )}
            </article>
          </section>

          <section className="sante-sources">
            <h2>Sources et limites de lecture</h2>
            <p>
              Sources mobilisées : DGESS / Ministère de la Santé pour les centres et infrastructures, INSD / EDS pour les séries
              de couverture, harmonisation CITADEL pour l’exposition frontend. La carte traduit un niveau de desserte relative par
              région à partir du stock de centres recensés ; elle ne mesure pas le temps réel d’accès routier ni la fonctionnalité
              clinique fine site par site.
            </p>
          </section>
        </div>
      </div>
    </ModuleLayout>
  )
}
