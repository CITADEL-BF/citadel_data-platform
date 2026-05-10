import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ModuleLayout from '../ModuleLayout'
import './SecuritePage.css'

const BFA_CENTER = [12.3, -1.56]
const BFA_ZOOM = 6

function ResetViewControl() {
  const map = useMap()
  return (
    <button
      type="button"
      className="securite-map-reset"
      title="Réinitialiser la vue"
      onClick={() => map.setView(BFA_CENTER, BFA_ZOOM)}
    >
      ⟳ Réinitialiser
    </button>
  )
}

const PERIOD_CONFIG = {
  '30j': { label: 'Derniers 30 jours', months: 1 },
  trimestriel: { label: 'Trimestriel', months: 3 },
  annuel: { label: 'Annuel', months: 12 },
}

const MONTHS_FR = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPE_LABEL = {
  civilian_targeting: 'Cibles civiles',
  political_violence: 'Violence politique',
  demonstrations: 'Manifestations',
}

const REGION_FROM_SHAPE = {
  centre: 'Centre',
  est: 'Est',
  nord: 'Nord',
  sahel: 'Sahel',
  cascades: 'Cascades',
  'centre-est': 'Centre-Est',
  'centre-nord': 'Centre-Nord',
  'centre-ouest': 'Centre-Ouest',
  'centre-sud': 'Centre-Sud',
  'hauts-bassins': 'Hauts-Bassins',
  'plateau-central': 'Plateau-Central',
  'sud-ouest': 'Sud-Ouest',
  'boucle-du-mouhoun': 'Boucle du Mouhoun',
}

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',')
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim()
    })
    return row
  })
}

const normalizeName = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const fmtInt = (value) => Number(value || 0).toLocaleString('fr-FR')

