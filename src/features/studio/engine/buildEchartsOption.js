/**
 * buildEchartsOption — transforme (colonnes + matrice + vue + encodage) en une
 * option ECharts prete a rendre.
 *
 * Etapes :
 *   1. reconstitue des enregistrements a partir de la matrice brute ;
 *   2. agrege Y par valeur de X (et de serie si demandee) ;
 *   3. produit l'option ECharts (barres ou courbe).
 *
 * Formatage des nombres en francais / anglais via Intl.NumberFormat.
 */

import { coerceNumber } from './detectTypes'
import { getView } from './viewCatalog'

const PALETTE = [
  '#0d631b', '#1565c0', '#755b00', '#00695c', '#af0012',
  '#5b3a8c', '#c76e00', '#2e7d32', '#00838f', '#8e24aa',
]

function columnByKey(columns, key) {
  return columns.find((c) => c.key === key) || null
}

function records(rows, hasHeaderRow) {
  return hasHeaderRow ? rows.slice(1) : rows
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

/**
 * @returns {{ option: object, warnings: string[] }}
 */
export function buildEchartsOption({ columns, rows, hasHeaderRow, view, encodings, language = 'fr', title = '' }) {
  const viewSpec = getView(view) || getView('bar')
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  const nf = new Intl.NumberFormat(locale)
  const warnings = []

  const xCol = columnByKey(columns, encodings?.x)
  const yCol = columnByKey(columns, encodings?.y)
  const sCol = encodings?.series ? columnByKey(columns, encodings.series) : null

  if (!xCol || !yCol) {
    return { option: { title: { text: title } }, warnings: ['encodage incomplet'] }
  }

  const body = records(rows, hasHeaderRow)
  const agg = encodings?.agg || 'sum'

  // clef "x" -> clef "serie" -> liste de valeurs numeriques
  const buckets = new Map()
  const xValues = []
  const seriesNames = []

  for (const row of body) {
    const xv = (row[xCol.index] ?? '').trim()
    if (xv === '') continue
    const sv = sCol ? (row[sCol.index] ?? '').trim() || '—' : '__single__'
    const yv = coerceNumber(row[yCol.index])

    if (!buckets.has(xv)) {
      buckets.set(xv, new Map())
      xValues.push(xv)
    }
    const inner = buckets.get(xv)
    if (!inner.has(sv)) {
      inner.set(sv, [])
      if (sCol && !seriesNames.includes(sv)) seriesNames.push(sv)
    }
    inner.get(sv).push(yv)
  }

  if (xValues.length === 0) {
    return { option: { title: { text: title } }, warnings: ['aucune donnee a tracer'] }
  }

  const categories = sortCategories(xValues)
  const effectiveSeries = sCol ? sortCategories(seriesNames) : ['__single__']

  if (sCol && effectiveSeries.length > 20) {
    warnings.push(
      language === 'en'
        ? `${effectiveSeries.length} series — the chart may be hard to read.`
        : `${effectiveSeries.length} séries — le graphique risque d'être illisible.`
    )
  }

  const series = effectiveSeries.map((sName, idx) => ({
    name: sCol ? sName : yCol.name,
    type: viewSpec.id === 'line' ? 'line' : 'bar',
    stack: viewSpec.id === 'bar' && sCol ? 'total' : undefined,
    smooth: viewSpec.id === 'line',
    showSymbol: viewSpec.id === 'line' && categories.length <= 24,
    emphasis: { focus: 'series' },
    itemStyle: { color: PALETTE[idx % PALETTE.length] },
    data: categories.map((cat) => {
      const inner = buckets.get(cat)
      const vals = inner?.get(sName) ?? []
      return vals.length ? Number(aggregate(vals, agg).toFixed(4)) : null
    }),
  }))

  const option = {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    grid: { left: 8, right: 16, bottom: 8, top: title ? 48 : 24, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (v == null ? '—' : nf.format(v)),
    },
    legend: sCol ? { type: 'scroll', bottom: 0 } : undefined,
    xAxis: {
      type: 'category',
      data: categories,
      name: xCol.name,
      nameLocation: 'middle',
      nameGap: 32,
      axisLabel: { hideOverlap: true, rotate: categories.length > 12 ? 35 : 0 },
    },
    yAxis: {
      type: 'value',
      name: agg === 'count' ? '' : yCol.name,
      scale: !viewSpec.zeroBaseline,
      axisLabel: { formatter: (v) => nf.format(v) },
    },
    series,
  }

  return { option, warnings }
}
