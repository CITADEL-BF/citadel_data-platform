import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { CircleMarker, GeoJSON, MapContainer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ModuleLayout from '../ModuleLayout'
import './EducationPage.css'

const BFA_CENTER = [12.3, -1.56]
const BFA_ZOOM = 6

const IND_CLOSED = "Nombre d'établissements d'enseignement général, technique et professionnel fermés pour insécurité"
const IND_TOTAL_SCHOOLS = "Nombre d'établissements"
const IND_INTERNET_USERS = 'Utilisateurs d internet'
const IND_COV_2G = 'At least 2G'
const IND_COV_3G = 'At least 3G'
const IND_COV_4G = 'At least LTE/WiMAX'
const IND_ACTIVE_SUBS_OPERATOR = 'Nombre d’abonnements actifs par opérateur de téléphonie mobile'
const IND_RESULTATS_BEPC = 'Evolution des résultats du BEPC'
const IND_RESULTATS_CEP = "Evolution des résultats du Certificat d'Etudes Primaires (CEP)"
const IND_RESULTATS_BAC = 'Evolution des résultats du baccaulauréat'

const CYCLE_INDICATORS = {
  primaire: "Evolution des nombres d'écoles et de salles de classe du primaire des secteurs privé et public par région",
  secondaire_tech: "Evolution des nombres d'établissements et de classes de l'enseignement secondaire technique et professionnel des secteurs public et privé par région",
  post_secondaire: "Evolution des nombres d'établissements et de classes du post-primaire et du secondaire général des secteurs public et privé par région",
}

const CYCLE_LABELS = {
  all: 'Tous cycles',
  primaire: 'Primaire',
  secondaire_tech: 'Secondaire technique/pro',
  post_secondaire: 'Post-primaire/secondaire',
}

const RESULT_LABELS = {
  [IND_RESULTATS_CEP]: 'CEP',
  [IND_RESULTATS_BEPC]: 'BEPC',
  [IND_RESULTATS_BAC]: 'Baccalauréat',
}

const RESULT_INDICATORS = [IND_RESULTATS_CEP, IND_RESULTATS_BEPC, IND_RESULTATS_BAC]

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

  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim()
    })
    return row
  })
}

function ResetViewControl({ className }) {
  const map = useMap()
  return (
    <button
      type="button"
      className={className}
      title="Réinitialiser la vue"
      onClick={() => map.setView(BFA_CENTER, BFA_ZOOM)}
    >
      ⟳ Réinitialiser
    </button>
  )
}

function KpiCard({ label, value, hint, highlight }) {
  return (
    <article className={`edu-kpi${highlight ? ' edu-kpi--highlight' : ''}`}>
      <p className="edu-kpi__label label-sm">{label}</p>
      <p className="edu-kpi__value">{value}</p>
      {hint && <p className="edu-kpi__hint">{hint}</p>}
    </article>
  )
}

