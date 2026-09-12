/**
 * buildEchartsOption — transforme (colonnes + matrice + filtres + vue +
 * encodage + personnalisation) en une option ECharts prete a rendre.
 *
 *   1. filtre les lignes (applyFilters) ;
 *   2. selon la vue :
 *        bar / line  -> agrege Y par X (et serie) ;
 *        scatter     -> points bruts (X, Y) ;
 *        histogram   -> repartition de X en classes, effectif ;
 *   3. applique titre / note / source / mention / annotations ;
 *   4. produit l'option ECharts, nombres formates (locale + refine).
 */

import { coerceNumber } from './detectTypes'
import { getView } from './viewCatalog'
import { applyFilters } from './applyFilters'

const PALETTES = {
  default: ['#0d631b', '#1565c0', '#755b00', '#00695c', '#af0012', '#5b3a8c', '#c76e00', '#2e7d32', '#00838f', '#8e24aa'],
  vives: ['#1b9e3f', '#2f7bff', '#ffb300', '#00bcd4', '#e53935', '#7c4dff', '#ff7043', '#43a047', '#26c6da', '#d81b60'],
  sobre: ['#4b5563', '#6b7280', '#9ca3af', '#374151', '#1f2937', '#52525b', '#71717a', '#3f3f46', '#0f172a', '#475569'],
}

const SCATTER_MAX_POINTS = 5000

function getPalette(name) {
  return PALETTES[name] || PALETTES.default
}

function columnByKey(columns, key) {
  return columns.find((c) => c.key === key) || null
}

function makeFormatter(locale, refine) {
  const opts = { useGrouping: refine?.thousands !== false }
  if (refine?.decimals != null) {
    opts.minimumFractionDigits = refine.decimals
    opts.maximumFractionDigits = refine.decimals
  }
  return new Intl.NumberFormat(locale, opts)
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

function baseOption(ctx, { legend, xName, yName, xType = 'category', xData, zeroBaseline, rotate }) {
  const { nf, meta, footerLines } = ctx
  const hasTitle = Boolean(meta.title || meta.note)
  const topForTitle = meta.title && meta.note ? 64 : hasTitle ? 44 : 24
  const bottomForFooter = footerLines.length ? 18 + footerLines.length * 14 : 8

  return {
    title: hasTitle
      ? {
          text: meta.title || '',
          subtext: meta.note || '',
          left: 'center',
          top: 6,
          textStyle: { fontSize: 17, fontWeight: 700, color: '#191c1e' },
          subtextStyle: { fontSize: 12.5, color: '#414941' },
        }
      : undefined,
    grid: {
      left: 8,
      right: 16,
      top: topForTitle,
      bottom: (legend ? 26 : 6) + bottomForFooter,
      containLabel: true,
    },
    tooltip: {
      trigger: xType === 'value' ? 'item' : 'axis',
      valueFormatter: (v) => (v == null ? '—' : nf.format(v)),
    },
    legend: legend ? { type: 'scroll', bottom: bottomForFooter } : undefined,
    graphic: ctx.footerGraphic,
    xAxis: {
      type: xType,
      data: xType === 'category' ? xData : undefined,
      name: xName,
      nameLocation: 'middle',
      nameGap: 32,
      scale: xType === 'value',
      axisLabel: {
        hideOverlap: true,
        rotate: rotate || 0,
        formatter: xType === 'value' ? (v) => nf.format(v) : undefined,
      },
    },
    yAxis: {
      type: 'value',
      name: yName,
      scale: !zeroBaseline,
      axisLabel: { formatter: (v) => nf.format(v) },
    },
  }
}

/* ---------- pied de page : source + mention ---------- */
function buildFooter(ctx) {
  const { source, meta, language } = ctx
  const lines = []
  const parts = []
  if (source?.name) parts.push((language === 'en' ? 'Source: ' : 'Source : ') + source.name)
  if (source?.url) parts.push(source.url)
  if (parts.length) lines.push(parts.join(' — '))
  const byline = meta.byline || (language === 'en' ? 'Made with data.citadel.bf' : 'Créé avec data.citadel.bf')
  lines.push(byline)

  const graphic = lines.map((text, i) => ({
    type: 'text',
    left: 8,
    bottom: 6 + (lines.length - 1 - i) * 14,
    silent: true,
    style: { text, fill: i === lines.length - 1 ? '#9ca3af' : '#6b7280', fontSize: 11 },
  }))
  return { lines, graphic }
}

/* ---------- bar / line ---------- */
function buildCategorical(viewSpec, ctx) {
  const { columns, body, encodings, nf, palette, language } = ctx
  const xCol = columnByKey(columns, encodings.x)
  const yCol = columnByKey(columns, encodings.y)
  const sCol = encodings.series ? columnByKey(columns, encodings.series) : null
  const warnings = []
  if (!xCol || !yCol) return { series: null, axes: null, warnings: ['encodage incomplet'] }

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
  if (xValues.length === 0) return { series: null, axes: null, warnings: ['aucune donnee a tracer'] }

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
    itemStyle: { color: palette[idx % palette.length] },
    data: categories.map((cat) => {
      const vals = buckets.get(cat)?.get(sName) ?? []
      return vals.length ? Number(aggregate(vals, agg).toFixed(4)) : null
    }),
  }))

  return {
    series,
    hasSeries: Boolean(sCol),
    axes: {
      xName: xCol.name,
      yName: agg === 'count' ? (language === 'en' ? 'Count' : 'Effectif') : yCol.name,
      xData: categories,
      zeroBaseline: viewSpec.zeroBaseline,
      rotate: categories.length > 12 ? 35 : 0,
    },
    warnings,
  }
}

