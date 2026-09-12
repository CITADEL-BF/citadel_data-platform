/**
 * VisualizeStep — etape 3 : choisir une vue, affecter les colonnes aux axes,
 * filtrer les lignes, afficher le graphe.
 *
 * Vues : barres, courbe, nuage de points, histogramme.
 */

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { availableViews } from '../engine/compatibility'
import { getView } from '../engine/viewCatalog'
import { dimensionColumns, measureColumns, AGGREGATIONS, AGG_LABELS } from '../engine/roles'
import { buildEchartsOption } from '../engine/buildEchartsOption'
import { useRegionBoundaries } from '../hooks/useRegionBoundaries'
import FiltersPanel from '../components/FiltersPanel'
import RefinePanel from './RefinePanel'
import { useStudioText } from '../i18n'
import './VisualizeStep.css'

export default function VisualizeStep({ config, onSetView, onSetFilters, onPatchConfig, onBack, onNext }) {
  const { language } = useLanguage()
  const t = useStudioText()
  const aggLabels = AGG_LABELS[language] || AGG_LABELS.fr

  const { columns, data, filters, meta, source, refine, annotations } = config
  const view = config.view || { type: 'bar', encodings: { x: null, y: null, series: null, agg: 'sum' } }
  const { encodings } = view
  const viewSpec = getView(view.type) || getView('bar')
  const hasSeries = Boolean(viewSpec.allowsSeries && encodings.series)

  const views = useMemo(() => availableViews(columns), [columns])
  const dims = useMemo(() => dimensionColumns(columns), [columns])
  const measures = useMemo(() => measureColumns(columns), [columns])

  const xChoices = viewSpec.needs.x === 'measure' ? measures : dims
  const yChoices = measures.filter((c) => c.key !== encodings.x)
  const seriesChoices = dims.filter((c) => c.key !== encodings.x)

  const boundaries = useRegionBoundaries(viewSpec.isGeo)

  const { option, warnings } = useMemo(
    () =>
      buildEchartsOption({
        columns,
        rows: data.rows,
        hasHeaderRow: data.hasHeaderRow,
        filters,
        view: view.type,
        encodings,
        meta,
        source,
        refine,
        annotations,
        language,
        boundaries: boundaries.geojson,
      }),
    [columns, data.rows, data.hasHeaderRow, filters, view.type, encodings, meta, source, refine, annotations, language, boundaries.geojson]
  )

  const setEncoding = (patch) => onSetView({ ...view, encodings: { ...encodings, ...patch } })

  return (
    <div className="visualize-step">
      <div className="visualize-step__gallery" role="tablist" aria-label={t.visualize.viewLabel}>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view.type === v.id}
            disabled={!v.enabled}
            className={
              'visualize-step__view' + (view.type === v.id ? ' visualize-step__view--active' : '')
            }
            onClick={() => onSetView({ ...view, type: v.id })}
          >
            <span className="visualize-step__view-icon" aria-hidden="true">{v.icon}</span>
            {v.label[language] || v.label.fr}
          </button>
        ))}
      </div>

      <div className="visualize-step__body">
        <div className="visualize-step__side">
          <div className="visualize-step__controls">
            <label className="visualize-step__field">
              <span>{t.visualize.axisX}</span>
              <select value={encodings.x || ''} onChange={(e) => setEncoding({ x: e.target.value })}>
                {xChoices.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </label>

            {viewSpec.needs.y === 'measure' && (
              <label className="visualize-step__field">
                <span>{t.visualize.axisY}</span>
                <select value={encodings.y || ''} onChange={(e) => setEncoding({ y: e.target.value })}>
                  {yChoices.map((c) => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}

            {viewSpec.usesAggregation && (
              <label className="visualize-step__field">
                <span>{t.visualize.aggregation}</span>
                <select value={encodings.agg} onChange={(e) => setEncoding({ agg: e.target.value })}>
                  {AGGREGATIONS.map((a) => (
                    <option key={a} value={a}>{aggLabels[a]}</option>
                  ))}
                </select>
              </label>
            )}

            {viewSpec.allowsSeries && (
              <label className="visualize-step__field">
                <span>{t.visualize.series}</span>
                <select
                  value={encodings.series || ''}
                  onChange={(e) => setEncoding({ series: e.target.value || null })}
                >
                  <option value="">{t.visualize.noSeries}</option>
                  {seriesChoices.map((c) => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <FiltersPanel
            columns={columns}
            rows={data.rows}
            hasHeaderRow={data.hasHeaderRow}
            filters={filters}
            onChange={onSetFilters}
          />

          <RefinePanel
            meta={meta}
            source={source}
            refine={refine}
            annotations={annotations}
            hasSeries={hasSeries}
            onChange={onPatchConfig}
          />
        </div>

        <div className="visualize-step__chart">
          {viewSpec.isGeo && boundaries.status !== 'ready' ? (
            <p className="visualize-step__map-status" role="status">
              {boundaries.status === 'error' ? t.visualize.mapError : t.visualize.mapLoading}
            </p>
          ) : (
            <ReactECharts
              option={option}
              notMerge
              lazyUpdate
              style={{ height: 440, width: '100%' }}
            />
          )}
          {warnings.length > 0 && (
            <ul className="visualize-step__warnings">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="visualize-step__actions">
        <button type="button" className="btn-ghost" onClick={onBack}>
          {t.visualize.back}
        </button>
        <button type="button" className="btn-primary" onClick={onNext}>
          {t.visualize.next}
        </button>
      </div>
    </div>
  )
}