export default function EducationPage() {
  const [educationRows, setEducationRows] = useState([])
  const [securityRows, setSecurityRows] = useState([])
  const [regionsGeo, setRegionsGeo] = useState(null)
  const [adminPointsGeo, setAdminPointsGeo] = useState(null)

  const [selectedCycle, setSelectedCycle] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [digitalStartYear, setDigitalStartYear] = useState('all')
  const [digitalEndYear, setDigitalEndYear] = useState('all')
  const [resultsStartYear, setResultsStartYear] = useState('all')
  const [resultsEndYear, setResultsEndYear] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/csv/education_indicateurs.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/csv/securite_incidents_par_region_total.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/geojson/bfa_regions_boundaries.geojson')).then((r) => r.json()),
      fetch(withBase('data/viz/geojson/bfa_adminpoints.geojson')).then((r) => r.json()),
    ])
      .then(([educationText, securityText, regionsData, adminPointsData]) => {
        const educParsed = parseCsv(educationText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          categorie_1: String(row.categorie_1 || '').trim(),
          region_norm: String(row.region_norm || '').trim(),
          commune: String(row.commune || '').trim(),
        }))

        const securityParsed = parseCsv(securityText).map((row) => ({
          ...row,
          region_norm: String(row.region_norm || row.region || '').trim(),
          nb_evenements: Number(row.nb_evenements || 0),
          nb_deces: Number(row.nb_deces || 0),
        }))

        setEducationRows(educParsed)
        setSecurityRows(securityParsed)
        setRegionsGeo(regionsData || null)
        setAdminPointsGeo(adminPointsData || null)
      })
      .catch(() => {})
  }, [])

  const schoolSeriesRows = useMemo(() => {
    const allowed = new Set(Object.values(CYCLE_INDICATORS))
    return educationRows.filter((row) => allowed.has(row.indicateur))
  }, [educationRows])

  const availableYears = useMemo(() => {
    const years = new Set(schoolSeriesRows.map((row) => row.annee).filter(Boolean))
    return Array.from(years).sort((a, b) => a - b)
  }, [schoolSeriesRows])

  useEffect(() => {
    if (selectedYear !== 'all') return
    if (!availableYears.length) return
    setSelectedYear(String(availableYears[availableYears.length - 1]))
  }, [availableYears, selectedYear])

  const availableRegions = useMemo(() => {
    const set = new Set(schoolSeriesRows.map((row) => row.region_norm).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [schoolSeriesRows])

  const filteredSchoolRows = useMemo(() => {
    const year = Number(selectedYear)
    return schoolSeriesRows.filter((row) => {
      if (Number.isFinite(year) && selectedYear !== 'all' && row.annee !== year) return false
      if (selectedCycle !== 'all' && row.indicateur !== CYCLE_INDICATORS[selectedCycle]) return false
      if (selectedRegion !== 'all' && row.region_norm !== selectedRegion) return false
      return true
    })
  }, [schoolSeriesRows, selectedYear, selectedCycle, selectedRegion])

  const schoolByRegion = useMemo(() => {
    const map = new Map()
    filteredSchoolRows.forEach((row) => {
      const key = row.region_norm
      if (!key) return
      map.set(key, (map.get(key) || 0) + Number(row.valeur || 0))
    })
    return map
  }, [filteredSchoolRows])

  const closedRows = useMemo(() => {
    return educationRows.filter((row) => row.indicateur === IND_CLOSED)
  }, [educationRows])

  const closedByYear = useMemo(() => {
    const map = new Map()
    closedRows
      .filter((row) => row.categorie_1.toLowerCase() === 'ensemble')
      .forEach((row) => {
        map.set(row.annee, (map.get(row.annee) || 0) + Number(row.valeur || 0))
      })
    return map
  }, [closedRows])

  const totalSchoolsByYear = useMemo(() => {
    const map = new Map()
    educationRows
      .filter((row) => row.indicateur === IND_TOTAL_SCHOOLS)
      .forEach((row) => {
        if (row.region_norm) return
        map.set(row.annee, Math.max(map.get(row.annee) || 0, Number(row.valeur || 0)))
      })
    return map
  }, [educationRows])

  const latestClosedYear = useMemo(() => {
    const years = Array.from(closedByYear.keys()).filter(Boolean).sort((a, b) => a - b)
    return years[years.length - 1] || null
  }, [closedByYear])

  const communeClosureMap = useMemo(() => {
    if (!latestClosedYear) return new Map()

    const map = new Map()
    closedRows
      .filter((row) => row.annee === latestClosedYear)
      .filter((row) => row.categorie_1.toLowerCase() === 'ensemble')
      .forEach((row) => {
        const commune = row.commune
        if (!commune) return
        const key = normalizeName(commune)
        map.set(key, (map.get(key) || 0) + Number(row.valeur || 0))
      })

    return map
  }, [closedRows, latestClosedYear])

  const communePoints = useMemo(() => {
    if (!adminPointsGeo?.features?.length) return []

    return adminPointsGeo.features
      .filter((feature) => Number(feature.properties?.admin_level) === 3)
      .map((feature) => {
        const props = feature.properties || {}
        const communeName = props.adm3_name1 || props.adm3_name || props.name
        const regionName = props.adm1_name1 || props.adm1_name || ''
        const key = normalizeName(communeName)
        const closed = communeClosureMap.has(key) ? Number(communeClosureMap.get(key) || 0) : null

        return {
          commune: communeName,
          region: regionName,
          closed,
          isClosed: closed !== null && closed > 0,
          isOpen: closed === 0,
          coords: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        }
      })
      .filter((point) => (selectedRegion === 'all' ? true : point.region === selectedRegion))
  }, [adminPointsGeo, communeClosureMap, selectedRegion])

  const securityByRegion = useMemo(() => {
    const map = new Map()
    securityRows.forEach((row) => {
      if (!row.region_norm) return
      map.set(row.region_norm, Number(row.nb_evenements || 0))
    })
    return map
  }, [securityRows])

  const correlationRows = useMemo(() => {
    const rows = []
    schoolByRegion.forEach((schools, region) => {
      const incidents = Number(securityByRegion.get(region) || 0)
      const pressure = schools > 0 ? (incidents / schools) * 1000 : 0
      rows.push({ region, schools, incidents, pressure })
    })
    return rows.sort((a, b) => b.pressure - a.pressure)
  }, [schoolByRegion, securityByRegion])

  const kpi = useMemo(() => {
    const closed = latestClosedYear ? Number(closedByYear.get(latestClosedYear) || 0) : 0
    const totalSchools = latestClosedYear ? Number(totalSchoolsByYear.get(latestClosedYear) || 0) : 0
    const closureRate = totalSchools > 0 ? (closed / totalSchools) * 100 : 0

    const impactedCommunes = communePoints.filter((p) => p.isClosed).length
    const topRegions = correlationRows.slice(0, 3).map((row) => row.region)

    return {
      closed,
      totalSchools,
      closureRate,
      impactedCommunes,
      topRegions,
    }
  }, [latestClosedYear, closedByYear, totalSchoolsByYear, correlationRows, communePoints])

  const stackedOption = useMemo(() => {
    const years = Array.from(totalSchoolsByYear.keys())
      .filter((year) => year >= 2018)
      .sort((a, b) => a - b)

    const opened = years.map((year) => {
      const total = Number(totalSchoolsByYear.get(year) || 0)
      const closed = Number(closedByYear.get(year) || 0)
      return Math.max(total - closed, 0)
    })
    const closed = years.map((year) => Number(closedByYear.get(year) || 0))

    return {
      color: ['#2e7d32', '#af0012'],
      tooltip: { trigger: 'axis' },
      legend: { top: 8, textStyle: { color: '#3b4148' } },
      grid: { left: 44, right: 20, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value' },
      series: [
        { name: 'Écoles ouvertes (proxy)', type: 'bar', stack: 'etat', data: opened, barMaxWidth: 24 },
        { name: 'Écoles fermées', type: 'bar', stack: 'etat', data: closed, barMaxWidth: 24 },
      ],
    }
  }, [totalSchoolsByYear, closedByYear])

  const correlationOption = useMemo(() => {
    return {
      color: ['#1565c0'],
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const [incidents, schools, pressure, region] = params.value
          return [
            `<strong>${region}</strong>`,
            `Incidents sécurité : ${fmtInt(incidents)}`,
            `Volume écoles : ${fmtInt(schools)}`,
            `Pression : ${pressure.toFixed(2)} / 1000`,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Incidents sécurité',
        nameLocation: 'middle',
        nameGap: 28,
        type: 'value',
      },
      yAxis: {
        name: 'Volume écoles',
        nameLocation: 'middle',
        nameGap: 36,
        type: 'value',
      },
      grid: { left: 56, right: 18, top: 20, bottom: 52 },
      series: [
        {
          type: 'scatter',
          symbolSize: (value) => Math.min(40, 8 + value[2] * 0.9),
          data: correlationRows.map((row) => [row.incidents, row.schools, row.pressure, row.region]),
          emphasis: { focus: 'series' },
        },
      ],
    }
  }, [correlationRows])

  const mapPressure = useMemo(() => {
    const map = new Map()
    correlationRows.forEach((row) => {
      map.set(normalizeName(row.region), row)
    })
    return map
  }, [correlationRows])

  const maxPressure = useMemo(() => {
    if (!correlationRows.length) return 1
    return Math.max(...correlationRows.map((row) => row.pressure), 1)
  }, [correlationRows])

  const accessRows = useMemo(() => {
    return educationRows.filter((row) => row.sous_domaine === 'Acces_numerique')
  }, [educationRows])

  const resultsRows = useMemo(() => {
    return educationRows.filter((row) => row.sous_domaine === 'Resultats' && RESULT_INDICATORS.includes(row.indicateur))
  }, [educationRows])

  const resultsAvailableYears = useMemo(() => {
    const years = new Set()
    resultsRows.forEach((row) => {
      if (!row.annee || row.valeur <= 0) return
      years.add(row.annee)
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [resultsRows])

  useEffect(() => {
    if (!resultsAvailableYears.length) return
    if (resultsStartYear === 'all') {
      setResultsStartYear(String(resultsAvailableYears[0]))
    }
    if (resultsEndYear === 'all') {
      setResultsEndYear(String(resultsAvailableYears[resultsAvailableYears.length - 1]))
    }
  }, [resultsAvailableYears, resultsStartYear, resultsEndYear])

  const resultsYearRange = useMemo(() => {
    const minYear = resultsAvailableYears[0] || null
    const maxYear = resultsAvailableYears[resultsAvailableYears.length - 1] || null
    const start = resultsStartYear === 'all' ? minYear : Number(resultsStartYear)
    const end = resultsEndYear === 'all' ? maxYear : Number(resultsEndYear)

    if (!start || !end) return { start: null, end: null }
    return start <= end ? { start, end } : { start: end, end: start }
  }, [resultsAvailableYears, resultsStartYear, resultsEndYear])

  const filteredResultsRows = useMemo(() => {
    if (!resultsYearRange.start || !resultsYearRange.end) return resultsRows
    return resultsRows.filter((row) => row.annee >= resultsYearRange.start && row.annee <= resultsYearRange.end)
  }, [resultsRows, resultsYearRange])

  const resultsRateSeries = useMemo(() => {
    return RESULT_INDICATORS.map((indicator) => {
      const byYear = new Map()
      filteredResultsRows
        .filter((row) => row.indicateur === indicator)
        .forEach((row) => {
          if (normalizeName(row.categorie_1) !== 'pourcentage') return
          if (!row.annee || row.valeur <= 0) return
          byYear.set(row.annee, Math.max(byYear.get(row.annee) || 0, row.valeur))
        })

      const values = Array.from(byYear.entries())
        .map(([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year)

      return {
        indicator,
        label: RESULT_LABELS[indicator] || indicator,
        values,
      }
    })
  }, [filteredResultsRows])

  const latestResultsYear = useMemo(() => {
    const years = Array.from(new Set(filteredResultsRows.map((row) => row.annee).filter(Boolean))).sort((a, b) => a - b)
    return years[years.length - 1] || null
  }, [filteredResultsRows])

  const latestResultsByExam = useMemo(() => {
    if (!latestResultsYear) return []

    return RESULT_INDICATORS.map((indicator) => {
      let presented = 0
      let admitted = 0
      let rate = 0

      filteredResultsRows
        .filter((row) => row.indicateur === indicator && row.annee === latestResultsYear)
        .forEach((row) => {
          const category = normalizeName(row.categorie_1)
          if (category === 'presents' || category === 'presentes') {
            presented = Math.max(presented, row.valeur)
          } else if (category === 'admis') {
            admitted = Math.max(admitted, row.valeur)
          } else if (category === 'pourcentage') {
            rate = Math.max(rate, row.valeur)
          }
        })

      if (rate === 0 && presented > 0 && admitted > 0) {
        rate = (admitted / presented) * 100
      }

      return {
        indicator,
        label: RESULT_LABELS[indicator] || indicator,
        presented,
        admitted,
        rate,
      }
    })
  }, [filteredResultsRows, latestResultsYear])

  const resultKpi = useMemo(() => {
    const rates = latestResultsByExam.map((row) => row.rate).filter((value) => Number.isFinite(value) && value > 0)
    const avgRate = rates.length ? rates.reduce((sum, value) => sum + value, 0) / rates.length : 0

    const bestRow = [...latestResultsByExam].sort((a, b) => b.rate - a.rate)[0] || null

    const totalPresented = latestResultsByExam.reduce((sum, row) => sum + Number(row.presented || 0), 0)
    const totalAdmitted = latestResultsByExam.reduce((sum, row) => sum + Number(row.admitted || 0), 0)
    const totalRate = totalPresented > 0 ? (totalAdmitted / totalPresented) * 100 : 0

    return {
      avgRate,
      totalPresented,
      totalAdmitted,
      totalRate,
      bestRow,
    }
  }, [latestResultsByExam])

  const digitalAvailableYears = useMemo(() => {
    const years = new Set()
    accessRows.forEach((row) => {
      if (!row.annee || row.valeur <= 0) return
      years.add(row.annee)
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [accessRows])

  useEffect(() => {
    if (!digitalAvailableYears.length) return
    if (digitalStartYear === 'all') {
      setDigitalStartYear(String(digitalAvailableYears[0]))
    }
    if (digitalEndYear === 'all') {
      setDigitalEndYear(String(digitalAvailableYears[digitalAvailableYears.length - 1]))
    }
  }, [digitalAvailableYears, digitalStartYear, digitalEndYear])

  const digitalYearRange = useMemo(() => {
    const minYear = digitalAvailableYears[0] || null
    const maxYear = digitalAvailableYears[digitalAvailableYears.length - 1] || null
    const start = digitalStartYear === 'all' ? minYear : Number(digitalStartYear)
    const end = digitalEndYear === 'all' ? maxYear : Number(digitalEndYear)

    if (!start || !end) return { start: null, end: null }
    return start <= end ? { start, end } : { start: end, end: start }
  }, [digitalAvailableYears, digitalStartYear, digitalEndYear])

  const internetUsersSeries = useMemo(() => {
    const byYear = new Map()
    accessRows
      .filter((row) => row.indicateur === IND_INTERNET_USERS)
      .forEach((row) => {
        if (!row.annee || row.valeur <= 0) return
        byYear.set(row.annee, Math.max(byYear.get(row.annee) || 0, row.valeur))
      })

    return Array.from(byYear.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year)
  }, [accessRows])

  const filteredInternetUsersSeries = useMemo(() => {
    if (!digitalYearRange.start || !digitalYearRange.end) return internetUsersSeries
    return internetUsersSeries.filter((d) => d.year >= digitalYearRange.start && d.year <= digitalYearRange.end)
  }, [internetUsersSeries, digitalYearRange])

  const coverageSeries = useMemo(() => {
    const defs = [
      { key: IND_COV_2G, label: 'Couverture 2G' },
      { key: IND_COV_3G, label: 'Couverture 3G' },
      { key: IND_COV_4G, label: 'Couverture 4G/LTE' },
    ]

    return defs.map((def) => {
      const byYear = new Map()
      accessRows
        .filter((row) => row.indicateur === def.key)
        .forEach((row) => {
          if (!row.annee || row.valeur <= 0) return
          byYear.set(row.annee, Math.max(byYear.get(row.annee) || 0, row.valeur))
        })

      const values = Array.from(byYear.entries())
        .map(([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year)

      return { ...def, values }
    })
  }, [accessRows])

  const filteredCoverageSeries = useMemo(() => {
    if (!digitalYearRange.start || !digitalYearRange.end) return coverageSeries
    return coverageSeries.map((series) => ({
      ...series,
      values: series.values.filter((v) => v.year >= digitalYearRange.start && v.year <= digitalYearRange.end),
    }))
  }, [coverageSeries, digitalYearRange])

  const activeSubsByOperator = useMemo(() => {
    const entries = accessRows.filter((row) => row.indicateur === IND_ACTIVE_SUBS_OPERATOR && row.valeur > 0)
    if (!entries.length) return { year: null, rows: [] }

    const latestYear = Math.max(...entries.map((row) => row.annee || 0))
    const byOperator = new Map()

    entries
      .filter((row) => row.annee === latestYear)
      .forEach((row) => {
        const op = row.categorie_1 || 'Autre opérateur'
        byOperator.set(op, Math.max(byOperator.get(op) || 0, row.valeur))
      })

    const rows = Array.from(byOperator.entries())
      .map(([operator, value]) => ({ operator, value }))
      .sort((a, b) => b.value - a.value)

    return { year: latestYear, rows }
  }, [accessRows])

  const internetOption = useMemo(() => {
    return {
      color: ['#1565c0'],
      tooltip: { trigger: 'axis', valueFormatter: (v) => `${Number(v).toFixed(2)}%` },
      grid: { left: 44, right: 16, top: 24, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: filteredInternetUsersSeries.map((d) => d.year) },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: [
        {
          name: 'Utilisateurs internet',
          type: 'line',
          smooth: true,
          data: filteredInternetUsersSeries.map((d) => d.value),
          areaStyle: { opacity: 0.12 },
        },
      ],
    }
  }, [filteredInternetUsersSeries])

  const coverageOption = useMemo(() => {
    const years = Array.from(new Set(filteredCoverageSeries.flatMap((s) => s.values.map((v) => v.year)))).sort((a, b) => a - b)
    const valueByYear = (series) => {
      const map = new Map(series.values.map((v) => [v.year, v.value]))
      return years.map((y) => (map.has(y) ? map.get(y) : null))
    }

    return {
      color: ['#2e7d32', '#1565c0', '#755b00'],
      tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? 'N/A' : `${Number(v).toFixed(2)}%`) },
      legend: { top: 4 },
      grid: { left: 44, right: 16, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: filteredCoverageSeries.map((series) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: valueByYear(series),
      })),
    }
  }, [filteredCoverageSeries])

  const operatorOption = useMemo(() => {
    return {
      color: ['#1565c0'],
      tooltip: { trigger: 'axis', valueFormatter: (v) => fmtInt(v) },
      grid: { left: 42, right: 16, top: 20, bottom: 24, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: activeSubsByOperator.rows.map((d) => d.operator) },
      series: [
        {
          name: 'Abonnements actifs',
          type: 'bar',
          barMaxWidth: 26,
          data: activeSubsByOperator.rows.map((d) => d.value),
          label: {
            show: true,
            position: 'right',
            formatter: ({ value }) => fmtCompact(value),
          },
        },
      ],
    }
  }, [activeSubsByOperator])

  const resultsRateOption = useMemo(() => {
    const years = Array.from(new Set(resultsRateSeries.flatMap((series) => series.values.map((value) => value.year)))).sort((a, b) => a - b)

    const valueByYear = (series) => {
      const map = new Map(series.values.map((value) => [value.year, value.value]))
      return years.map((year) => (map.has(year) ? map.get(year) : null))
    }

    return {
      color: ['#0b6bcb', '#e67e22', '#7d3c98'],
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => (value == null ? 'N/A' : `${Number(value).toFixed(2)}%`),
      },
      legend: { top: 4 },
      grid: { left: 44, right: 16, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', min: 0, max: 100, name: '%' },
      series: resultsRateSeries.map((series) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: valueByYear(series),
      })),
    }
  }, [resultsRateSeries])

  const resultsVolumeOption = useMemo(() => {
    return {
      color: ['#90a4ae', '#2e7d32'],
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => fmtInt(value),
      },
      legend: { top: 4 },
      grid: { left: 50, right: 18, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: latestResultsByExam.map((row) => row.label) },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Présentés',
          type: 'bar',
          barMaxWidth: 28,
          data: latestResultsByExam.map((row) => row.presented),
        },
        {
          name: 'Admis',
          type: 'bar',
          barMaxWidth: 28,
          data: latestResultsByExam.map((row) => row.admitted),
        },
      ],
    }
  }, [latestResultsByExam])

  const resultsRateLatestOption = useMemo(() => {
    return {
      color: ['#1565c0'],
      tooltip: { trigger: 'axis', valueFormatter: (value) => `${Number(value).toFixed(2)}%` },
      grid: { left: 42, right: 16, top: 18, bottom: 28, containLabel: true },
      xAxis: { type: 'value', min: 0, max: 100 },
      yAxis: { type: 'category', data: latestResultsByExam.map((row) => row.label) },
      series: [
        {
          name: 'Taux de réussite',
          type: 'bar',
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            formatter: ({ value }) => `${Number(value || 0).toFixed(1)}%`,
          },
          data: latestResultsByExam.map((row) => row.rate),
        },
      ],
    }
  }, [latestResultsByExam])

  return (
    <ModuleLayout
      accentColor="#1565C0"
      domaine="Éducation"
      description="Carte des écoles ouvertes/fermées, évolution de l'état des écoles et corrélation avec la situation sécuritaire."
    >
      <div className="container edu-page">
        <div className="edu-filters">
          <div className="edu-filter-group">
            <span>Cycle scolaire</span>
            <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}>
              {Object.keys(CYCLE_LABELS).map((key) => (
                <option key={key} value={key}>{CYCLE_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className="edu-filter-group">
            <span>Région</span>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              <option value="all">Toutes les régions</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="edu-filter-group">
            <span>Année</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">Dernière disponible</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <section className="edu-kpis">
          <KpiCard
            label="% écoles fermées"
            value={fmtPct(kpi.closureRate)}
            hint={latestClosedYear ? `Référence ${latestClosedYear}` : 'Référence indisponible'}
            highlight
          />
          <KpiCard
            label="Écoles fermées"
            value={fmtInt(kpi.closed)}
            hint="Total national (ensemble)"
          />
          <KpiCard
            label="Communes impactées"
            value={fmtInt(kpi.impactedCommunes)}
            hint="Communes documentées"
          />
          <KpiCard
            label="Régions les plus impactées"
            value={kpi.topRegions.slice(0, 2).join(' • ') || 'N/A'}
            hint={kpi.topRegions[2] ? `Puis ${kpi.topRegions[2]}` : 'Selon pression incidents/écoles'}
          />
        </section>

        <section className="edu-main-grid">
          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Carte écoles ouvertes / fermées par commune</h2>
              <p>Lecture par points communaux, année {latestClosedYear || 'N/A'} (fermetures liées à l'insécurité).</p>
            </header>

            <div className="edu-map-wrap">
              {regionsGeo ? (
                <MapContainer center={BFA_CENTER} zoom={BFA_ZOOM} style={{ height: 420, width: '100%' }}>
                  <GeoJSON
                    data={regionsGeo}
                    style={{ color: '#90a4ae', weight: 1, fillColor: '#f4f7fb', fillOpacity: 0.45 }}
                  />

                  {communePoints.map((point) => {
                    const color = point.isClosed ? '#af0012' : point.isOpen ? '#2e7d32' : '#8a95a3'
                    return (
                      <CircleMarker
                        key={`${point.region}-${point.commune}`}
                        center={point.coords}
                        radius={point.isClosed ? 6 : 4}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.78, weight: 1 }}
                      >
                        <Tooltip direction="top" opacity={0.95} className="edu-leaflet-tooltip">
                          <div><strong>{point.commune}</strong></div>
                          <div>Région: {point.region || 'N/A'}</div>
                          <div>État: {point.isClosed ? 'Fermée/impactée' : point.isOpen ? 'Ouverte' : 'Non documenté'}</div>
                          <div>Fermetures: {point.closed === null ? 'N/A' : fmtInt(point.closed)}</div>
                        </Tooltip>
                      </CircleMarker>
                    )
                  })}

                  <ResetViewControl className="edu-map-reset" />
                </MapContainer>
              ) : (
                <div className="edu-placeholder-mini">Chargement de la carte...</div>
              )}
            </div>

            <div className="edu-map-legend">
              <span className="edu-dot edu-dot--closed" /> Fermée/impactée
              <span className="edu-dot edu-dot--open" /> Ouverte
              <span className="edu-dot edu-dot--na" /> Non documenté
            </div>
          </article>

          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Barres empilées: évolution de l'état des écoles</h2>
              <p>Proxy national: établissements ouverts estimés = total établissements − fermetures déclarées.</p>
            </header>
            <ReactECharts option={stackedOption} style={{ height: 420 }} opts={{ renderer: 'canvas' }} />
          </article>
        </section>

        <section className="edu-bottom-grid">
          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Corrélation sécurité ↔ état des écoles</h2>
              <p>Nuage de points par région: incidents sécuritaires vs volume d'écoles ({CYCLE_LABELS[selectedCycle]}).</p>
            </header>
            <ReactECharts option={correlationOption} style={{ height: 360 }} opts={{ renderer: 'canvas' }} />
          </article>

          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Vue combinée cartographique</h2>
              <p>Choroplèthe de pression sécuritaire: ratio incidents / volume d'écoles par région.</p>
            </header>

            <div className="edu-map-wrap">
              {regionsGeo ? (
                <MapContainer center={BFA_CENTER} zoom={BFA_ZOOM} style={{ height: 360, width: '100%' }}>
                  <GeoJSON
                    data={regionsGeo}
                    style={(feature) => {
                      const name = normalizeName(feature?.properties?.shapeName)
                      const row = mapPressure.get(name)
                      const ratio = row ? row.pressure / maxPressure : 0
                      const alpha = Math.max(0.12, ratio)
                      return {
                        color: '#607d8b',
                        weight: 1,
                        fillColor: `rgba(21, 101, 192, ${alpha.toFixed(3)})`,
                        fillOpacity: 0.72,
                      }
                    }}
                    onEachFeature={(feature, layer) => {
                      const region = feature?.properties?.shapeName || 'N/A'
                      const row = mapPressure.get(normalizeName(region))
                      const incidents = row ? fmtInt(row.incidents) : '0'
                      const schools = row ? fmtInt(row.schools) : '0'
                      const pressure = row ? row.pressure.toFixed(2) : '0.00'

                      layer.bindTooltip(
                        `<strong>${region}</strong><br/>Incidents: ${incidents}<br/>Écoles: ${schools}<br/>Pression: ${pressure} / 1000`,
                        { className: 'edu-leaflet-tooltip', sticky: true }
                      )
                    }}
                  />
                  <ResetViewControl className="edu-map-reset" />
                </MapContainer>
              ) : (
                <div className="edu-placeholder-mini">Chargement de la vue combinée...</div>
              )}
            </div>
          </article>
        </section>

        <section className="edu-sources">
          <h2>Résultats scolaires</h2>
          <div className="edu-results-filters">
            <div className="edu-filter-group">
              <span>Période début</span>
              <select value={resultsStartYear} onChange={(e) => setResultsStartYear(e.target.value)}>
                {resultsAvailableYears.map((year) => (
                  <option key={`results-start-${year}`} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>

            <div className="edu-filter-group">
              <span>Période fin</span>
              <select value={resultsEndYear} onChange={(e) => setResultsEndYear(e.target.value)}>
                {resultsAvailableYears.map((year) => (
                  <option key={`results-end-${year}`} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="edu-results-kpis">
            <KpiCard
              label="Taux moyen de réussite"
              value={fmtPct(resultKpi.avgRate)}
              hint={latestResultsYear ? `Année ${latestResultsYear}` : 'Série indisponible'}
            />
            <KpiCard
              label="Candidats présentés"
              value={fmtInt(resultKpi.totalPresented)}
              hint={latestResultsYear ? `CEP + BEPC + Bac (${latestResultsYear})` : 'Série indisponible'}
            />
            <KpiCard
              label="Admis"
              value={fmtInt(resultKpi.totalAdmitted)}
              hint={`Taux global: ${fmtPct(resultKpi.totalRate)}`}
            />
            <KpiCard
              label="Meilleure performance"
              value={resultKpi.bestRow ? `${resultKpi.bestRow.label} (${resultKpi.bestRow.rate.toFixed(1)}%)` : 'N/A'}
              hint="Sur la dernière année disponible"
            />
          </div>

          <div className="edu-results-grid">
            <article className="edu-panel">
              <header className="edu-panel__header">
                <h2>Évolution des taux de réussite</h2>
                <p>Taux de succès (%) aux examens CEP, BEPC et Baccalauréat.</p>
              </header>
              <ReactECharts option={resultsRateOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
            </article>

            <article className="edu-panel">
              <header className="edu-panel__header">
                <h2>Présentés vs admis</h2>
                <p>{latestResultsYear ? `Comparaison des volumes pour ${latestResultsYear}.` : 'Données indisponibles.'}</p>
              </header>
              <ReactECharts option={resultsVolumeOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
            </article>
          </div>

          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Taux de réussite par examen ({latestResultsYear || 'N/A'})</h2>
              <p>Lecture rapide des écarts de performance entre CEP, BEPC et Baccalauréat.</p>
            </header>
            <ReactECharts option={resultsRateLatestOption} style={{ height: 240 }} opts={{ renderer: 'canvas' }} />
          </article>
        </section>

        <section className="edu-sources">
          <h2>Accès au numérique</h2>
          <div className="edu-digital-filters">
            <div className="edu-filter-group">
              <span>Période début</span>
              <select value={digitalStartYear} onChange={(e) => setDigitalStartYear(e.target.value)}>
                {digitalAvailableYears.map((year) => (
                  <option key={`digital-start-${year}`} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>

            <div className="edu-filter-group">
              <span>Période fin</span>
              <select value={digitalEndYear} onChange={(e) => setDigitalEndYear(e.target.value)}>
                {digitalAvailableYears.map((year) => (
                  <option key={`digital-end-${year}`} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="edu-digital-kpis">
            <KpiCard
              label="Utilisateurs internet"
              value={filteredInternetUsersSeries.length ? fmtPct(filteredInternetUsersSeries[filteredInternetUsersSeries.length - 1].value) : 'N/A'}
              hint={filteredInternetUsersSeries.length ? `Dernière valeur ${filteredInternetUsersSeries[filteredInternetUsersSeries.length - 1].year}` : 'Série indisponible'}
            />
            <KpiCard
              label="Couverture 4G/LTE"
              value={filteredCoverageSeries[2]?.values?.length ? fmtPct(filteredCoverageSeries[2].values[filteredCoverageSeries[2].values.length - 1].value) : 'N/A'}
              hint={filteredCoverageSeries[2]?.values?.length ? `Réf. ${filteredCoverageSeries[2].values[filteredCoverageSeries[2].values.length - 1].year}` : 'Série indisponible'}
            />
            <KpiCard
              label="Abonnements actifs mobile"
              value={activeSubsByOperator.rows.length ? fmtCompact(activeSubsByOperator.rows.reduce((acc, row) => acc + row.value, 0)) : 'N/A'}
              hint={activeSubsByOperator.year ? `Total opérateurs ${activeSubsByOperator.year}` : 'Série indisponible'}
            />
          </div>

          <div className="edu-digital-grid">
            <article className="edu-panel">
              <header className="edu-panel__header">
                <h2>Évolution des utilisateurs internet</h2>
                <p>Part de la population utilisant internet (en %).</p>
              </header>
              <ReactECharts option={internetOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
            </article>

            <article className="edu-panel">
              <header className="edu-panel__header">
                <h2>Couverture réseau mobile</h2>
                <p>Comparaison des couvertures 2G, 3G et 4G/LTE (% population).</p>
              </header>
              <ReactECharts option={coverageOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
            </article>
          </div>

          <article className="edu-panel">
            <header className="edu-panel__header">
              <h2>Abonnements actifs internet mobile par opérateur</h2>
              <p>{activeSubsByOperator.year ? `Distribution opérateurs (année ${activeSubsByOperator.year}).` : 'Données indisponibles.'}</p>
            </header>
            <ReactECharts option={operatorOption} style={{ height: 280 }} opts={{ renderer: 'canvas' }} />
          </article>
        </section>

        <section className="edu-sources">
          <h2>Sources et limites</h2>
          <p>Éducation: DGESS/MENAPLN, AFRISTAT, ARCEP/ITU. Sécurité: ACLED/HDX (agrégats régionaux).</p>
          <p>La carte communale repose sur les communes documentées dans l'indicateur de fermetures; certaines entrées source sont partielles et ne couvrent pas l'ensemble des communes.</p>
        </section>
      </div>
    </ModuleLayout>
  )
}
