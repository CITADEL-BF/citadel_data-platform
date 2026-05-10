import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ModuleLayout from '../ModuleLayout'
import './PopulationPage.css'

const BFA_CENTER = [12.3, -1.56]
const BFA_ZOOM = 6
const ACCENT = '#0d631b'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtInt = (v) => Number(v || 0).toLocaleString('fr-FR')

const fmtK = (v) => {
  const n = Number(v || 0)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`
  return String(n)
}

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResetViewControl() {
  const map = useMap()
  return (
    <button
      type="button"
      className="pop-map-reset"
      title="Réinitialiser la vue"
      onClick={() => map.setView(BFA_CENTER, BFA_ZOOM)}
    >
      ⟳ Réinitialiser
    </button>
  )
}

function KpiCard({ label, value, hint, highlight }) {
  return (
    <article className={`pop-kpi${highlight ? ' pop-kpi--highlight' : ''}`}>
      <p className="pop-kpi__label label-sm">{label}</p>
      <p className="pop-kpi__value">{value}</p>
      {hint && <p className="pop-kpi__hint">{hint}</p>}
    </article>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PopulationPage() {
  // ── State ──
  const [kpi, setKpi] = useState(null)
  const [courbe, setCourbe] = useState(null)
  const [pdiMensuel, setPdiMensuel] = useState(null)
  const [vulnerabilite, setVulnerabilite] = useState(null)
  const [pyramide, setPyramide] = useState(null)
  const [comparaison, setComparaison] = useState(null)
  const [geoJson, setGeoJson] = useState(null)

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [mapLayer, setMapLayer] = useState('pdi') // 'pdi' | 'population'
  const [periodMode, setPeriodMode] = useState('annuel') // 'annuel' | 'mensuel' | 'avance'
  const [selectedType, setSelectedType] = useState('all')
  const [yearStart, setYearStart] = useState('all')
  const [yearEnd, setYearEnd] = useState('all')
  const [selectedVulnTheme, setSelectedVulnTheme] = useState('economie')

  // ── Data loading ──
  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/json/population/kpi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/courbe_pdi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/pdi_mensuel.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/vulnerabilite_menages.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/pyramide_demographique.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/comparaison_regionale.json')).then((r) => r.json()),
      fetch(withBase('data/viz/geojson/population_carte_pdi.geojson')).then((r) => r.json()),
    ])
      .then(([kpiData, courbeData, pdiMensuelData, vulnerabiliteData, pyramideData, comparaisonData, geoData]) => {
        setKpi(kpiData)
        setCourbe(courbeData)
        setPdiMensuel(pdiMensuelData)
        setVulnerabilite(vulnerabiliteData)
        setPyramide(pyramideData)
        setComparaison(comparaisonData)
        setGeoJson(geoData)
      })
      .catch(() => {})
  }, [])

  // ── Derived values ──

  const availableRegions = useMemo(() => {
    if (!geoJson) return []
    return geoJson.features
      .map((f) => f.properties?.region_norm || f.properties?.shapeName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr'))
  }, [geoJson])

  const regionValues = useMemo(() => {
    if (!geoJson) return new Map()
    const map = new Map()
    geoJson.features.forEach((f) => {
      const name = f.properties?.region_norm || f.properties?.shapeName || ''
      const val = mapLayer === 'pdi' ? (f.properties?.nb_pdi || 0) : (f.properties?.population || 0)
      map.set(name, val)
    })
    return map
  }, [geoJson, mapLayer])

  const mapMaxValue = useMemo(() => Math.max(...Array.from(regionValues.values()), 1), [regionValues])

  const geoJsonStyleFn = (feature) => {
    const name = feature?.properties?.region_norm || feature?.properties?.shapeName || ''
    const value = regionValues.get(name) || 0
    const isActive = selectedRegion === 'all' || name === selectedRegion
    const ratio = Math.min(value / mapMaxValue, 1)
    return {
      fillColor: ACCENT,
      fillOpacity: isActive && value > 0 ? 0.1 + ratio * 0.75 : 0.04,
      weight: 1,
      color: '#ffffff',
      opacity: 0.8,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = feature?.properties?.region_norm || feature?.properties?.shapeName || ''
    const pdi = feature?.properties?.nb_pdi || 0
    const pop = feature?.properties?.population || 0
    layer.bindTooltip(
      `<strong>${name}</strong><br/>PDI : ${fmtInt(pdi)}<br/>Population : ${fmtInt(pop)}`,
      { sticky: true, className: 'pop-leaflet-tooltip' },
    )
    layer.on('click', () => {
      setSelectedRegion((prev) => (prev === name ? 'all' : name))
    })
  }

  const geoJsonKey = `${mapLayer}-${selectedRegion}`

  const availableYears = useMemo(() => pdiMensuel?.years || [], [pdiMensuel])
  const availableTypes = useMemo(() => pdiMensuel?.types_deplacement || [], [pdiMensuel])

  const monthlyFilteredRows = useMemo(() => {
    const rows = pdiMensuel?.rows || []
    return rows.filter((row) => {
      if (selectedRegion !== 'all' && row.region !== selectedRegion) return false
      if (selectedType !== 'all' && row.type_deplacement !== selectedType) return false

      if (periodMode === 'avance') {
        if (yearStart !== 'all' && Number(row.annee) < Number(yearStart)) return false
        if (yearEnd !== 'all' && Number(row.annee) > Number(yearEnd)) return false
      }

      return true
    })
  }, [pdiMensuel, selectedRegion, selectedType, periodMode, yearStart, yearEnd])

  const monthlySeries = useMemo(() => {
    const grouped = new Map()

    monthlyFilteredRows.forEach((row) => {
      const key = `${row.annee}-${String(row.mois).padStart(2, '0')}`
      grouped.set(key, (grouped.get(key) || 0) + Number(row.pdi_personnes || 0))
    })

    const sortedKeys = Array.from(grouped.keys()).sort()
    return sortedKeys.map((key) => {
      const [year, month] = key.split('-').map(Number)
      return {
        label: `${String(month).padStart(2, '0')}/${year}`,
        value: grouped.get(key) || 0,
      }
    })
  }, [monthlyFilteredRows])

  // ── PDI evolution chart (annual/monthly/advanced) ──
  const courbeOption = useMemo(() => {
    const showMonthly = periodMode === 'mensuel' || periodMode === 'avance'
    if (showMonthly && !monthlySeries.length) return {}
    if (!showMonthly && !courbe) return {}

    const xData = showMonthly ? monthlySeries.map((p) => p.label) : (courbe.categories || [])
    const yData = showMonthly ? monthlySeries.map((p) => p.value) : (courbe.series?.[0]?.data || [])

    return {
      color: [ACCENT],
      tooltip: {
        trigger: 'axis',
        formatter: (params) =>
          `${params[0].axisValue} : <b>${fmtInt(params[0].value)}</b> PDI`,
      },
      grid: { left: 56, right: 16, top: 16, bottom: 48 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { fontSize: 11, rotate: showMonthly && xData.length > 8 ? 30 : 0 },
        axisLine: { lineStyle: { color: '#d0d0d0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, formatter: (v) => fmtK(v) },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [{
        type: 'line',
        data: yData,
        smooth: true,
        areaStyle: { color: `${ACCENT}18` },
        lineStyle: { color: ACCENT, width: 2.5 },
        itemStyle: { color: ACCENT },
        symbol: 'circle',
        symbolSize: 6,
      }],
    }
  }, [courbe, monthlySeries, periodMode])

  // ── Demographic pyramid ──
  const pyramideOption = useMemo(() => {
    if (!pyramide) return {}

    const TRANCHE_ORDER = [
      '0 - 4', '5 - 9', '10-14', '15 - 19', '20 - 24',
      '25 - 29', '30 - 34', '35 - 39', '40 - 44',
      '45 - 49', '50 - 54', '55 - 59', '60 - 64',
      '65 - 69', '70 - 74', '75 - 79', '80 ou +',
    ]

    const idx = (nom) => pyramide.tranches.indexOf(nom)
    const serieHomme = pyramide.series.find((s) => s.nom === 'Homme')
    const serieFemme = pyramide.series.find((s) => s.nom === 'Femme')

    const tranches = TRANCHE_ORDER.filter((t) => pyramide.tranches.includes(t))
    const hommeData = tranches.map((t) => -(serieHomme?.data[idx(t)] || 0))
    const femmeData = tranches.map((t) => serieFemme?.data[idx(t)] || 0)
    const absMax = Math.max(...hommeData.map(Math.abs), ...femmeData)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const tranche = params[0].axisValue
          const parts = params.map((p) => `${p.seriesName} : ${fmtInt(Math.abs(p.value))}`)
          return `<strong>${tranche}</strong><br/>${parts.join('<br/>')}`
        },
      },
      legend: { data: ['Hommes', 'Femmes'], bottom: 4, textStyle: { fontSize: 11 } },
      grid: { left: 64, right: 16, top: 8, bottom: 36 },
      xAxis: {
        type: 'value',
        min: -absMax * 1.05,
        max: absMax * 1.05,
        axisLabel: { fontSize: 10, formatter: (v) => fmtK(Math.abs(v)) },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      yAxis: {
        type: 'category',
        data: tranches,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          name: 'Hommes',
          type: 'bar',
          stack: 'pop',
          data: hommeData,
          itemStyle: { color: ACCENT },
          barMaxWidth: 18,
        },
        {
          name: 'Femmes',
          type: 'bar',
          stack: 'pop',
          data: femmeData,
          itemStyle: { color: '#4caf50' },
          barMaxWidth: 18,
        },
      ],
    }
  }, [pyramide])

  // ── Regional bar chart ──
  const comparaisonOption = useMemo(() => {
    if (!comparaison) return {}

    let cats = comparaison.categories || []
    let vals = comparaison.series?.[0]?.data || []

    if (selectedRegion !== 'all') {
      const i = cats.indexOf(selectedRegion)
      if (i !== -1) { cats = [cats[i]]; vals = [vals[i]] }
    }

    const paired = cats.map((c, i) => ({ cat: c, val: vals[i] })).sort((a, b) => b.val - a.val)

    return {
      color: [ACCENT],
      tooltip: {
        trigger: 'axis',
        formatter: (params) => `${params[0].axisValue} : <b>${fmtInt(params[0].value)}</b> hab.`,
      },
      grid: { left: 110, right: 16, top: 8, bottom: 32 },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: (v) => fmtK(v) },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      yAxis: {
        type: 'category',
        data: paired.map((p) => p.cat),
        axisLabel: { fontSize: 10 },
      },
      series: [{
        type: 'bar',
        data: paired.map((p) => p.val),
        itemStyle: { color: ACCENT },
        barMaxWidth: 22,
      }],
    }
  }, [comparaison, selectedRegion])

  // ── KPI shortcuts ──
  const kpiList = kpi?.kpis || []
  const kpiPop = kpiList.find((k) => k.id === 'pop_totale')
  const kpiCroissance = kpiList.find((k) => k.id === 'taux_croissance')
  const kpiPdi = kpiList.find((k) => k.id === 'pdi_total')
  const kpiRegions = kpiList.find((k) => k.id === 'regions_couvertes')

  const vulnTrend = vulnerabilite?.tendance_annuelle?.[selectedVulnTheme] || { annees: [], valeurs: [] }
  const vulnRegional = vulnerabilite?.comparaison_regionale_dernier_millesime?.[selectedVulnTheme] || {
    annee: null,
    regions: [],
    valeurs: [],
  }

  const vulnTrendOption = useMemo(() => ({
    color: ['#2E7D32'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 12, top: 16, bottom: 36 },
    xAxis: {
      type: 'category',
      data: vulnTrend.annees,
      axisLabel: { fontSize: 11 },
      axisLine: { lineStyle: { color: '#d0d0d0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, formatter: (v) => fmtK(v) },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [{
      type: 'line',
      smooth: true,
      data: vulnTrend.valeurs,
      lineStyle: { color: '#2E7D32', width: 2.2 },
      areaStyle: { color: 'rgba(46,125,50,0.12)' },
      symbol: 'circle',
      symbolSize: 5,
    }],
  }), [vulnTrend])

  const vulnRegionalOption = useMemo(() => ({
    color: ['#558B2F'],
    tooltip: { trigger: 'axis' },
    grid: { left: 110, right: 12, top: 12, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, formatter: (v) => fmtK(v) },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    yAxis: {
      type: 'category',
      data: vulnRegional.regions,
      axisLabel: { fontSize: 10 },
    },
    series: [{
      type: 'bar',
      data: vulnRegional.valeurs,
      barMaxWidth: 22,
      itemStyle: { color: '#558B2F' },
    }],
  }), [vulnRegional])

  return (
    <ModuleLayout
      accentColor={ACCENT}
      domaine="Population & PDI"
      description="Données démographiques, pyramide des âges, déplacements internes (PDI) et comparaisons régionales au Burkina Faso. Sources : INSD, IDMC, SP/CONASUR, OCHA / GCORR."
    >
      <div className="container pop-page">

        {/* ── Filtres ── */}
        <section className="pop-filters" aria-label="Filtres période, région, type de déplacement et couche carte">
          <label className="pop-filter-group" htmlFor="pop-region-select">
            <span className="label-sm">Région</span>
            <select
              id="pop-region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">Toutes les régions</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="pop-filter-group" htmlFor="pop-period-select">
            <span className="label-sm">Période</span>
            <select
              id="pop-period-select"
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value)}
            >
              <option value="annuel">Annuel</option>
              <option value="mensuel">Mensuel</option>
              <option value="avance">Avancé</option>
            </select>
          </label>

          <label className="pop-filter-group" htmlFor="pop-type-select">
            <span className="label-sm">Type de déplacement</span>
            <select
              id="pop-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          {periodMode === 'avance' ? (
            <div className="pop-advanced-filters">
              <label className="pop-filter-group" htmlFor="pop-year-start-select">
                <span className="label-sm">Année début</span>
                <select
                  id="pop-year-start-select"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                >
                  <option value="all">Min</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </label>

              <label className="pop-filter-group" htmlFor="pop-year-end-select">
                <span className="label-sm">Année fin</span>
                <select
                  id="pop-year-end-select"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value)}
                >
                  <option value="all">Max</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className="pop-filter-chips" role="group" aria-label="Couche de la carte">
            <button
              type="button"
              className={`pop-chip${mapLayer === 'pdi' ? ' pop-chip--active' : ''}`}
              onClick={() => setMapLayer('pdi')}
            >
              PDI
            </button>
            <button
              type="button"
              className={`pop-chip${mapLayer === 'population' ? ' pop-chip--active' : ''}`}
              onClick={() => setMapLayer('population')}
            >
              Population totale
            </button>
          </div>
        </section>

        {/* ── KPIs ── */}
        <section className="pop-kpis" aria-label="Indicateurs clés population">
          <KpiCard
            label="Population totale"
            value={kpiPop ? fmtInt(kpiPop.valeur) : '—'}
            hint={`INSD ${kpiPop?.annee || ''}`}
          />
          <KpiCard
            label="Taux de croissance"
            value={kpiCroissance ? `${kpiCroissance.valeur}%` : '—'}
            hint="annuel estimé"
          />
          <KpiCard
            label="PDI recensés"
            value={kpiPdi ? fmtInt(kpiPdi.valeur) : '—'}
            hint={`IDMC ${kpiPdi?.annee || ''} — stock`}
            highlight
          />
          <KpiCard
            label="Régions avec PDI"
            value={kpiRegions ? kpiRegions.valeur : '—'}
            hint={kpiRegions?.unite || ''}
          />
        </section>

        {/* ── Carte + Courbe PDI ── */}
        <section className="pop-main-grid" aria-label="Carte choroplèthe et évolution PDI">
          <article className="pop-panel pop-panel--map">
            <header className="pop-panel__header">
              <h2>{mapLayer === 'pdi' ? 'PDI par région' : 'Population par région'}</h2>
              <p>Cliquez sur une région pour filtrer •&nbsp;
                {mapLayer === 'pdi' ? 'GCORR / OCHA 2025' : 'INSD 2023'}
              </p>
            </header>

            <div className="pop-map-wrap">
              {geoJson ? (
                <MapContainer
                  center={BFA_CENTER}
                  zoom={BFA_ZOOM}
                  style={{ height: '340px', width: '100%', borderRadius: '6px' }}
                  minZoom={5}
                  maxZoom={9}
                  scrollWheelZoom
                  attributionControl={false}
                >
                  <GeoJSON
                    key={geoJsonKey}
                    data={geoJson}
                    style={geoJsonStyleFn}
                    onEachFeature={onEachFeature}
                  />
                  <ResetViewControl />
                </MapContainer>
              ) : (
                <div className="pop-placeholder-mini">Carte en cours de chargement…</div>
              )}
            </div>

            <div className="pop-map-legend" aria-hidden="true">
              <span>Faible</span>
              <div className="pop-map-legend__bar" />
              <span>Élevé</span>
            </div>
          </article>

          <article className="pop-panel">
            <header className="pop-panel__header">
              <h2>
                {periodMode === 'annuel' ? 'Évolution des PDI (2016–2024)' : 'Évolution mensuelle des PDI'}
              </h2>
              <p>
                {periodMode === 'annuel'
                  ? 'Stock de personnes déplacées internes — IDMC'
                  : 'Flux mensuels de déplacement — GCORR / OCHA'}
              </p>
            </header>

            {(periodMode === 'annuel' ? courbe : monthlySeries.length) ? (
              <ReactECharts
                option={courbeOption}
                style={{ height: '300px', width: '100%' }}
                notMerge
              />
            ) : (
              <div className="pop-placeholder-mini">Données en cours de chargement…</div>
            )}
          </article>
        </section>

        <section className="pop-contrib" aria-label="Appel à la contribution volontaire">
          <a
            className="pop-contrib__card"
            href="https://my.fasoarzeka.bf/"
            target="_blank"
            rel="noreferrer"
          >
            <div className="pop-contrib__badge">Solidarité nationale</div>
            <h2>Appel à la contribution volontaire — FASO ARZEKA</h2>
            <p>
              Soutenez les réponses humanitaires et l'assistance aux populations déplacées internes.
              Cliquez pour accéder à la plateforme officielle FASO ARZEKA.
            </p>
            <span className="pop-contrib__link">Accéder à my.fasoarzeka.bf →</span>
          </a>
        </section>

        <section className="pop-vuln" aria-label="Vulnérabilité des ménages">
          <header className="pop-vuln__header">
            <h2>Vulnérabilité des ménages</h2>
            <p>Axes économie, alimentaire et santé</p>
          </header>

          <div className="pop-filter-chips" role="group" aria-label="Thème de vulnérabilité">
            {[
              { key: 'economie', label: 'Économie' },
              { key: 'alimentaire', label: 'Alimentaire' },
              { key: 'sante', label: 'Santé' },
            ].map((theme) => (
              <button
                key={theme.key}
                type="button"
                className={`pop-chip${selectedVulnTheme === theme.key ? ' pop-chip--active' : ''}`}
                onClick={() => setSelectedVulnTheme(theme.key)}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <div className="pop-vuln-grid">
            <article className="pop-panel">
              <header className="pop-panel__header">
                <h2>Tendance annuelle</h2>
                <p>Moyenne nationale des indicateurs {selectedVulnTheme}</p>
              </header>
              {vulnTrend.annees.length ? (
                <ReactECharts
                  option={vulnTrendOption}
                  style={{ height: '300px', width: '100%' }}
                  notMerge
                />
              ) : (
                <div className="pop-placeholder-mini">Données indisponibles pour ce thème</div>
              )}
            </article>

            <article className="pop-panel">
              <header className="pop-panel__header">
                <h2>Comparaison régionale</h2>
                <p>Dernier millésime disponible: {vulnRegional.annee || 'N/A'}</p>
              </header>
              {vulnRegional.regions.length ? (
                <ReactECharts
                  option={vulnRegionalOption}
                  style={{ height: '300px', width: '100%' }}
                  notMerge
                />
              ) : (
                <div className="pop-placeholder-mini">Pas de ventilation régionale disponible</div>
              )}
            </article>
          </div>
        </section>

        {/* ── Pyramide + Comparaison régionale ── */}
        <section className="pop-bottom-grid" aria-label="Pyramide démographique et comparaison régionale">
          <article className="pop-panel">
            <header className="pop-panel__header">
              <h2>Pyramide démographique nationale</h2>
              <p>Par tranche d'âge et par sexe — INSD 2019</p>
            </header>

            {pyramide ? (
              <ReactECharts
                option={pyramideOption}
                style={{ height: '420px', width: '100%' }}
                notMerge
              />
            ) : (
              <div className="pop-placeholder-mini">Données en cours de chargement…</div>
            )}
          </article>

          <article className="pop-panel">
            <header className="pop-panel__header">
              <h2>Population par région</h2>
              <p>Comparaison inter-régionale (INSD 2023)</p>
            </header>

            {comparaison ? (
              <ReactECharts
                option={comparaisonOption}
                style={{ height: '420px', width: '100%' }}
                notMerge
              />
            ) : (
              <div className="pop-placeholder-mini">Données en cours de chargement…</div>
            )}
          </article>
        </section>

        {/* ── Sources ── */}
        <section className="pop-sources" aria-label="Sources de données">
          <h2>Sources et couverture des données</h2>
          <p>
            Démographie : INSD (recensements 1985, 1996, 2006, 2019 ; projections 2023).
            PDI : IDMC — Global Internal Displacement Database (2016–2024) ; GCORR / OCHA (mai 2025).
          </p>
          <p className="pop-sources__note">
            La carte PDI couvre 8 des 13 régions documentées (données GCORR mai 2025).
            Les régions sans donnée PDI s'affichent en gris clair. La pyramide est basée sur le RGPH 2019.
          </p>
          <p className="pop-sources__note">
            Les indicateurs de vulnérabilité des ménages sont regroupés en trois thèmes analytiques
            (économie, alimentaire, santé) à partir des jeux INSD / Afristat harmonisés.
          </p>
        </section>

      </div>
    </ModuleLayout>
  )
}
