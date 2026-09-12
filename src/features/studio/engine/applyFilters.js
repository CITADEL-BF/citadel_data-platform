/**
 * applyFilters — filtrage des lignes AVANT agregation / trace.
 *
 * Deux formes de filtre (dans config.filters) :
 *   { column, kind: 'category', values: string[] }  garde les lignes dont la
 *       valeur figure dans `values` ( [] => filtre inactif )
 *   { column, kind: 'range', min: number|null, max: number|null }  garde les
 *       lignes dont la valeur numerique est dans l'intervalle
 */

import { coerceNumber } from './detectTypes'

export function bodyRows(rows, hasHeaderRow) {
  return hasHeaderRow ? rows.slice(1) : rows
}

function columnIndex(columns, key) {
  const col = columns.find((c) => c.key === key)
  return col ? col.index : -1
}

export function applyFilters(rows, hasHeaderRow, columns, filters) {
  const body = bodyRows(rows, hasHeaderRow)
  if (!Array.isArray(filters) || filters.length === 0) return body

  const active = filters
    .map((f) => ({ ...f, index: columnIndex(columns, f.column) }))
    .filter((f) => {
      if (f.index < 0) return false
      if (f.kind === 'category') return Array.isArray(f.values) && f.values.length > 0
      if (f.kind === 'range') return f.min != null || f.max != null
      return false
    })

  if (active.length === 0) return body

  return body.filter((row) =>
    active.every((f) => {
      const raw = (row[f.index] ?? '').trim()
      if (f.kind === 'category') {
        return f.values.includes(raw)
      }
      const n = coerceNumber(raw)
      if (Number.isNaN(n)) return false
      if (f.min != null && n < f.min) return false
      if (f.max != null && n > f.max) return false
      return true
    })
  )
}

const RANGE_TYPES = new Set(['number', 'geo-lat', 'geo-lon'])

/** Retire les filtres dont la colonne a disparu ou change de nature. */
export function pruneFilters(filters, columns) {
  if (!Array.isArray(filters)) return []
  const byKey = new Map(columns.map((c) => [c.key, c]))
  return filters.filter((f) => {
    const col = byKey.get(f.column)
    if (!col) return false
    const expected = RANGE_TYPES.has(col.type) ? 'range' : 'category'
    return f.kind === expected
  })
}

/** Valeurs distinctes d'une colonne (pour le selecteur de filtre categorie). */
export function distinctValues(rows, hasHeaderRow, column, limit = 500) {
  const idx = column?.index ?? -1
  if (idx < 0) return []
  const set = new Set()
  for (const row of bodyRows(rows, hasHeaderRow)) {
    const v = (row[idx] ?? '').trim()
    if (v !== '') set.add(v)
    if (set.size >= limit) break
  }
  const allNumeric = [...set].every((v) => !Number.isNaN(Number(v)))
  return [...set].sort(allNumeric ? (a, b) => Number(a) - Number(b) : (a, b) => a.localeCompare(b, 'fr'))
}

/** Etendue numerique [min, max] d'une colonne (pour le filtre intervalle). */
export function numericExtent(rows, hasHeaderRow, column) {
  const idx = column?.index ?? -1
  if (idx < 0) return [null, null]
  let min = Infinity
  let max = -Infinity
  for (const row of bodyRows(rows, hasHeaderRow)) {
    const n = coerceNumber(row[idx])
    if (Number.isNaN(n)) continue
    if (n < min) min = n
    if (n > max) max = n
  }
  if (min === Infinity) return [null, null]
  return [min, max]
}
