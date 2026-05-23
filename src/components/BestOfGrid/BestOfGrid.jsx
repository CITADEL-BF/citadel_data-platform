import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useVisualisations } from '../../app/visualisations/VisualisationsContext'
import './BestOfGrid.css'

const VISUAL_HIGHLIGHTS = [
  { id: 'population-pyramid', domaine: 'population', accent: '#0d631b', label: 'Pyramide démographique', detail: 'Structure âge/sexe de la population.', type: 'chart', featured: true, previewHeight: 500 },
  { id: 'population-line', domaine: 'population', accent: '#0d631b', label: 'Évolution des PDI', detail: 'Projection et dynamique des déplacements.', type: 'chart', previewHeight: 300 },
  { id: 'education-success', domaine: 'education', accent: '#1565c0', label: 'Évolution des taux de réussite', detail: 'Tendance des résultats scolaires.', type: 'chart', previewHeight: 300 },
  { id: 'education-network', domaine: 'education', accent: '#1565c0', label: 'Couverture réseau mobile', detail: 'Couverture 2G/3G/4G/LTE.', type: 'chart', previewHeight: 300 },
  { id: 'economie-prices', domaine: 'economie', accent: '#a16d00', label: 'Évolution des prix des denrées', detail: 'Variation temporelle des prix.', type: 'chart', previewHeight: 420 },
  { id: 'sante-access', domaine: 'sante', accent: '#00695c', label: 'Accessibilité aux centres de santé', detail: 'Taux de couverture CPN2.', type: 'chart', previewHeight: 360 },
]

const CPN2_INDICATOR = 'Evolution du taux de couverture en CPN2 par région'
const IND_RESULTATS_BEPC = 'Evolution des résultats du BEPC'
const IND_RESULTATS_CEP = "Evolution des résultats du Certificat d'Etudes Primaires (CEP)"
const IND_RESULTATS_BAC = 'Evolution des résultats du baccaulauréat'
const IND_COV_2G = 'At least 2G'
const IND_COV_3G = 'At least 3G'
const IND_COV_4G = 'At least LTE/WiMAX'
const TRANCHE_ORDER = [
  '0 - 4', '5 - 9', '10-14', '15 - 19', '20 - 24',
  '25 - 29', '30 - 34', '35 - 39', '40 - 44',
  '45 - 49', '50 - 54', '55 - 59', '60 - 64',
  '65 - 69', '70 - 74', '75 - 79', '80 ou +',
]
const MONTH_ORDER = {
  janvier: 1,
  fevrier: 2,
  'février': 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  'août': 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  'décembre': 12,
}

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

const simpleLineOption = (color, labels, values) => ({
  color: [color],
  tooltip: { trigger: 'axis' },
  grid: { left: 56, right: 16, top: 20, bottom: 40 },
  xAxis: {
    type: 'category',
    data: labels,
    axisLine: { lineStyle: { color: '#d0d0d0' } },
    axisLabel: { fontSize: 10, hideOverlap: true },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 10 },
    splitLine: { lineStyle: { color: '#eceff1' } },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color, width: 2.8 },
      areaStyle: { color: `${color}22` },
      itemStyle: { color },
      data: values,
    },
  ],
})

const pyramidOption = (labels, men, women) => {
  const absMax = Math.max(...men.map((v) => Math.abs(v)), ...women, 1)
  return {
    color: ['#0d631b', '#4caf50'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 54, right: 14, top: 8, bottom: 24 },
    xAxis: {
      type: 'value',
      min: -absMax * 1.05,
      max: absMax * 1.05,
      axisLabel: { fontSize: 9, formatter: (v) => Math.abs(v) },
      splitLine: { lineStyle: { color: '#eceff1' } },
    },
    yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9 } },
    series: [
      { name: 'Hommes', type: 'bar', stack: 'pop', data: men, barMaxWidth: 12 },
      { name: 'Femmes', type: 'bar', stack: 'pop', data: women, barMaxWidth: 12 },
    ],
  }
}

