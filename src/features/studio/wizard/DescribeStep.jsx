/**
 * DescribeStep — etape 2 : verifier la structure detectee.
 * Bascule "1re ligne = en-tetes", correction manuelle des types,
 * panneau des anomalies de type.
 */

import { useMemo } from 'react'
import DataTable from '../components/DataTable'
import { useStudioText } from '../i18n'
import './DescribeStep.css'

export default function DescribeStep({ config, totalRows, onToggleHeader, onChangeType, onBack, onNext }) {
  const t = useStudioText()
  const { columns, data } = config

  const problems = useMemo(
    () =>
      columns
        .filter((c) => (c.type === 'number' || c.type === 'date') && c.nonConforming?.count > 0)
        .map((c) => ({
          key: c.key,
          message: t.describe.nonConforming(c.name, c.nonConforming.count, c.nonConforming.examples || []),
        })),
    [columns, t]
  )

  return (
    <div className="describe-step">
      <div className="describe-step__toolbar">
        <label className="describe-step__toggle">
          <input
            type="checkbox"
            checked={data.hasHeaderRow}
            onChange={(e) => onToggleHeader(e.target.checked)}
          />
          {t.describe.headerToggle}
        </label>
        <span className="describe-step__count">
          {t.describe.rowsCount(data.hasHeaderRow ? Math.max(totalRows - 1, 0) : totalRows)}
          {' · '}
          {t.describe.colsCount(columns.length)}
        </span>
      </div>

      <DataTable
        rows={data.rows}
        columns={columns}
        hasHeaderRow={data.hasHeaderRow}
        onChangeType={onChangeType}
      />

      <div className="describe-step__problems">
        <h3 className="describe-step__problems-title">{t.describe.problemsTitle}</h3>
        {problems.length === 0 ? (
          <p className="describe-step__ok">{t.describe.noProblems}</p>
        ) : (
          <ul className="describe-step__problems-list">
            {problems.map((p) => (
              <li key={p.key}>{p.message}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="describe-step__actions">
        <button type="button" className="btn-ghost" onClick={onBack}>
          {t.describe.back}
        </button>
        <button type="button" className="btn-primary" onClick={onNext}>
          {t.describe.next}
        </button>
      </div>
    </div>
  )
}
