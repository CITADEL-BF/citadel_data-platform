/**
 * FiltersPanel — filtres appliques aux lignes avant agregation / trace.
 *
 * Un filtre par colonne au maximum. Selon le type :
 *   - nombre / latitude / longitude -> intervalle (min / max)
 *   - autre (categorie, texte, booleen, date) -> selection de valeurs
 */

import { useMemo } from 'react'
import { BsXLg } from 'react-icons/bs'
import { coerceNumber } from '../engine/detectTypes'
import { distinctValues, numericExtent } from '../engine/applyFilters'
import { useStudioText } from '../i18n'
import './FiltersPanel.css'

const RANGE_TYPES = new Set(['number', 'geo-lat', 'geo-lon'])

function kindForColumn(col) {
  return RANGE_TYPES.has(col.type) ? 'range' : 'category'
}

export default function FiltersPanel({ columns, rows, hasHeaderRow, filters, onChange }) {
  const t = useStudioText()

  const usedColumns = new Set(filters.map((f) => f.column))
  const addable = columns.filter((c) => !usedColumns.has(c.key))

  const colByKey = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns]
  )

  function addFilter(key) {
    if (!key) return
    const col = colByKey[key]
    const kind = kindForColumn(col)
    onChange([
      ...filters,
      kind === 'range'
        ? { column: key, kind, min: null, max: null }
        : { column: key, kind, values: [] },
    ])
  }

  function updateFilter(key, patch) {
    onChange(filters.map((f) => (f.column === key ? { ...f, ...patch } : f)))
  }

  function removeFilter(key) {
    onChange(filters.filter((f) => f.column !== key))
  }

  return (
    <div className="filters-panel">
      <div className="filters-panel__head">
        <span className="filters-panel__title">{t.filters.title}</span>
        {addable.length > 0 && (
          <select
            className="filters-panel__add"
            value=""
            onChange={(e) => {
              addFilter(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">{t.filters.add}</option>
            {addable.map((c) => (
              <option key={c.key} value={c.key}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {filters.length === 0 && <p className="filters-panel__empty">{t.filters.empty}</p>}

      <div className="filters-panel__list">
        {filters.map((f) => {
          const col = colByKey[f.column]
          if (!col) return null
          return (
            <div key={f.column} className="filters-panel__item">
              <div className="filters-panel__item-head">
                <span className="filters-panel__item-name">{col.name}</span>
                <button
                  type="button"
                  className="filters-panel__remove"
                  onClick={() => removeFilter(f.column)}
                  aria-label={`${t.filters.remove} — ${col.name}`}
                >
                  <BsXLg aria-hidden="true" />
                </button>
              </div>

              {f.kind === 'range' ? (
                <RangeControl
                  filter={f}
                  extent={numericExtent(rows, hasHeaderRow, col)}
                  onChange={(patch) => updateFilter(f.column, patch)}
                  labels={t.filters}
                />
              ) : (
                <CategoryControl
                  filter={f}
                  options={distinctValues(rows, hasHeaderRow, col)}
                  onChange={(values) => updateFilter(f.column, { values })}
                  labels={t.filters}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RangeControl({ filter, extent, onChange, labels }) {
  const [lo, hi] = extent
  return (
    <div className="filters-panel__range">
      <label>
        {labels.min}
        <input
          type="number"
          value={filter.min ?? ''}
          placeholder={lo != null ? String(lo) : ''}
          onChange={(e) => onChange({ min: e.target.value === '' ? null : coerceNumber(e.target.value) })}
        />
      </label>
      <label>
        {labels.max}
        <input
          type="number"
          value={filter.max ?? ''}
          placeholder={hi != null ? String(hi) : ''}
          onChange={(e) => onChange({ max: e.target.value === '' ? null : coerceNumber(e.target.value) })}
        />
      </label>
    </div>
  )
}

function CategoryControl({ filter, options, onChange, labels }) {
  const selected = new Set(filter.values)
  function toggle(value) {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange([...next])
  }
  return (
    <div className="filters-panel__cats">
      <div className="filters-panel__cats-actions">
        <button type="button" onClick={() => onChange(options.slice())}>{labels.all}</button>
        <button type="button" onClick={() => onChange([])}>{labels.none}</button>
        <span className="filters-panel__cats-count">
          {selected.size > 0 ? `${selected.size}/${options.length}` : labels.inactive}
        </span>
      </div>
      <div className="filters-panel__cats-list">
        {options.map((opt) => (
          <label key={opt} className="filters-panel__cat">
            <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