export default function BestOfGrid() {
  const { setActiveDomaine } = useVisualisations()
  const [populationPdi, setPopulationPdi] = useState(null)
  const [populationPyramid, setPopulationPyramid] = useState(null)
  const [educationRows, setEducationRows] = useState([])
  const [priceRows, setPriceRows] = useState([])
  const [coverageRows, setCoverageRows] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/json/population/courbe_pdi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/pyramide_demographique.json')).then((r) => r.json()),
      fetch(withBase('data/viz/csv/education_indicateurs.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/csv/economie_prix_alimentaires.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/csv/sante_couverture_sanitaire.csv')).then((r) => r.text()),
    ])
      .then(([
        pdiCurve,
        pdiPyramid,
        educationText,
        pricesText,
        coverageText,
      ]) => {
        setPopulationPdi(pdiCurve || null)
        setPopulationPyramid(pdiPyramid || null)
        setEducationRows(parseCsv(educationText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          region: String(row.region || '').trim(),
        })))
        setPriceRows(parseCsv(pricesText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          produit: String(row.produit || '').trim().toLowerCase(),
          date: String(row.date || '').trim(),
          prix_local: Number(row.prix_local || 0),
        })))
        setCoverageRows(parseCsv(coverageText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          region: String(row.region || '').trim(),
        })))
      })
      .catch(() => {
        setPopulationPdi(null)
        setPopulationPyramid(null)
      })
  }, [])

  const optionsMap = useMemo(() => {
    const mapById = {}

    const pdiLabels = populationPdi?.categories || []
    const pdiValues = populationPdi?.series?.[0]?.data || []
    mapById['population-line'] = simpleLineOption('#0d631b', pdiLabels, pdiValues)

    if (populationPyramid?.tranches?.length && populationPyramid?.series?.length) {
      const menSerie = populationPyramid.series.find((s) => String(s.nom || '').toLowerCase().includes('hom'))
      const womenSerie = populationPyramid.series.find((s) => String(s.nom || '').toLowerCase().includes('fem'))

      const tranchesSource = populationPyramid.tranches || []
      const idxByTranche = new Map(tranchesSource.map((name, idx) => [name, idx]))
      const orderedTranches = TRANCHE_ORDER.filter((tranche) => idxByTranche.has(tranche))
      const totalTranches = tranchesSource.filter((name) => /total/i.test(String(name || '')))
      const remainingTranches = tranchesSource.filter((name) => (
        !orderedTranches.includes(name) && !/total/i.test(String(name || ''))
      ))

      const labels = [...orderedTranches, ...remainingTranches, ...totalTranches]
      const men = labels.map((label) => -(menSerie?.data?.[idxByTranche.get(label)] || 0))
      const women = labels.map((label) => womenSerie?.data?.[idxByTranche.get(label)] || 0)
      mapById['population-pyramid'] = pyramidOption(labels, men, women)
    } else {
      mapById['population-pyramid'] = {}
    }

    const filteredResultsRows = educationRows.filter((row) => (
      [IND_RESULTATS_CEP, IND_RESULTATS_BEPC, IND_RESULTATS_BAC].includes(row.indicateur)
      && row.valeur > 0
      && normalizeName(row.categorie_1) === 'pourcentage'
    ))

    const resultsRateSeries = [IND_RESULTATS_CEP, IND_RESULTATS_BEPC, IND_RESULTATS_BAC].map((indicator) => {
      const byYear = new Map()
      filteredResultsRows
        .filter((row) => row.indicateur === indicator)
        .forEach((row) => {
          if (!row.annee) return
          byYear.set(row.annee, Math.max(byYear.get(row.annee) || 0, row.valeur))
        })

      const values = Array.from(byYear.entries())
        .map(([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year)

      return {
        indicator,
        label: indicator === IND_RESULTATS_CEP ? 'CEP' : indicator === IND_RESULTATS_BEPC ? 'BEPC' : 'Baccalauréat',
        values,
      }
    })

    const resultYears = Array.from(new Set(resultsRateSeries.flatMap((series) => series.values.map((value) => value.year)))).sort((a, b) => a - b)
    const valueByYear = (series) => {
      const map = new Map(series.values.map((value) => [value.year, value.value]))
      return resultYears.map((year) => (map.has(year) ? map.get(year) : null))
    }

    mapById['education-success'] = {
      color: ['#0b6bcb', '#e67e22', '#7d3c98'],
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => (value == null ? 'N/A' : `${Number(value).toFixed(2)}%`),
      },
      legend: { top: 4 },
      grid: { left: 44, right: 16, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: resultYears },
      yAxis: { type: 'value', min: 0, max: 100, name: '%' },
      series: resultsRateSeries.map((series) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: valueByYear(series),
      })),
    }

    const coverageSeries = [
      { key: IND_COV_2G, label: 'Couverture 2G' },
      { key: IND_COV_3G, label: 'Couverture 3G' },
      { key: IND_COV_4G, label: 'Couverture 4G/LTE' },
    ].map((def) => {
      const byYear = new Map()
      educationRows
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

    const networkYears = Array.from(new Set(coverageSeries.flatMap((series) => series.values.map((value) => value.year)))).sort((a, b) => a - b)
    const networkValuesByYear = (series) => {
      const map = new Map(series.values.map((value) => [value.year, value.value]))
      return networkYears.map((year) => (map.has(year) ? map.get(year) : null))
    }

    mapById['education-network'] = {
      color: ['#2e7d32', '#1565c0', '#755b00'],
      tooltip: { trigger: 'axis' },
      legend: { top: 4 },
      grid: { left: 44, right: 16, top: 52, bottom: 24, containLabel: true },
      xAxis: { type: 'category', data: networkYears },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: coverageSeries.map((series) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        connectNulls: false,
        data: networkValuesByYear(series),
      })),
    }

    const filteredPriceRows = priceRows.filter((row) => row.produit === 'mil')
    const priceGroups = new Map()
    filteredPriceRows.forEach((row) => {
      const rawDate = String(row.date || '').toLowerCase()
      const monthLabel = rawDate.split(' ')[0]
      const monthIndex = MONTH_ORDER[monthLabel] || 0
      const key = `${row.annee}-${String(monthIndex).padStart(2, '0')}`
      const entry = priceGroups.get(key) || {
        label: row.date || String(row.annee),
        total: 0,
        count: 0,
      }

      entry.total += Number(row.prix_local || 0)
      entry.count += 1
      priceGroups.set(key, entry)
    })

    const priceTimeline = Array.from(priceGroups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([, entry]) => ({
        label: entry.label,
        value: entry.count ? entry.total / entry.count : 0,
      }))

    mapById['economie-prices'] = {
      color: ['#A16D00'],
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!params?.length) return ''
          return `${params[0].axisValue}<br/><b>${Number(params[0].value || 0).toLocaleString('fr-FR')} FCFA</b>`
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
        axisLabel: { formatter: (value) => Number(value || 0).toLocaleString('fr-FR') },
        splitLine: { lineStyle: { color: '#eceff1' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#A16D00', width: 2.8 },
          areaStyle: { color: '#A16D0018' },
          itemStyle: { color: '#A16D00' },
          data: priceTimeline.map((point) => Number(point.value.toFixed(2))),
        },
      ],
    }

    const cpn2Rows = coverageRows
      .filter((row) => row.indicateur === CPN2_INDICATOR && row.region === 'Burkina Faso')
      .sort((a, b) => a.annee - b.annee)
    mapById['sante-access'] = {
      color: ['#00695C'],
      tooltip: { trigger: 'axis' },
      grid: { left: 56, right: 18, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: cpn2Rows.map((row) => row.annee),
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
          lineStyle: { color: '#00695C', width: 2.8 },
          itemStyle: { color: '#00695C' },
          data: cpn2Rows.map((row) => Number(row.valeur.toFixed(2))),
        },
      ],
    }

    return mapById
  }, [populationPdi, populationPyramid, educationRows, priceRows, coverageRows])

  return (
    <section className="bestof-grid" aria-label="Apercu des visualisations">
      <h2 className="bestof-grid__title">Nos meilleures visualisations</h2>
      <div className="bestof-grid__layout">
        {VISUAL_HIGHLIGHTS.map((item) => (
          <article
            key={item.id}
            className={`bestof-card${item.featured ? ' bestof-card--featured' : ''}`}
            style={{ '--card-accent': item.accent, '--preview-height': `${item.previewHeight || 300}px` }}
          >
            <div className="bestof-card__item bestof-card__item--single">
              <button type="button" className="bestof-chart-wrap" onClick={() => setActiveDomaine(item.domaine)} aria-label={`Explorer ${item.label}`}>
                <ReactECharts option={optionsMap[item.id] || {}} style={{ width: '100%', height: `${item.previewHeight || 300}px` }} opts={{ renderer: 'svg' }} />
                <span className="bestof-chart-overlay" aria-hidden="true">
                  <strong>{item.label}</strong>
                  <span className="bestof-chart-overlay__cta">Explorer</span>
                </span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