export default function SecuritePage() {
  const [period, setPeriod] = useState('30j')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [monthlyRows, setMonthlyRows] = useState([])
  const [seriesRows, setSeriesRows] = useState([])
  const [kpiMeta, setKpiMeta] = useState(null)
  const [mapGeoJson, setMapGeoJson] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/csv/securite_incidents_hrp_mensuel.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/csv/securite_series_annuelles.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/json/securite/kpi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/geojson/bfa_regions_boundaries.geojson')).then((r) => r.json()),
    ])
      .then(([monthlyText, seriesText, kpiJson, regionsGeo]) => {
        const monthlyParsed = parseCsv(monthlyText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          mois_num: Number(row.mois_num || 0),
          nb_evenements: Number(row.nb_evenements || 0),
          nb_deces: Number(row.nb_deces || 0),
        }))
        setMonthlyRows(monthlyParsed)

        const yearlyParsed = parseCsv(seriesText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          nb_evenements_civils: Number(row.nb_evenements_civils || 0),
          nb_deces_civils: Number(row.nb_deces_civils || 0),
          nb_deces_totaux: Number(row.nb_deces_totaux || 0),
          nb_violence_politique: Number(row.nb_violence_politique || 0),
          nb_manifestations: Number(row.nb_manifestations || 0),
        }))
        setSeriesRows(yearlyParsed)

        setKpiMeta(kpiJson?.meta || null)
        setMapGeoJson(regionsGeo || null)
      })
      .catch(() => {
        setMonthlyRows([])
        setSeriesRows([])
        setMapGeoJson(null)
      })
  }, [])

  const availableRegions = useMemo(() => {
    const all = new Set(monthlyRows.map((r) => r.region).filter(Boolean))
    return Array.from(all).sort((a, b) => a.localeCompare(b))
  }, [monthlyRows])

  const monthKeys = useMemo(() => {
    const uniq = new Set()
    monthlyRows.forEach((row) => {
      if (!row.annee || !row.mois_num) return
      uniq.add(`${row.annee}-${String(row.mois_num).padStart(2, '0')}`)
    })

    return Array.from(uniq).sort()
  }, [monthlyRows])

  const selectedWindow = useMemo(() => {
    const monthsCount = PERIOD_CONFIG[period].months
    const keys = monthKeys.slice(-monthsCount)
    const previous = monthKeys.slice(-(monthsCount * 2), -monthsCount)
    return { keys, previous }
  }, [monthKeys, period])

  const filteredRows = useMemo(() => {
    const allowed = new Set(selectedWindow.keys)
    return monthlyRows.filter((row) => {
      const monthKey = `${row.annee}-${String(row.mois_num).padStart(2, '0')}`
      if (!allowed.has(monthKey)) return false
      if (selectedRegion !== 'all' && row.region !== selectedRegion) return false
      return true
    })
  }, [monthlyRows, selectedWindow, selectedRegion])

  const previousRows = useMemo(() => {
    const allowed = new Set(selectedWindow.previous)
    return monthlyRows.filter((row) => {
      const monthKey = `${row.annee}-${String(row.mois_num).padStart(2, '0')}`
      if (!allowed.has(monthKey)) return false
      if (selectedRegion !== 'all' && row.region !== selectedRegion) return false
      return true
    })
  }, [monthlyRows, selectedWindow, selectedRegion])

  const regionIncidents = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((row) => {
      map.set(row.region, (map.get(row.region) || 0) + row.nb_evenements)
    })
    return map
  }, [filteredRows])

  const totalIncidents = useMemo(() => (
    filteredRows.reduce((acc, row) => acc + row.nb_evenements, 0)
  ), [filteredRows])

  const previousTotalIncidents = useMemo(() => (
    previousRows.reduce((acc, row) => acc + row.nb_evenements, 0)
  ), [previousRows])

  const trendPct = useMemo(() => {
    if (previousTotalIncidents <= 0) return 0
    return ((totalIncidents - previousTotalIncidents) / previousTotalIncidents) * 100
  }, [totalIncidents, previousTotalIncidents])

  const topRegion = useMemo(() => {
    let winner = { name: 'Aucune', incidents: 0 }
    regionIncidents.forEach((incidents, name) => {
      if (incidents > winner.incidents) {
        winner = { name, incidents }
      }
    })
    return winner
  }, [regionIncidents])

  const touchedRegions = useMemo(() => (
    Array.from(regionIncidents.values()).filter((value) => value > 0).length
  ), [regionIncidents])

  const monthlyTrend = useMemo(() => {
    const sourceRows = selectedRegion === 'all'
      ? monthlyRows
      : monthlyRows.filter((row) => row.region === selectedRegion)

    const grouped = new Map()
    sourceRows.forEach((row) => {
      const key = `${row.annee}-${String(row.mois_num).padStart(2, '0')}`
      grouped.set(key, (grouped.get(key) || 0) + row.nb_evenements)
    })

    return selectedWindow.keys.map((key) => {
      const [year, month] = key.split('-').map(Number)
      return {
        key,
        label: `${MONTHS_FR[(month || 1) - 1]} ${year}`,
        value: grouped.get(key) || 0,
      }
    })
  }, [monthlyRows, selectedWindow, selectedRegion])

  const typeDistribution = useMemo(() => {
    const grouped = new Map()
    filteredRows.forEach((row) => {
      grouped.set(row.type_evenement, (grouped.get(row.type_evenement) || 0) + row.nb_evenements)
    })

    return Array.from(grouped.entries())
      .map(([type, value]) => ({ type, label: TYPE_LABEL[type] || type, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredRows])

  const mapMaxValue = useMemo(() => {
    const values = Array.from(regionIncidents.values())
    return Math.max(...values, 1)
  }, [regionIncidents])

  const tableRows = useMemo(() => {
    const grouped = new Map()

    filteredRows.forEach((row) => {
      if (row.nb_evenements <= 0) return
      const key = [row.annee, row.mois_num, row.province, row.type_evenement].join('|')
      const current = grouped.get(key) || {
        annee: row.annee,
        mois_num: row.mois_num,
        province: row.province,
        type_evenement: row.type_evenement,
        nb_evenements: 0,
      }
      current.nb_evenements += row.nb_evenements
      grouped.set(key, current)
    })

    return Array.from(grouped.values())
      .sort((a, b) => b.nb_evenements - a.nb_evenements)
      .slice(0, 12)
  }, [filteredRows])

  const lineChartOption = useMemo(() => ({
    color: ['#AF0012'],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => `${params[0].axisValue} : <b>${params[0].value}</b> incident${params[0].value !== 1 ? 's' : ''}`,
    },
    grid: { left: 44, right: 16, top: 16, bottom: 52 },
    xAxis: {
      type: 'category',
      data: monthlyTrend.map((p) => p.label),
      axisLabel: { fontSize: 11, rotate: monthlyTrend.length > 4 ? 30 : 0 },
      axisLine: { lineStyle: { color: '#d0d0d0' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'line',
      data: monthlyTrend.map((p) => p.value),
      smooth: true,
      areaStyle: { color: 'rgba(175,0,18,0.1)' },
      lineStyle: { color: '#AF0012', width: 2 },
      itemStyle: { color: '#AF0012' },
      symbol: 'circle',
      symbolSize: 5,
    }],
  }), [monthlyTrend])

  const geoJsonKey = `${period}-${selectedRegion}-${totalIncidents}`

  const geoJsonStyleFn = (feature) => {
    const normalized = normalizeName(feature?.properties?.shapeName)
    const regionName = REGION_FROM_SHAPE[normalized]
    const value = regionIncidents.get(regionName) || 0
    const isSelected = selectedRegion === 'all' || regionName === selectedRegion
    const ratio = Math.min(value / mapMaxValue, 1)
    return {
      fillColor: '#AF0012',
      fillOpacity: isSelected && value > 0 ? 0.12 + ratio * 0.73 : 0.04,
      weight: 1,
      color: '#ffffff',
      opacity: 0.8,
    }
  }

  const onEachFeature = (feature, layer) => {
    const normalized = normalizeName(feature?.properties?.shapeName)
    const regionName = REGION_FROM_SHAPE[normalized] || feature?.properties?.shapeName || ''
    const value = regionIncidents.get(regionName) || 0
    layer.bindTooltip(
      `<strong>${regionName}</strong><br/>${fmtInt(value)} incident${value !== 1 ? 's' : ''}`,
      { sticky: true, className: 'securite-leaflet-tooltip' },
    )
  }

  const yearlyLatest = seriesRows[seriesRows.length - 1] || null

  return (
    <ModuleLayout
      accentColor="#AF0012"
      domaine="Sécurité & Stabilité"
      description="Surveillance des incidents sécuritaires au Burkina Faso. Sources : ACLED / HDX, HRP Burkina Faso et harmonisation CITADEL."
    >
      <div className="container securite-page">
        <section className="securite-warning" role="note" aria-live="polite">
          <div className="securite-warning__icon" aria-hidden="true">!</div>
          <div>
            <p className="securite-warning__title">Avertissement de sensibilité</p>
            <p className="securite-warning__text">
              Ces indicateurs concernent des incidents de sécurité et restent sensibles. Les données sont agrégées pour l'analyse
              et ne doivent pas être interprétées comme une alerte opérationnelle en temps réel.
            </p>
          </div>
        </section>

        <section className="securite-filters" aria-label="Filtres temporels et géographiques">
          <div className="securite-filter-chips" role="tablist" aria-label="Période d'analyse">
            {Object.entries(PERIOD_CONFIG).map(([value, cfg]) => (
              <button
                key={value}
                type="button"
                className={`securite-chip${period === value ? ' securite-chip--active' : ''}`}
                onClick={() => setPeriod(value)}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <label className="securite-region-filter" htmlFor="securite-region-select">
            <span className="label-sm">Région</span>
            <select
              id="securite-region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">Toutes les régions</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="securite-kpis" aria-label="Indicateurs clés sécurité">
          <article className="securite-kpi-card">
            <p className="label-sm">Incidents totalisés</p>
            <p className="securite-kpi-card__value">{fmtInt(totalIncidents)}</p>
            <p className="securite-kpi-card__hint">Fenêtre: {PERIOD_CONFIG[period].label.toLowerCase()}</p>
          </article>

          <article className="securite-kpi-card">
            <p className="label-sm">Régions touchées</p>
            <p className="securite-kpi-card__value">{fmtInt(touchedRegions)}</p>
            <p className="securite-kpi-card__hint">sur {fmtInt(availableRegions.length)} régions</p>
          </article>

          <article className="securite-kpi-card securite-kpi-card--critical">
            <p className="label-sm">Région la plus touchée</p>
            <p className="securite-kpi-card__value securite-kpi-card__value--sm">{topRegion.name}</p>
            <p className="securite-kpi-card__hint">{fmtInt(topRegion.incidents)} incidents</p>
          </article>

          <article className="securite-kpi-card">
            <p className="label-sm">Tendance</p>
            <p className={`securite-kpi-card__value ${trendPct > 0 ? 'is-up' : trendPct < 0 ? 'is-down' : ''}`}>
              {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}%
            </p>
            <p className="securite-kpi-card__hint">vs période précédente</p>
          </article>
        </section>

        <section className="securite-main-grid" aria-label="Carte thermique et évolution temporelle">
          <article className="securite-panel securite-panel--map">
            <header className="securite-panel__header">
              <h2>Densité régionale des incidents</h2>
              <p>Intensité selon la période sélectionnée</p>
            </header>

            <div className="securite-map-wrap">
              {mapGeoJson ? (
                <MapContainer
                  center={BFA_CENTER}
                  zoom={BFA_ZOOM}
                  style={{ height: '340px', width: '100%', borderRadius: '6px' }}
                  minZoom={5}
                  maxZoom={9}
                  zoomControl
                  scrollWheelZoom
                  touchZoom
                  doubleClickZoom
                  boxZoom
                  attributionControl={false}
                >
                  <GeoJSON
                    key={geoJsonKey}
                    data={mapGeoJson}
                    style={geoJsonStyleFn}
                    onEachFeature={onEachFeature}
                  />
                  <ResetViewControl />
                </MapContainer>
              ) : (
                <p className="securite-empty">Carte indisponible</p>
              )}
            </div>

            <div className="securite-map-legend" aria-hidden="true">
              <span>Faible</span>
              <div className="securite-map-legend__bar" />
              <span>Élevé</span>
            </div>
          </article>

          <article className="securite-panel">
            <header className="securite-panel__header">
              <h2>Chronologie des incidents</h2>
              <p>Évolution mensuelle des incidents</p>
            </header>

            <div className="securite-linechart-wrap">
              {monthlyTrend.length ? (
                <ReactECharts
                  option={lineChartOption}
                  style={{ height: '300px', width: '100%' }}
                  notMerge
                />
              ) : (
                <p className="securite-empty">Données temporelles indisponibles</p>
              )}
            </div>
          </article>
        </section>

        <section className="securite-bottom-grid" aria-label="Type d'incident et registre consolidé">
          <article className="securite-panel">
            <header className="securite-panel__header">
              <h2>Répartition par type</h2>
              <p>Nombre d'incidents sur la fenêtre active</p>
            </header>

            <div className="securite-bars">
              {typeDistribution.map((item) => {
                const ratio = totalIncidents > 0 ? (item.value / totalIncidents) * 100 : 0
                return (
                  <div className="securite-bar" key={item.type}>
                    <div className="securite-bar__label-row">
                      <span>{item.label}</span>
                      <strong>{fmtInt(item.value)}</strong>
                    </div>
                    <div className="securite-bar__track">
                      <div className="securite-bar__fill" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="securite-panel securite-panel--table">
            <header className="securite-panel__header">
              <h2>Registre des incidents</h2>
              <p>Date, province, type et source</p>
            </header>

            <div className="securite-table-wrap">
              <table className="securite-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Province</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={`${row.annee}-${row.mois_num}-${row.province}-${row.type_evenement}`}>
                      <td>{MONTHS_FR[row.mois_num - 1]} {row.annee}</td>
                      <td>{row.province}</td>
                      <td>{TYPE_LABEL[row.type_evenement] || row.type_evenement}</td>
                      <td>ACLED / HDX</td>
                      <td>{fmtInt(row.nb_evenements)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="securite-sources" aria-label="Sources et contexte">
          <h2>Sources et avertissements</h2>
          <p>
            Les chiffres proviennent des jeux harmonisés CITADEL (mise à jour: {kpiMeta?.mise_a_jour || 'N/A'})
            à partir d'ACLED et HDX. Les incidents sont consolidés à des fins analytiques et de pilotage stratégique.
          </p>
          {yearlyLatest ? (
            <p className="securite-sources__meta">
              Référence annuelle la plus récente: {yearlyLatest.annee} • Déces totaux: {fmtInt(yearlyLatest.nb_deces_totaux)} •
              Violence politique: {fmtInt(yearlyLatest.nb_violence_politique)}
            </p>
          ) : null}
        </section>
      </div>
    </ModuleLayout>
  )
}
