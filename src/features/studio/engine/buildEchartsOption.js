/**
 * buildEchartsOption — transforme (colonnes + matrice + filtres + vue +
 * encodage) en une option ECharts prete a rendre.
 *
 *   1. filtre les lignes (applyFilters) ;
 *   2. selon la vue :
 *        bar / line  -> agrege Y par X (et serie) ;
 *        scatter     -> points bruts (X, Y) ;
 *        histogram   -> repartition de X en classes, effectif ;
 *   3. produit l'option ECharts, nombres formates en FR / EN.
 */

import { coerceNumber } from './detectTypes'
import { getView } from './viewCatalog'
import { applyFilters } from './applyFilters'

const PALETTE = [
  '#0d631b', '#1565c0', '#755b00', '#00695c', '#af0012',
  '#5b3a8c', '#c76e00', '#2e7d32', '#00838f', '#8e24aa',
]

const SCATTER_MAX_POINTS = 5000

function columnByKey(columns, key) {
  return columns.find((c) => c.key === key) || null
}

function aggregate(values, agg) {
  const nums = values.filter((v) => !Number.isNaN(v))
  if (agg === 'count') return values.length
  if (nums.length === 0) return 0
  switch (agg) {
    case 'mean': return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'min': return Math.min(...nums)
    case 'max': return Math.max(...nums)
    case 'sum':
    default: return nums.reduce((a, b) => a + b, 0)
  }
}

function sortCategories(cats) {
  const allNumeric = cats.every((c) => c !== '' && !Number.isNaN(Number(c)))
  const copy = [...cats]
  copy.sort(allNumeric ? (a, b) => Number(a) - Number(b) : (a, b) => a.localeCompare(b, 'fr'))
  return copy
}

function baseOption(nf, { title, legend, xName, yName, xType = 'category', xData, zeroBaseline, rotate }) {
  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    grid: { left: 8, right: 16, bottom: legend ? 24 : 8, top: title ? 48 : 24, containLabel: true },
    tooltip: { trigger: xType === 'value' ? 'item' : 'axis', valueFormatter: (v) => (v == null ? '—' : nf.format(v)) },
    legend: legend ? { type: 'scroll', bottom: 0 } : undefined,
    xAxis: {
      type: xType,
      data: xType === 'category' ? xData : undefined,
      name: xName,
      nameLocation: 'middle',
      nameGap: 32,
      scale: xType === 'value',
      axisLabel: { hideOverlap: true, rotate: rotate || 0, formatter: xType === 'value' ? (v) => nf.format(v) : undefined },
    },
    yAxis: {
      type: 'value',
      name: yName,
      scale: !zeroBaseline,
      axisLabel: { formatter: (v) => nf.format(v) },
    },
  }
}

/* ---------- bar / line ---------- */
function buildCategorical(viewSpec, ctx) {
  const { columns, body, encodings, nf, language, title } = ctx
  const xCol = columnByKey(columns, encodings.x)
  const yCol = columnByKey(columns, encodings.y)
  const sCol = encodings.series ? columnByKey(columns, encodings.series) : null
  const warnings = []
  if (!xCol || !yCol) return { option: { title: { text: title } }, warnings: ['encodage incomplet'] }

  const agg = encodings.agg || 'sum'
  const buckets = new Map()
  const xValues = []
  const seriesNames = []

  for (const row of body) {
    const xv = (row[xCol.index] ?? '').trim()
    if (xv === '') continue
    const sv = sCol ? ((row[sCol.index] ?? '').trim() || '—') : '__single__'
    const yv = coerceNumber(row[yCol.index])
    if (!buckets.has(xv)) { buckets.set(xv, new Map()); xValues.push(xv) }
    const inner = buckets.get(xv)
    if (!inner.has(sv)) { inner.set(sv, []); if (sCol && !seriesNames.includes(sv)) seriesNames.push(sv) }
    inner.get(sv).push(yv)
  }
  if (xValues.length === 0) return { option: { title: { text: title } }, warnings: ['aucune donnee a tracer'] }

  const categories = sortCategories(xValues)
  const effSeries = sCol ? sortCategories(seriesNames) : ['__single__']
  if (sCol && effSeries.length > 20) {
    warnings.push(language === 'en'
      ? `${effSeries.length} series — the chart may be hard to read.`
      : `${effSeries.length} séries — le graphique risque d'être illisible.`)
  }

  const series = effSeries.map((sName, idx) => ({
    name: sCol ? sName : yCol.name,
    type: viewSpec.id === 'line' ? 'line' : 'bar',
    stack: viewSpec.id === 'bar' && sCol ? 'total' : undefined,
    smooth: viewSpec.id === 'line',
    showSymbol: viewSpec.id === 'line' && categories.length <= 24,
    emphasis: { focus: 'series' },
    itemStyle: { color: PALETTE[idx % PALETTE.length] },
    data: categories.map((cat) => {
      const vals = buckets.get(cat)?.get(sName) ?? []
      return vals.length ? Number(aggregate(vals, agg).toFixed(4)) : null
    }),
  }))

  const option = {
    ...baseOption(nf, {
      title, legend: Boolean(sCol), xName: xCol.name,
      yName: agg === 'count' ? '' : yCol.name,
      xData: categories, zeroBaseline: viewSpec.zeroBaseline,
      rotate: categories.length > 12 ? 35 : 0,
    }),
    series,
  }
  return { option, warnings }
}

