/**
 * compatibility — quelles vues sont possibles avec les colonnes courantes, et
 * quel encodage proposer par defaut.
 */

import { VIEW_LIST, getView } from './viewCatalog'
import { measureColumns, dimensionColumns } from './roles'
import { isGeoNameCandidate } from './detectTypes'

const AGGS = ['sum', 'mean', 'count', 'min', 'max']

/** Une vue donnee est-elle realisable avec ces colonnes ? */
function viewEnabled(view, dims, measures) {
  switch (view.id) {
    case 'scatter':
      return measures.length >= 2
    case 'histogram':
      return measures.length >= 1
    case 'bar':
    case 'line':
    default:
      return dims.length >= 1 && measures.length >= 1
  }
}

export function availableViews(columns) {
  const dims = dimensionColumns(columns)
  const measures = measureColumns(columns)
  return VIEW_LIST.map((view) => ({ ...view, enabled: viewEnabled(view, dims, measures) }))
}

/** Encodage par defaut pour une vue. */
export function defaultEncodings(columns, viewId) {
  const dims = dimensionColumns(columns)
  const measures = measureColumns(columns)

  if (viewId === 'scatter') {
    return { x: measures[0]?.key ?? null, y: measures[1]?.key ?? measures[0]?.key ?? null, series: null, agg: 'sum' }
  }
  if (viewId === 'histogram') {
    return { x: measures[0]?.key ?? null, y: null, series: null, agg: 'count' }
  }
  if (viewId === 'map') {
    const geoX = dims.find((c) => isGeoNameCandidate(c.name)) || dims[0]
    return { x: geoX?.key ?? null, y: measures[0]?.key ?? null, series: null, agg: 'sum' }
  }

  const preferredX =
    viewId === 'line'
      ? dims.find((c) => c.type === 'date') || dims[0]
      : dims.find((c) => c.type === 'date' || c.type === 'category') || dims[0]
  return { x: preferredX?.key ?? null, y: measures[0]?.key ?? null, series: null, agg: 'sum' }
}

/** Garde-fou : ramene un encodage dans un etat valide pour la vue. */
export function sanitizeEncodings(columns, encodings, viewId = 'bar') {
  const view = getView(viewId) || getView('bar')
  const dims = dimensionColumns(columns)
  const measures = measureColumns(columns)
  const dimKeys = new Set(dims.map((c) => c.key))
  const measureKeys = new Set(measures.map((c) => c.key))

  const xPool = view.needs.x === 'measure' ? measureKeys : dimKeys
  const xFallback = (view.needs.x === 'measure' ? measures : dims)[0]?.key ?? null
  const x = xPool.has(encodings?.x) ? encodings.x : xFallback

  let y = null
  if (view.needs.y === 'measure') {
    y = measureKeys.has(encodings?.y) && encodings.y !== x
      ? encodings.y
      : (measures.find((c) => c.key !== x)?.key ?? measures[0]?.key ?? null)
  }

  const series =
    view.allowsSeries && encodings?.series && dimKeys.has(encodings.series) && encodings.series !== x
      ? encodings.series
      : null

  return {
    x,
    y,
    series,
    agg: AGGS.includes(encodings?.agg) ? encodings.agg : (viewId === 'histogram' ? 'count' : 'sum'),
  }
}
