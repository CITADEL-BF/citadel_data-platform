/**
 * compatibility — quelles vues sont possibles avec les colonnes courantes, et
 * quel encodage proposer par defaut.
 */

import { VIEW_LIST } from './viewCatalog'
import { measureColumns, dimensionColumns } from './roles'

/** Vues realisables : il faut au moins une dimension et une mesure. */
export function availableViews(columns) {
  const hasDim = dimensionColumns(columns).length > 0
  const hasMeasure = measureColumns(columns).length > 0
  return VIEW_LIST.map((view) => ({
    ...view,
    enabled: hasDim && hasMeasure,
  }))
}

/**
 * Encodage par defaut pour une vue : X = premiere dimension (une date si
 * possible), Y = premiere mesure, pas de serie, agregation par somme.
 */
export function defaultEncodings(columns, viewId) {
  const dims = dimensionColumns(columns)
  const measures = measureColumns(columns)
  const preferredX =
    viewId === 'line'
      ? dims.find((c) => c.type === 'date') || dims[0]
      : dims.find((c) => c.type === 'date' || c.type === 'category') || dims[0]

  return {
    x: preferredX?.key ?? null,
    y: measures[0]?.key ?? null,
    series: null,
    agg: 'sum',
  }
}

/** Garde-fou : un encodage reste-t-il valide apres un changement de types ? */
export function sanitizeEncodings(columns, encodings) {
  const dims = dimensionColumns(columns)
  const measures = measureColumns(columns)
  const dimKeys = new Set(dims.map((c) => c.key))
  const measureKeys = new Set(measures.map((c) => c.key))
  const x = dimKeys.has(encodings?.x) ? encodings.x : (dims[0]?.key ?? null)
  return {
    x,
    y: measureKeys.has(encodings?.y) ? encodings.y : (measures[0]?.key ?? null),
    series:
      encodings?.series && dimKeys.has(encodings.series) && encodings.series !== x
        ? encodings.series
        : null,
    agg: ['sum', 'mean', 'count', 'min', 'max'].includes(encodings?.agg) ? encodings.agg : 'sum',
  }
}