/* ---------- scatter ---------- */
function buildScatter(ctx) {
  const { columns, body, encodings, palette, language } = ctx
  const xCol = columnByKey(columns, encodings.x)
  const yCol = columnByKey(columns, encodings.y)
  const sCol = encodings.series ? columnByKey(columns, encodings.series) : null
  const warnings = []
  if (!xCol || !yCol) return { series: null, axes: null, warnings: ['encodage incomplet'] }

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
  if (kept === 0) return { series: null, axes: null, warnings: ['aucune donnee a tracer'] }
  if (kept >= SCATTER_MAX_POINTS) {
    warnings.push(language === 'en' ? `Limited to ${SCATTER_MAX_POINTS} points.` : `Limité à ${SCATTER_MAX_POINTS} points.`)
  }

  const series = [...groups.entries()].map(([name, data], idx) => ({
    name: sCol ? name : yCol.name,
    type: 'scatter',
    symbolSize: 8,
    itemStyle: { color: palette[idx % palette.length], opacity: 0.75 },
    data,
  }))

  return {
    series,
    hasSeries: Boolean(sCol),
    axes: { xName: xCol.name, yName: yCol.name, xType: 'value', zeroBaseline: false },
    warnings,
  }
}

/* ---------- histogram ---------- */
function buildHistogram(ctx) {
  const { columns, body, encodings, nf, palette, language } = ctx
  const xCol = columnByKey(columns, encodings.x)
  if (!xCol) return { series: null, axes: null, warnings: ['encodage incomplet'] }

  const values = []
  for (const row of body) {
    const n = coerceNumber(row[xCol.index])
    if (!Number.isNaN(n)) values.push(n)
  }
  if (values.length === 0) return { series: null, axes: null, warnings: ['aucune donnee a tracer'] }

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

  return {
    series: [{
      name: language === 'en' ? 'Count' : 'Effectif',
      type: 'bar',
      barCategoryGap: '2%',
      itemStyle: { color: palette[0] },
      data: counts,
    }],
    hasSeries: false,
    axes: {
      xName: xCol.name,
      yName: language === 'en' ? 'Count' : 'Effectif',
      xData: labels,
      zeroBaseline: true,
      rotate: 35,
    },
    warnings: [],
  }
}

/* ---------- annotations : lignes de reference horizontales ---------- */
function attachAnnotations(series, annotations, nf) {
  if (!Array.isArray(annotations) || annotations.length === 0 || !series?.length) return
  const data = annotations
    .filter((a) => a.value != null && !Number.isNaN(Number(a.value)))
    .map((a) => ({
      yAxis: Number(a.value),
      label: { formatter: a.label || nf.format(Number(a.value)), position: 'insideEndTop', color: '#af0012' },
    }))
  if (!data.length) return
  series[0].markLine = {
    silent: true,
    symbol: 'none',
    lineStyle: { color: '#af0012', type: 'dashed', width: 1.5 },
    data,
  }
}

/**
 * @returns {{ option: object, warnings: string[] }}
 */
export function buildEchartsOption({
  columns, rows, hasHeaderRow, filters, view, encodings,
  meta = {}, source = {}, refine = {}, annotations = [],
  language = 'fr',
}) {
  const viewSpec = getView(view) || getView('bar')
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  const nf = makeFormatter(locale, refine)
  const body = applyFilters(rows, hasHeaderRow, columns, filters || [])
  const ctx = {
    columns, body, encodings: encodings || {}, nf, language,
    palette: getPalette(refine.palette), meta, source, refine,
  }

  const footer = buildFooter(ctx)
  ctx.footerLines = footer.lines
  ctx.footerGraphic = footer.graphic

  let built
  if (viewSpec.id === 'scatter') built = buildScatter(ctx)
  else if (viewSpec.id === 'histogram') built = buildHistogram(ctx)
  else built = buildCategorical(viewSpec, ctx)

  if (!built.series) {
    return { option: { title: meta.title ? { text: meta.title } : undefined }, warnings: built.warnings }
  }

  attachAnnotations(built.series, annotations, nf)

  const showLegend = built.hasSeries && refine.legend !== false
  const option = {
    ...baseOption(ctx, {
      legend: showLegend,
      xName: built.axes.xName,
      yName: built.axes.yName,
      xType: built.axes.xType || 'category',
      xData: built.axes.xData,
      zeroBaseline: built.axes.zeroBaseline,
      rotate: built.axes.rotate,
    }),
    series: built.series,
  }
  return { option, warnings: built.warnings }
}
