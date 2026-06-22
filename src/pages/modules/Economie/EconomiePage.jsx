import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { GeoJSON, MapContainer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ModuleLayout from '../ModuleLayout'
import './EconomiePage.css'

const BFA_CENTER = [12.3, -1.56]
const BFA_ZOOM = 6
const ACCENT = '#A16D00'

const MONTH_ORDER = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
}

const PRODUCT_ORDER = [
  'mil',
  'sorgho',
  'sorgho (white)',
  'mais',
  'mais (white)',
  'riz',
  'riz (local)',
  'riz (imported)',
  'haricots (niebe)',
]

const EMPLOYMENT_PROFILE_LABELS = {
  Ensemble: 'Ensemble',
  Homme: 'Hommes',
  Femme: 'Femmes',
  Masculin: 'Hommes',
  Féminin: 'Femmes',
}

const fmtInt = (value) => Number(value || 0).toLocaleString('fr-FR')
const fmtPrice = (value) => `${Number(value || 0).toFixed(0)} FCFA`
const fmtPct = (value) => `${Number(value || 0).toFixed(1)}%`
const fmtSignedPct = (value) => `${value > 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`
const fmtCompact = (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
const fmtFcfaAxis = (value) => {
  const amount = Number(value || 0)
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)} Md`
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} M`
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(abs >= 10_000 ? 0 : 1)} k`
  return fmtInt(amount)
}
const fmtFcfaFull = (value) => `${fmtInt(Math.round(Number(value || 0)))} FCFA`

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const normalizeName = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const formatProductLabel = (value) => {
  const labels = {
    mil: 'Mil',
    sorgho: 'Sorgho',
    'sorgho (white)': 'Sorgho blanc',
    mais: 'Maïs',
    'mais (white)': 'Maïs blanc',
    riz: 'Riz',
    'riz (local)': 'Riz local',
    'riz (imported)': 'Riz importé',
    'haricots (niebe)': 'Haricots niébé',
  }
  return labels[value] || String(value || '')
}

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
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

const quantile = (values, q) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]
  if (next === undefined) return sorted[base]
  return sorted[base] + rest * (next - sorted[base])
}

function ResetViewControl() {
  const map = useMap()
  return (
    <button
      type="button"
      className="eco-map-reset"
      title="Réinitialiser la vue"
      onClick={() => map.setView(BFA_CENTER, BFA_ZOOM)}
    >
      ⟳ Réinitialiser
    </button>
  )
}

function KpiCard({ label, value, hint, highlight }) {
  return (
    <article className={`eco-kpi${highlight ? ' eco-kpi--highlight' : ''}`}>
      <p className="eco-kpi__label label-sm">{label}</p>
      <p className="eco-kpi__value">{value}</p>
      {hint && <p className="eco-kpi__hint">{hint}</p>}
    </article>
  )
}

export default function EconomiePage() {
  const [priceRows, setPriceRows] = useState([])
  const [employmentRows, setEmploymentRows] = useState([])
  const [regionsGeo, setRegionsGeo] = useState(null)
  const [employmentRate, setEmploymentRate] = useState(null)
  const [activityRate, setActivityRate] = useState(null)
  const [workforceSeries, setWorkforceSeries] = useState(null)
  const [regionalEmploymentRate, setRegionalEmploymentRate] = useState(null)
  const [femaleWorkforceShare, setFemaleWorkforceShare] = useState(null)
  const [salariedWorkersShare, setSalariedWorkersShare] = useState(null)
  const [activityDomains, setActivityDomains] = useState(null)
  const [workersByBranch, setWorkersByBranch] = useState(null)
  const [pmeAge, setPmeAge] = useState(null)
  const [pmeStatus, setPmeStatus] = useState(null)
  const [turnoverByBranch, setTurnoverByBranch] = useState(null)

  const [selectedProduct, setSelectedProduct] = useState('mil')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [priceStartYear, setPriceStartYear] = useState('all')
  const [priceEndYear, setPriceEndYear] = useState('all')
  const [compareYear, setCompareYear] = useState('all')
  const [employmentScope, setEmploymentScope] = useState('national')
  const [employmentMetric, setEmploymentMetric] = useState('activity_rate')
  const [employmentProfile, setEmploymentProfile] = useState('sex')

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/csv/economie_prix_alimentaires.csv')).then((response) => response.text()),
      fetch(withBase('data/viz/csv/economie_emploi_chomage.csv')).then((response) => response.text()),
      fetch(withBase('data/viz/geojson/bfa_regions_boundaries.geojson')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/serie_taux_emploi.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/serie_taux_activite.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/serie_main_oeuvre_totale.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/comparaison_regionale_taux_emploi.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/serie_part_main_oeuvre_feminine.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/serie_part_travailleurs_salaries.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/activites_domaines_cefore.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/activites_travailleurs_branche_sexe.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/pme_age_promoteur.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/pme_statut_juridique.json')).then((response) => response.json()),
      fetch(withBase('data/viz/json/economie/activites_chiffre_affaires_branche.json')).then((response) => response.json()),
    ])
      .then(([
        priceText,
        employmentText,
        geoData,
        employmentRateData,
        activityRateData,
        workforceData,
        regionalEmploymentData,
        femaleWorkforceShareData,
        salariedWorkersShareData,
        domainData,
        workersData,
        ageData,
        statusData,
        turnoverData,
      ]) => {
        const parsedPrices = parseCsv(priceText).map((row) => ({
          ...row,
          produit: String(row.produit || '').trim().toLowerCase(),
          region_norm: String(row.region_norm || '').trim(),
          annee: Number(row.annee || 0),
          prix_local: Number(row.prix_local || 0),
          date: String(row.date || row.periode_normalisee || '').trim(),
        }))

        const parsedEmployment = parseCsv(employmentText).map((row) => ({
          ...row,
          milieu: String(row.milieu || '').trim(),
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || row.value || 0),
        }))

        setPriceRows(parsedPrices)
        setEmploymentRows(parsedEmployment)
        setRegionsGeo(geoData || null)
        setEmploymentRate(employmentRateData || null)
        setActivityRate(activityRateData || null)
        setWorkforceSeries(workforceData || null)
        setRegionalEmploymentRate(regionalEmploymentData || null)
        setFemaleWorkforceShare(femaleWorkforceShareData || null)
        setSalariedWorkersShare(salariedWorkersShareData || null)
        setActivityDomains(domainData || null)
        setWorkersByBranch(workersData || null)
        setPmeAge(ageData || null)
        setPmeStatus(statusData || null)
        setTurnoverByBranch(turnoverData || null)
      })
      .catch(() => {})
  }, [])

  const availableProducts = useMemo(() => {
    const set = new Set(priceRows.map((row) => row.produit).filter(Boolean))
    return Array.from(set).sort((left, right) => {
      const leftIndex = PRODUCT_ORDER.indexOf(left)
      const rightIndex = PRODUCT_ORDER.indexOf(right)
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, 'fr')
      if (leftIndex === -1) return 1
      if (rightIndex === -1) return -1
      return leftIndex - rightIndex
    })
  }, [priceRows])

  useEffect(() => {
    if (availableProducts.includes(selectedProduct)) return
    if (availableProducts.length) setSelectedProduct(availableProducts[0])
  }, [availableProducts, selectedProduct])

  const availableYears = useMemo(() => {
    const years = new Set(
      priceRows
        .filter((row) => row.produit === selectedProduct)
        .map((row) => row.annee)
        .filter(Boolean),
    )

    return Array.from(years).sort((a, b) => a - b)
  }, [priceRows, selectedProduct])

  useEffect(() => {
    if (!availableYears.length) return

    const latestYear = String(availableYears[availableYears.length - 1])
    const startYear = String(availableYears[Math.max(0, availableYears.length - 10)])

    if (priceStartYear === 'all') setPriceStartYear(startYear)
    if (priceEndYear === 'all') setPriceEndYear(latestYear)
    if (compareYear === 'all') setCompareYear(latestYear)
  }, [availableYears, priceStartYear, priceEndYear, compareYear])

  const availableRegions = useMemo(() => {
    const regions = new Set(priceRows.map((row) => row.region_norm).filter(Boolean))
    return Array.from(regions).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [priceRows])

  const filteredPriceRows = useMemo(() => {
    const start = Number(priceStartYear)
    const end = Number(priceEndYear)

    return priceRows.filter((row) => {
      if (row.produit !== selectedProduct) return false
      if (selectedRegion !== 'all' && row.region_norm !== selectedRegion) return false
      if (priceStartYear !== 'all' && row.annee < start) return false
      if (priceEndYear !== 'all' && row.annee > end) return false
      return true
    })
  }, [priceRows, selectedProduct, selectedRegion, priceStartYear, priceEndYear])

  const priceTimeline = useMemo(() => {
    const groups = new Map()

    filteredPriceRows.forEach((row) => {
      const rawDate = String(row.date || '').toLowerCase()
      const monthLabel = rawDate.split(' ')[0]
      const monthIndex = MONTH_ORDER[monthLabel] || 0
      const key = `${row.annee}-${String(monthIndex).padStart(2, '0')}`
      const entry = groups.get(key) || {
        label: row.date || String(row.annee),
        total: 0,
        count: 0,
      }

      entry.total += Number(row.prix_local || 0)
      entry.count += 1
      groups.set(key, entry)
    })

    return Array.from(groups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([, entry]) => ({
        label: entry.label,
        value: entry.count ? entry.total / entry.count : 0,
      }))
  }, [filteredPriceRows])

  const latestPricePoint = priceTimeline[priceTimeline.length - 1] || null
  const firstPricePoint = priceTimeline[0] || null
  const priceVariation = latestPricePoint && firstPricePoint && firstPricePoint.value > 0
    ? ((latestPricePoint.value - firstPricePoint.value) / firstPricePoint.value) * 100
    : 0

  const compareRows = useMemo(() => {
    const year = Number(compareYear)
    const scopedRows = priceRows.filter((row) => {
      if (row.produit !== selectedProduct) return false
      if (compareYear !== 'all' && row.annee !== year) return false
      if (!row.region_norm) return false
      return Number.isFinite(Number(row.prix_local))
    })

    const values = scopedRows.map((row) => Number(row.prix_local || 0))
    const q1 = quantile(values, 0.25)
    const q3 = quantile(values, 0.75)
    const iqr = q1 !== null && q3 !== null ? q3 - q1 : null
    const lowerBound = iqr !== null ? q1 - 1.5 * iqr : null
    const upperBound = iqr !== null ? q3 + 1.5 * iqr : null

    const cleanedRows = scopedRows.filter((row) => {
      if (lowerBound === null || upperBound === null) return true
      const value = Number(row.prix_local || 0)
      return value >= lowerBound && value <= upperBound
    })

    const groups = new Map()
    cleanedRows.forEach((row) => {
      const key = row.region_norm
      const valuesByRegion = groups.get(key) || []
      valuesByRegion.push(Number(row.prix_local || 0))
      groups.set(key, valuesByRegion)
    })

    return Array.from(groups.entries())
      .map(([region, regionValues]) => ({
        region,
        value: quantile(regionValues, 0.5) || 0,
      }))
      .sort((left, right) => right.value - left.value)
  }, [priceRows, selectedProduct, compareYear])

  const compareMap = useMemo(() => {
    const map = new Map()
    compareRows.forEach((row) => {
      map.set(normalizeName(row.region), row.value)
    })
    return map
  }, [compareRows])

  const maxCompareValue = useMemo(() => Math.max(...compareRows.map((row) => row.value), 1), [compareRows])

  const employmentSeries = useMemo(() => {
    const years = Array.from(new Set(employmentRows.map((row) => row.annee).filter(Boolean))).sort((a, b) => a - b)
    const milieux = Array.from(new Set(employmentRows.map((row) => row.milieu).filter(Boolean)))

    return {
      years,
      series: milieux.map((milieu) => ({
        name: milieu,
        data: years.map((year) => {
          const row = employmentRows.find((item) => item.milieu === milieu && item.annee === year)
          return row ? Number(row.valeur || 0) : null
        }),
      })),
    }
  }, [employmentRows])

  const latestEmploymentYear = employmentSeries.years[employmentSeries.years.length - 1] || null
  const latestEmploymentOverall = employmentRows.find((row) => row.milieu === 'Ensemble' && row.annee === latestEmploymentYear)
  const latestEmploymentUrban = employmentRows.find((row) => row.milieu === 'Urbain' && row.annee === latestEmploymentYear)
  const latestEmploymentRateOverall = employmentRate?.series?.find((serie) => serie.nom === 'Ensemble')?.data?.slice(-1)[0] ?? null
  const latestActivityRateOverall = activityRate?.series?.find((serie) => serie.nom === 'Ensemble')?.data?.slice(-1)[0] ?? null
  const latestWorkforceTotal = workforceSeries?.series?.[0]?.data?.slice(-1)[0] ?? null
  const latestFemaleWorkforceShare = femaleWorkforceShare?.series?.[0]?.data?.slice(-1)[0] ?? null
  const latestSalariedWorkersShare = salariedWorkersShare?.series?.[0]?.data?.slice(-1)[0] ?? null
  const latestCeForeTotal = activityDomains?.total_annee_reference || pmeAge?.total_annee_reference || null
  const dominantCeForeDomain = activityDomains?.series?.[0]?.nom || null
  const leadingLegalStatus = pmeStatus?.categories?.[0] || null

  const unemploymentDataset = useMemo(() => ({
    meta: {
      titre: "Évolution du chômage par milieu de résidence",
      unite: '%',
      source: 'INSD / SSN / MFSFN',
    },
    categories: employmentSeries.years,
    series: employmentSeries.series.map((serie) => ({ nom: serie.name, data: serie.data })),
    annee_reference: latestEmploymentYear,
  }), [employmentSeries, latestEmploymentYear])

  const employmentNationalOptions = useMemo(() => ([
    { value: 'activity_rate', label: 'Taux d’activité', dataset: activityRate, description: 'Lecture comparée ensemble, hommes et femmes à l’échelle nationale.', kind: 'rate' },
    { value: 'employment_rate', label: 'Taux d’emploi', dataset: employmentRate, description: 'Taux d’emploi national avec vue d’ensemble ou ventilation par sexe.', kind: 'rate' },
    { value: 'unemployment', label: 'Chômage par milieu', dataset: unemploymentDataset, description: 'Série harmonisée par milieu de résidence, utile comme point de référence.', kind: 'rate' },
    { value: 'workforce_total', label: 'Main-d’œuvre totale', dataset: workforceSeries, description: 'Volume total de main-d’œuvre, en milliers de personnes.', kind: 'count' },
    { value: 'female_workforce_share', label: 'Part de main-d’œuvre féminine', dataset: femaleWorkforceShare, description: 'Part des femmes dans la main-d’œuvre totale selon AFRISTAT.', kind: 'rate' },
    { value: 'salaried_workers_share', label: 'Part des travailleurs salariés', dataset: salariedWorkersShare, description: 'Part de l’emploi salarié dans la structure du travail.', kind: 'rate' },
  ]), [activityRate, employmentRate, unemploymentDataset, workforceSeries, femaleWorkforceShare, salariedWorkersShare])

  const selectedNationalEmployment = useMemo(
    () => employmentNationalOptions.find((option) => option.value === employmentMetric) || employmentNationalOptions[0] || null,
    [employmentMetric, employmentNationalOptions],
  )

  const employmentProfileEnabled = useMemo(() => {
    const series = selectedNationalEmployment?.dataset?.series || []
    return series.some((serie) => ['Ensemble', 'Homme', 'Femme', 'Masculin', 'Féminin'].includes(serie.nom))
  }, [selectedNationalEmployment])

  const selectedNationalEmploymentSeries = useMemo(() => {
    const series = selectedNationalEmployment?.dataset?.series || []
    if (!employmentProfileEnabled || employmentProfile === 'sex') return series
    const overall = series.find((serie) => serie.nom === 'Ensemble')
    return overall ? [overall] : series.slice(0, 1)
  }, [selectedNationalEmployment, employmentProfileEnabled, employmentProfile])

  const priceTrendOption = useMemo(() => ({
    color: [ACCENT],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (!params?.length) return ''
        return `${params[0].axisValue}<br/><b>${fmtPrice(params[0].value)}</b>`
      },
    },
    grid: { left: 56, right: 18, top: 20, bottom: 56 },
    xAxis: {
      type: 'category',
      data: priceTimeline.map((point) => point.label),
      axisLabel: {
        fontSize: 10,
        rotate: priceTimeline.length > 18 ? 40 : 0,
        interval: priceTimeline.length > 36 ? Math.ceil(priceTimeline.length / 12) : 'auto',
      },
      axisLine: { lineStyle: { color: '#d0d0d0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => fmtInt(value) },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: ACCENT, width: 2.8 },
        areaStyle: { color: `${ACCENT}18` },
        itemStyle: { color: ACCENT },
        data: priceTimeline.map((point) => Number(point.value.toFixed(2))),
      },
    ],
  }), [priceTimeline])

  const compareOption = useMemo(() => ({
    color: [ACCENT],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        if (!params?.length) return ''
        return `${params[0].axisValue}<br/><b>${fmtPrice(params[0].value)}</b>`
      },
    },
    grid: { left: 112, right: 18, top: 16, bottom: 16 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => fmtInt(value) },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    yAxis: {
      type: 'category',
      data: compareRows.map((row) => row.region),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: compareRows.map((row) => Number(row.value.toFixed(2))),
        barWidth: 18,
        itemStyle: {
          color: (params) => {
            const region = compareRows[params.dataIndex]?.region
            return region === selectedRegion ? '#f0b429' : ACCENT
          },
          borderRadius: [0, 8, 8, 0],
        },
      },
    ],
  }), [compareRows, selectedRegion])

  const employmentOption = useMemo(() => ({
    color: ['#A16D00', '#d58b00', '#5c4a00'],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const lines = params.map((item) => `${item.seriesName}: <b>${fmtPct(item.value)}</b>`)
        return `${params[0]?.axisValue || ''}<br/>${lines.join('<br/>')}`
      },
    },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 56, right: 18, top: 20, bottom: 48 },
    xAxis: {
      type: 'category',
      data: employmentSeries.years,
      axisLabel: { fontSize: 11 },
      axisLine: { lineStyle: { color: '#d0d0d0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `${value}%` },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    series: employmentSeries.series.map((serie) => ({
      name: serie.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.4 },
      areaStyle: serie.name === 'Ensemble' ? { color: '#A16D0018' } : undefined,
      data: serie.data,
    })),
  }), [employmentSeries])

  const activityRateOption = useMemo(() => {
    if (!activityRate?.categories?.length) return {}

    return {
      color: ['#A16D00', '#d58b00', '#5c4a00'],
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const lines = params.map((item) => `${item.seriesName}: <b>${fmtPct(item.value)}</b>`)
          return `${params[0]?.axisValue || ''}<br/>${lines.join('<br/>')}`
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 56, right: 18, top: 20, bottom: 48 },
      xAxis: {
        type: 'category',
        data: activityRate.categories,
        axisLabel: { fontSize: 11 },
        axisLine: { lineStyle: { color: '#d0d0d0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => `${value}%` },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: activityRate.series.map((serie) => ({
        name: serie.nom === 'Masculin' ? 'Hommes' : serie.nom === 'Féminin' ? 'Femmes' : serie.nom,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.4 },
        areaStyle: serie.nom === 'Ensemble' ? { color: '#A16D0018' } : undefined,
        data: serie.data,
      })),
    }
  }, [activityRate])

  const regionalEmploymentOption = useMemo(() => {
    if (!regionalEmploymentRate?.categories?.length) return {}

    const year = regionalEmploymentRate.annee_reference || 'N/A'
    return {
      color: [ACCENT],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `${params[0]?.axisValue || ''}<br/><b>${fmtPct(params[0]?.value || 0)}</b><br/>${year}`,
      },
      grid: { left: 120, right: 18, top: 12, bottom: 18 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => `${value}%` },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      yAxis: {
        type: 'category',
        data: regionalEmploymentRate.categories,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          data: regionalEmploymentRate.series?.[0]?.data || [],
          itemStyle: { borderRadius: [0, 8, 8, 0] },
        },
      ],
    }
  }, [regionalEmploymentRate])

  const workforceOption = useMemo(() => {
    if (!workforceSeries?.categories?.length) return {}

    return {
      color: ['#f0b429'],
      tooltip: {
        trigger: 'axis',
        formatter: (params) => `${params[0]?.axisValue || ''}<br/><b>${fmtCompact(params[0]?.value || 0)}</b> milliers`,
      },
      grid: { left: 56, right: 18, top: 12, bottom: 28 },
      xAxis: {
        type: 'category',
        data: workforceSeries.categories,
        axisLabel: { fontSize: 11 },
        axisLine: { lineStyle: { color: '#d0d0d0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => fmtCompact(value) },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: [
        {
          name: workforceSeries.series?.[0]?.nom || 'Main-d’œuvre totale',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: { color: '#f0b42922' },
          lineStyle: { width: 2.4 },
          data: workforceSeries.series?.[0]?.data || [],
        },
      ],
    }
  }, [workforceSeries])

  const selectedEmploymentOption = useMemo(() => {
    if (employmentScope === 'regional') return regionalEmploymentOption
    if (!selectedNationalEmployment?.dataset?.categories?.length) return {}

    const categories = selectedNationalEmployment.dataset.categories || []
    const series = selectedNationalEmploymentSeries
    const isRate = selectedNationalEmployment.kind !== 'count'

    return {
      color: ['#A16D00', '#d58b00', '#5c4a00'],
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const lines = params.map((item) => {
            const suffix = isRate ? fmtPct(item.value) : fmtCompact(item.value)
            const unit = isRate ? '' : ' milliers'
            return `${item.seriesName}: <b>${suffix}${unit}</b>`
          })
          return `${params[0]?.axisValue || ''}<br/>${lines.join('<br/>')}`
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 56, right: 18, top: 20, bottom: 48 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 11 },
        axisLine: { lineStyle: { color: '#d0d0d0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => (isRate ? `${value}%` : fmtCompact(value)) },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: series.map((serie, index) => ({
        name: EMPLOYMENT_PROFILE_LABELS[serie.nom] || serie.nom,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.4 },
        areaStyle: index === 0 ? { color: '#A16D0018' } : undefined,
        data: serie.data,
      })),
    }
  }, [employmentScope, regionalEmploymentOption, selectedNationalEmployment, selectedNationalEmploymentSeries])

  const selectedEmploymentTitle = employmentScope === 'regional'
    ? 'Comparaison régionale du taux d’emploi'
    : selectedNationalEmployment?.label || 'Indicateur emploi'

  const selectedEmploymentDescription = employmentScope === 'regional'
    ? `${regionalEmploymentRate?.annee_reference || 'N/A'} · photographie comparative des régions sur le taux d’emploi.`
    : selectedNationalEmployment?.description || 'Lecture du marché du travail selon l’indicateur sélectionné.'

  const selectedEmploymentMeta = employmentScope === 'regional'
    ? regionalEmploymentRate
    : selectedNationalEmployment?.dataset

  useEffect(() => {
    if (employmentScope === 'regional' && employmentMetric !== 'employment_rate_regional') {
      setEmploymentMetric('employment_rate_regional')
    }
    if (employmentScope === 'national' && employmentMetric === 'employment_rate_regional') {
      setEmploymentMetric('activity_rate')
    }
  }, [employmentScope, employmentMetric])

  const activityDomainsOption = useMemo(() => {
    if (!activityDomains?.categories?.length) return {}

    return {
      color: ['#A16D00', '#d58b00', '#7a5c00', '#e0a52a'],
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 56, right: 18, top: 16, bottom: 54 },
      xAxis: {
        type: 'category',
        data: activityDomains.categories,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => fmtCompact(value) },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: activityDomains.series.map((serie) => ({
        name: serie.nom,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: serie.data,
      })),
    }
  }, [activityDomains])

  const workersOption = useMemo(() => {
    if (!workersByBranch?.categories?.length) return {}

    return {
      color: ['#7a5c00', '#d58b00', '#f0b429'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const lines = params.map((item) => `${item.seriesName}: <b>${fmtPct(item.value)}</b>`)
          return `${params[0]?.axisValue || ''}<br/>${lines.join('<br/>')}`
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 180, right: 18, top: 16, bottom: 46 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => `${value}%` },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      yAxis: {
        type: 'category',
        data: workersByBranch.categories,
        axisLabel: { fontSize: 10 },
      },
      series: workersByBranch.series.map((serie) => ({
        name: serie.nom,
        type: 'bar',
        barMaxWidth: 16,
        data: serie.data,
      })),
    }
  }, [workersByBranch])

  const pmeAgeOption = useMemo(() => {
    if (!pmeAge?.categories?.length) return {}

    return {
      color: ['#A16D00', '#d58b00', '#f0b429'],
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 56, right: 18, top: 16, bottom: 54 },
      xAxis: {
        type: 'category',
        data: pmeAge.categories,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => fmtCompact(value) },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: pmeAge.series.map((serie) => ({
        name: serie.nom,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: serie.nom === '30 à 55 ans' ? { color: '#d58b0015' } : undefined,
        data: serie.data,
      })),
    }
  }, [pmeAge])

  const pmeStatusOption = useMemo(() => {
    if (!pmeStatus?.categories?.length) return {}

    return {
      color: [ACCENT],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `${params[0]?.axisValue || ''}<br/><b>${fmtInt(params[0]?.value || 0)}</b> entreprises`,
      },
      grid: { left: 170, right: 18, top: 10, bottom: 10 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: (value) => fmtCompact(value) },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      yAxis: {
        type: 'category',
        data: pmeStatus.categories,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 16,
          data: pmeStatus.series?.[0]?.data || [],
          itemStyle: { borderRadius: [0, 8, 8, 0] },
        },
      ],
    }
  }, [pmeStatus])

  const turnoverOption = useMemo(() => {
    if (!turnoverByBranch?.categories?.length) return {}

    return {
      color: ['#f0b429'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `${params[0]?.axisValue || ''}<br/><b>${fmtFcfaFull(params[0]?.value || 0)}</b>`,
      },
      grid: { left: 170, right: 18, top: 14, bottom: 34 },
      xAxis: {
        type: 'value',
        splitNumber: 4,
        name: 'FCFA',
        nameLocation: 'middle',
        nameGap: 24,
        axisLabel: {
          fontSize: 10,
          hideOverlap: true,
          formatter: (value) => fmtFcfaAxis(value),
        },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      yAxis: {
        type: 'category',
        data: turnoverByBranch.categories,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 16,
          data: turnoverByBranch.series?.[0]?.data || [],
          itemStyle: { borderRadius: [0, 8, 8, 0] },
        },
      ],
    }
  }, [turnoverByBranch])

  return (
    <ModuleLayout
      accentColor={ACCENT}
      domaine="Économie & Emploi"
      description="Suivi des prix des denrées, comparaisons régionales, dynamiques du chômage, activité, emploi régional et nouveaux volets PME / activités locales issus des exports CEFORE et AFRISTAT."
    >
      <div className="container">
        <div className="economie-page">
          <section className="eco-warning">
            {/* <div className="eco-warning__badge">Module</div> */}
            <div>
              <h2>Couverture actuelle du module</h2>
              <p>
                Le module couvre  les prix des denrées, le chômage par milieu de résidence, la structure des entreprises CEFORE,
                les créations par âge du promoteur, plusieurs lectures sur les activités locales ainsi qu’un premier bloc marché du travail
                hors chômage avec taux d’activité, taux d’emploi régional, part salariale et part de main-d’œuvre féminine.
              </p>
            </div>
          </section>

          <section className="eco-filters">
            <label className="eco-filter-group">
              <span>Denrée suivie</span>
              <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
                {availableProducts.map((product) => (
                  <option key={product} value={product}>{formatProductLabel(product)}</option>
                ))}
              </select>
            </label>

            <label className="eco-filter-group">
              <span>Région</span>
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
                <option value="all">Toutes les régions</option>
                {availableRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </label>

            <label className="eco-filter-group">
              <span>Début série prix</span>
              <select value={priceStartYear} onChange={(event) => setPriceStartYear(event.target.value)}>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </label>

            <label className="eco-filter-group">
              <span>Fin série prix</span>
              <select value={priceEndYear} onChange={(event) => setPriceEndYear(event.target.value)}>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </label>

            <label className="eco-filter-group">
              <span>Année comparaison</span>
              <select value={compareYear} onChange={(event) => setCompareYear(event.target.value)}>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="eco-kpis">
            <KpiCard
              label={`Prix de référence · ${formatProductLabel(selectedProduct)}`}
              value={latestPricePoint ? fmtPrice(latestPricePoint.value) : 'N/A'}
              hint={latestPricePoint ? `${selectedRegion === 'all' ? 'Moyenne nationale' : selectedRegion} · ${latestPricePoint.label}` : 'Chargement en cours'}
              highlight
            />
            <KpiCard
              label="Variation sur la plage sélectionnée"
              value={priceTimeline.length > 1 ? fmtSignedPct(priceVariation) : 'N/A'}
              hint={firstPricePoint && latestPricePoint ? `${fmtPrice(firstPricePoint.value)} → ${fmtPrice(latestPricePoint.value)}` : 'Série insuffisante'}
            />
            <KpiCard
              label="Taux de chômage le plus récent"
              value={latestEmploymentOverall ? fmtPct(latestEmploymentOverall.valeur) : 'N/A'}
              hint={latestEmploymentYear ? `Ensemble · ${latestEmploymentYear} · Urbain ${latestEmploymentUrban ? fmtPct(latestEmploymentUrban.valeur) : 'N/A'} · Activité ${latestActivityRateOverall ? fmtPct(latestActivityRateOverall) : 'N/A'}` : 'Source INSD / SSN / MFSFN'}
            />
            <KpiCard
              label="Entreprises CEFORE recensées"
              value={latestCeForeTotal ? fmtInt(latestCeForeTotal) : 'N/A'}
              hint={activityDomains?.annee_reference ? `${activityDomains.annee_reference} · Domaine dominant ${dominantCeForeDomain || 'N/A'} · Emploi ${latestEmploymentRateOverall ? fmtPct(latestEmploymentRateOverall) : 'N/A'} · Salariés ${latestSalariedWorkersShare ? fmtPct(latestSalariedWorkersShare) : 'N/A'} · Main-d’œuvre féminine ${latestFemaleWorkforceShare ? fmtPct(latestFemaleWorkforceShare) : 'N/A'}` : 'Chargement des exports PME'}
            />
          </section>

          <section className="eco-main-grid">
            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Carte des prix moyens par région</h2>
                <p>Lecture choroplèthe par région pour {formatProductLabel(selectedProduct).toLowerCase()} en {compareYear}.</p>
              </header>

              <div className="eco-map-wrap">
                {regionsGeo ? (
                  <MapContainer center={BFA_CENTER} zoom={BFA_ZOOM} style={{ height: 420, width: '100%' }}>
                    <GeoJSON
                      key={`${selectedProduct}-${compareYear}-${selectedRegion}`}
                      data={regionsGeo}
                      style={(feature) => {
                        const region = feature?.properties?.shapeName || ''
                        const value = compareMap.get(normalizeName(region)) || 0
                        const ratio = Math.max(0.12, value / maxCompareValue)
                        const active = selectedRegion === 'all' || region === selectedRegion

                        return {
                          color: '#ffffff',
                          weight: active ? 1.2 : 0.9,
                          fillColor: `rgba(161, 109, 0, ${ratio.toFixed(3)})`,
                          fillOpacity: active ? 0.82 : 0.4,
                        }
                      }}
                      onEachFeature={(feature, layer) => {
                        const region = feature?.properties?.shapeName || 'N/A'
                        const value = compareMap.get(normalizeName(region)) || 0

                        layer.bindTooltip(
                          `<strong>${region}</strong><br/>Prix moyen: ${fmtInt(value)} FCFA<br/>Produit: ${formatProductLabel(selectedProduct)}`,
                          { className: 'eco-leaflet-tooltip', sticky: true },
                        )

                        layer.on('click', () => {
                          setSelectedRegion((current) => (current === region ? 'all' : region))
                        })
                      }}
                    />
                    <ResetViewControl />
                  </MapContainer>
                ) : (
                  <div className="eco-placeholder">Chargement de la carte régionale...</div>
                )}
              </div>

              <div className="eco-map-legend">
                <span>Prix faibles</span>
                <span className="eco-map-legend__bar" aria-hidden="true" />
                <span>Prix élevés</span>
              </div>
            </article>

            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Évolution des prix des denrées</h2>
                <p>Moyenne mensuelle observée sur les marchés couverts par la source SONAGESS/PAM/FAO/WFP Food Prices.</p>
              </header>
              {priceTimeline.length ? (
                <ReactECharts option={priceTrendOption} style={{ height: 420 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Aucune série disponible pour ce filtre.</div>
              )}
            </article>
          </section>

          <section className="eco-bottom-grid">
            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Comparaison régionale des prix</h2>
                <p>Classement des régions pour {formatProductLabel(selectedProduct).toLowerCase()} en {compareYear}.</p>
              </header>
              {compareRows.length ? (
                <ReactECharts option={compareOption} style={{ height: 380 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Aucune comparaison disponible pour cette année.</div>
              )}
            </article>

            <article className="eco-panel eco-panel--stacked">
              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Filtres du sous-volet emploi</h3>
                  <p>Basculer entre lecture nationale, régionale et comparaison par sexe.</p>
                </header>
                <div className="eco-subfilters">
                  <label className="eco-filter-group">
                    <span>Portée</span>
                    <select value={employmentScope} onChange={(event) => setEmploymentScope(event.target.value)}>
                      <option value="national">National</option>
                      <option value="regional">Régional</option>
                    </select>
                  </label>

                  <label className="eco-filter-group">
                    <span>Indicateur</span>
                    <select value={employmentMetric} onChange={(event) => setEmploymentMetric(event.target.value)}>
                      {employmentScope === 'regional' ? (
                        <option value="employment_rate_regional">Taux d’emploi régional</option>
                      ) : employmentNationalOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="eco-filter-group">
                    <span>Profil</span>
                    <select
                      value={employmentProfile}
                      onChange={(event) => setEmploymentProfile(event.target.value)}
                      disabled={employmentScope === 'regional' || !employmentProfileEnabled}
                    >
                      <option value="sex">Comparer les sexes</option>
                      <option value="overall">Ensemble uniquement</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Repères récents</h3>
                  <p>{selectedEmploymentMeta?.annee_reference || latestEmploymentYear || 'N/A'} · lecture rapide du marché du travail.</p>
                </header>
                <div className="eco-employment-stats">
                  <div>
                    <strong>{latestActivityRateOverall ? fmtPct(latestActivityRateOverall) : 'N/A'}</strong>
                    <span>Taux d’activité</span>
                  </div>
                  <div>
                    <strong>{latestEmploymentRateOverall ? fmtPct(latestEmploymentRateOverall) : 'N/A'}</strong>
                    <span>Taux d’emploi</span>
                  </div>
                  <div>
                    <strong>{latestSalariedWorkersShare ? fmtPct(latestSalariedWorkersShare) : 'N/A'}</strong>
                    <span>Travailleurs salariés</span>
                  </div>
                  <div>
                    <strong>{latestFemaleWorkforceShare ? fmtPct(latestFemaleWorkforceShare) : 'N/A'}</strong>
                    <span>Main-d’œuvre féminine</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="eco-bottom-grid">
            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>{selectedEmploymentTitle}</h2>
                <p>{selectedEmploymentDescription}</p>
              </header>
              {selectedEmploymentMeta?.categories?.length ? (
                <ReactECharts option={selectedEmploymentOption} style={{ height: 360 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Chargement des indicateurs emploi...</div>
              )}
            </article>

            <article className="eco-panel eco-panel--stacked">
              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Chômage par milieu de résidence</h3>
                  <p>{latestEmploymentYear || 'N/A'} · référentiel harmonisé ensemble, urbain et rural.</p>
                </header>
                {employmentSeries.years.length ? (
                  <ReactECharts option={employmentOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                ) : (
                  <div className="eco-placeholder eco-placeholder--sm">Chargement de la série chômage...</div>
                )}
              </div>

              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Taux d’emploi régional</h3>
                  <p>{regionalEmploymentRate?.annee_reference || 'N/A'} · photographie comparative des régions.</p>
                </header>
                {regionalEmploymentRate?.categories?.length ? (
                  <ReactECharts option={regionalEmploymentOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                ) : (
                  <div className="eco-placeholder eco-placeholder--sm">Chargement du taux d’emploi régional...</div>
                )}
              </div>
            </article>
          </section>

          <section className="eco-bottom-grid">
            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Entreprises CEFORE par domaine d’activité</h2>
                <p>Suivi 2018-2023 des enregistrements CEFORE par grand domaine, utile pour lire la montée du commerce et des services.</p>
              </header>
              {activityDomains?.categories?.length ? (
                <ReactECharts option={activityDomainsOption} style={{ height: 360 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Chargement des entreprises par domaine...</div>
              )}
            </article>

            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Travailleurs par branche et sexe</h2>
                <p>Lecture sectorielle sur le dernier millésime disponible ({workersByBranch?.annee_reference || 'N/A'}), pour comparer la structure d’emploi homme, femme et ensemble.</p>
              </header>
              {workersByBranch?.categories?.length ? (
                <ReactECharts option={workersOption} style={{ height: 360 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Chargement de la répartition des travailleurs...</div>
              )}
            </article>
          </section>

          <section className="eco-bottom-grid">
            <article className="eco-panel">
              <header className="eco-panel__header">
                <h2>Créations CEFORE selon l’âge du promoteur</h2>
                <p>Suivi 2010-2019 des créations d’entreprises par tranche d’âge, pour distinguer l’apport des jeunes promoteurs et des profils plus établis.</p>
              </header>
              {pmeAge?.categories?.length ? (
                <ReactECharts option={pmeAgeOption} style={{ height: 360 }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="eco-placeholder">Chargement des créations par âge...</div>
              )}
            </article>

            <article className="eco-panel eco-panel--stacked">
              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Statut juridique des entreprises</h3>
                  <p>{pmeStatus?.annee_reference || 'N/A'} · structure des enregistrements CEFORE.</p>
                </header>
                {pmeStatus?.categories?.length ? (
                  <ReactECharts option={pmeStatusOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                ) : (
                  <div className="eco-placeholder eco-placeholder--sm">Chargement des statuts juridiques...</div>
                )}
              </div>

              <div className="eco-mini-panel">
                <header className="eco-mini-panel__header">
                  <h3>Chiffre d’affaires moyen par branche</h3>
                  <p>{turnoverByBranch?.annee_reference || 'N/A'} · top branches observées.</p>
                </header>
                {turnoverByBranch?.categories?.length ? (
                  <ReactECharts option={turnoverOption} style={{ height: 250 }} opts={{ renderer: 'canvas' }} />
                ) : (
                  <div className="eco-placeholder eco-placeholder--sm">Chargement du chiffre d’affaires par branche...</div>
                )}
              </div>
            </article>
          </section>

          <section className="eco-sources">
            <h2>Sources et note de lecture</h2>
            <p>Prix des denrées: WFP Food Prices, exploité ici pour les marchés suivis et les moyennes régionales. Emploi / chômage: INSD, SSN, MFSFN, EMOP / ENEJ et AFRISTAT.</p>
            <p>PME et activités locales: CEFORE et jeux économiques bruts intégrés dans le pipeline viz. Le sous-volet emploi couvre le chômage, le taux d’activité, le taux d’emploi, la main-d’œuvre totale, la part salariale, la part de main-d’œuvre féminine et une comparaison régionale du taux d’emploi.</p>
          </section>
        </div>
      </div>
    </ModuleLayout>
  )
}