/* ---------- scatter ---------- */
function buildScatter(ctx) {
  const { columns, body, encodings, nf, language, title } = ctx
  const xCol = columnByKey(columns, encodings.x)
  const yCol = columnByKey(columns, encodings.y)
  const sCol = encodings.series ? columnByKey(columns, encodings.series) : null
  const warnings = []
  if (!xCol || !yCol) return { option: { title: { text: title } }, warnings: ['encodage incomplet'] }

  const groups = new Map()
  let kept = 0
  for (const row of body) {
    const x = coerceNumber(row[xCol.index])
    const y = coerceNumber(row[yCol.index])
    if (Number.isNaN(x) || Number.isNaN(y)) continue
    if (kept >= SCATTER_MAX_POINTS) break
    kept += 1
    const g = sCol ? ((row[sCol.index] ?? '').trim() || '—') : '__single__'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push([x, y])
  }
  if (kept === 0) return { option: { title: { text: title } }, warnings: ['aucune donnee a tracer'] }
  if (kept >= SCATTER_MAX_POINTS) {
    warnings.push(language === 'en'
      ? `Limited to ${SCATTER_MAX_POINTS} points.`
      : `Limité à ${SCATTER_MAX_POINTS} points.`)
  }

  const series = [...groups.entries()].map(([name, data], idx) => ({
    name: sCol ? name : yCol.name,
    type: 'scatter',
    symbolSize: 8,
    itemStyle: { color: PALETTE[idx % PALETTE.length], opacity: 0.75 },
    data,
  }))

  const option = {
    ...baseOption(nf, {
      title, legend: Boolean(sCol), xName: xCol.name, yName: yCol.name,
      xType: 'value', zeroBaseline: false,
    }),
    series,
  }
  return { option, warnings }
}

/* ---------- histogram ---------- */
function buildHistogram(ctx) {
  const { columns, body, encodings, nf, language, title } = ctx
  const xCol = columnByKey(columns, encodings.x)
  if (!xCol) return { option: { title: { text: title } }, warnings: ['encodage incomplet'] }

  const values = []
  for (const row of body) {
    const n = coerceNumber(row[xCol.index])
    if (!Number.isNaN(n)) values.push(n)
  }
  if (values.length === 0) return { option: { title: { text: title } }, warnings: ['aucune donnee a tracer'] }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(values.length))))
  const width = (max - min) / binCount || 1
  const counts = new Array(binCount).fill(0)
  for (const v of values) {
    let bin = Math.floor((v - min) / width)
    if (bin < 0) bin = 0
    if (bin >= binCount) bin = binCount - 1
    counts[bin] += 1
  }
  const labels = counts.map((_, i) => {
    const a = min + i * width
    const b = i === binCount - 1 ? max : a + width
    return `${nf.format(Number(a.toFixed(2)))} – ${nf.format(Number(b.toFixed(2)))}`
  })

  const option = {
    ...baseOption(nf, {
      title, legend: false, xName: xCol.name,
      yName: language === 'en' ? 'Count' : 'Effectif',
      xData: labels, zeroBaseline: true, rotate: 35,
    }),
    series: [{
      name: language === 'en' ? 'Count' : 'Effectif',
      type: 'bar',
      barCategoryGap: '2%',
      itemStyle: { color: PALETTE[0] },
      data: counts,
    }],
  }
  return { option, warnings: [] }
}

/**
 * @returns {{ option: object, warnings: string[] }}
 */
export function buildEchartsOption({ columns, rows, hasHeaderRow, filters, view, encodings, language = 'fr', title = '' }) {
  const viewSpec = getView(view) || getView('bar')
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  const nf = new Intl.NumberFormat(locale)
  const body = applyFilters(rows, hasHeaderRow, columns, filters || [])
  const ctx = { columns, body, encodings: encodings || {}, nf, language, title }

  if (viewSpec.id === 'scatter') return buildScatter(ctx)
  if (viewSpec.id === 'histogram') return buildHistogram(ctx)
  return buildCategorical(viewSpec, ctx)
}
