/**
 * DataTable — apercu tabulaire des donnees importees avec, en entete, un
 * selecteur de type par colonne.
 *
 * Presentation seulement : l'etat (colonnes, matrice) vient du parent.
 */

import { useMemo } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { TYPE_LABELS, SELECTABLE_TYPES } from '../engine/detectTypes'
import { useStudioText } from '../i18n'
import './DataTable.css'

const MAX_ROWS = 200

export default function DataTable({ rows, columns, hasHeaderRow, onChangeType }) {
  const { language } = useLanguage()
  const t = useStudioText()
  const typeLabels = TYPE_LABELS[language] || TYPE_LABELS.fr

  const bodyRows = useMemo(() => {
    const body = hasHeaderRow ? rows.slice(1) : rows
    return body.slice(0, MAX_ROWS)
  }, [rows, hasHeaderRow])

  const totalBody = hasHeaderRow ? rows.length - 1 : rows.length

  return (
    <div className="data-table">
      <div className="data-table__scroll" role="region" aria-label={t.describe.title} tabIndex={0}>
        <table className="data-table__grid">
          <thead>
            <tr>
              <th className="data-table__rownum" scope="col" aria-label="#" />
              {columns.map((col) => (
                <th key={col.key} scope="col" className="data-table__col-head">
                  <span className="data-table__col-name" title={col.name}>{col.name}</span>
                  <select
                    className="data-table__type-select"
                    value={col.type}
                    onChange={(e) => onChangeType(col.key, e.target.value)}
                    aria-label={`${t.describe.typeColumn} — ${col.name}`}
                  >
                    {SELECTABLE_TYPES.map((type) => (
                      <option key={type} value={type}>{typeLabels[type]}</option>
                    ))}
                  </select>
                  {col.type !== col.detectedType && (
                    <span className="data-table__col-detected">
                      {typeLabels[col.detectedType]} {t.describe.detected}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="data-table__rownum">{rIdx + 1}</td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`data-table__cell data-table__cell--${col.type}`}
                  >
                    {row[col.index] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="data-table__note">{t.describe.previewNote(bodyRows.length, totalBody)}</p>
    </div>
  )
}
