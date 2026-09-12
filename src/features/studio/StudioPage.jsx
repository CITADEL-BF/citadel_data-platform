/**
 * StudioPage — coquille de l'assistant "Visualiser vos donnees" (route /explorer).
 *
 * Perimetre actuel (Phase 1) : Importer (CSV, lien de configuration partage,
 * ou reouverture d'un projet .json) + Verifier + Visualiser (8 vues : barres,
 * courbe, aires, nuage de points, histogramme, circulaire, pyramide des ages,
 * cartes BF choroplethe/points) + filtres + personnalisation + Exporter (PNG,
 * apercu responsive, projet .json, lien de configuration).
 *
 * Tout l'etat utile tient dans `config` (voir state/chartConfig.js), un objet
 * JSON serialisable pense pour devenir plus tard une ligne Supabase sans
 * retoucher le moteur.
 */

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { createEmptyConfig, buildColumns } from './state/chartConfig'
import { defaultEncodings, sanitizeEncodings } from './engine/compatibility'
import { pruneFilters } from './engine/applyFilters'
import { readShareParam, applySharedConfig } from './state/urlState'
import { useStudioText } from './i18n'
import ImportStep from './wizard/ImportStep'
import DescribeStep from './wizard/DescribeStep'
import VisualizeStep from './wizard/VisualizeStep'
import ExportStep from './wizard/ExportStep'
import './StudioPage.css'

const STEPS = ['import', 'describe', 'visualize', 'export']

export default function StudioPage() {
  const { language } = useLanguage()
  const t = useStudioText()
  const [stepIndex, setStepIndex] = useState(0)
  const [config, setConfig] = useState(createEmptyConfig)
  const [totalRows, setTotalRows] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  // Capture unique, au montage : un lien de config partage n'est applique
  // qu'une fois, au tout premier import reussi.
  const [sharedConfig, setSharedConfig] = useState(() => readShareParam(searchParams))

  const currentStep = STEPS[stepIndex]
  const hasData = config.data.rows.length > 0
  const hasView = Boolean(config.view)

  const handleParsed = useCallback(
    ({ rows, delimiter, fileName, totalRows: total }) => {
      const hasHeaderRow = true
      setConfig((prev) => {
        const base = {
          ...prev,
          data: { ...prev.data, mode: 'inline', rows, delimiter, fileName, hasHeaderRow },
          columns: buildColumns(rows, hasHeaderRow, language),
          view: null,
          filters: [],
        }
        return sharedConfig ? applySharedConfig(base, sharedConfig) : base
      })
      setTotalRows(total)
      setStepIndex(sharedConfig?.view ? 2 : 1)
      if (sharedConfig) {
        setSharedConfig(null)
        setSearchParams({}, { replace: true })
      }
    },
    [language, sharedConfig, setSearchParams]
  )

  /** Reconstruit les colonnes puis remet filtres + encodage d'aplomb. */
  const recolumn = useCallback((prev, columns) => {
    const filters = pruneFilters(prev.filters, columns)
    if (!prev.view) return { ...prev, columns, filters }
    return {
      ...prev,
      columns,
      filters,
      view: {
        ...prev.view,
        encodings: sanitizeEncodings(columns, prev.view.encodings, prev.view.type),
      },
    }
  }, [])

  const handleToggleHeader = useCallback(
    (hasHeaderRow) => {
      setConfig((prev) =>
        recolumn(
          { ...prev, data: { ...prev.data, hasHeaderRow } },
          buildColumns(prev.data.rows, hasHeaderRow, language)
        )
      )
    },
    [language, recolumn]
  )

  const handleChangeType = useCallback(
    (key, type) => {
      setConfig((prev) => {
        const columns = prev.columns.map((col) => (col.key === key ? { ...col, type } : col))
        return recolumn(prev, columns)
      })
    },
    [recolumn]
  )

  const handleReset = useCallback(() => {
    setConfig(createEmptyConfig())
    setTotalRows(0)
    setStepIndex(0)
  }, [])

  const goVisualize = useCallback(() => {
    setConfig((prev) => {
      if (prev.view) return prev
      const type = 'bar'
      return { ...prev, view: { type, encodings: defaultEncodings(prev.columns, type) } }
    })
    setStepIndex(2)
  }, [])

  const handleSetView = useCallback((nextView) => {
    setConfig((prev) => {
      const typeChanged = prev.view && prev.view.type !== nextView.type
      const encodings = typeChanged
        ? sanitizeEncodings(prev.columns, defaultEncodings(prev.columns, nextView.type), nextView.type)
        : nextView.encodings
      return { ...prev, view: { ...nextView, encodings } }
    })
  }, [])

  const handleSetFilters = useCallback((filters) => {
    setConfig((prev) => ({ ...prev, filters }))
  }, [])

  /** Fusion de blocs de haut niveau (meta, source, refine, annotations). */
  const handlePatchConfig = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  /** Reouverture d'un projet .json exporte a l'etape "Exporter". */
  const handleProjectLoaded = useCallback((loaded) => {
    setConfig(loaded)
    setTotalRows(loaded.data.rows.length)
    setStepIndex(loaded.view ? 2 : loaded.data.rows.length ? 1 : 0)
    if (sharedConfig) {
      setSharedConfig(null)
      setSearchParams({}, { replace: true })
    }
  }, [sharedConfig, setSearchParams])

  const stepStatus = useMemo(
    () =>
      STEPS.map((step, idx) => ({
        step,
        label: t.steps[step],
        active: idx === stepIndex,
        done: idx < stepIndex,
        reachable:
          idx === 0 ||
          (idx === 1 && hasData) ||
          (idx === 2 && hasData) ||
          (idx === 3 && hasView),
      })),
    [stepIndex, hasData, hasView, t]
  )

  return (
    <div className="studio">
      <div className="container studio__inner">
        <header className="studio__head">
          <h1 className="studio__title">{t.pageTitle}</h1>
          <p className="studio__intro">{t.pageIntro}</p>
        </header>

        <ol className="studio__steps" aria-label={t.pageTitle}>
          {stepStatus.map(({ step, label, active, done, reachable }, idx) => (
            <li
              key={step}
              className={
                'studio__step' +
                (active ? ' studio__step--active' : '') +
                (done ? ' studio__step--done' : '')
              }
            >
              <button
                type="button"
                className="studio__step-btn"
                disabled={!reachable}
                aria-current={active ? 'step' : undefined}
                onClick={() => reachable && setStepIndex(idx)}
              >
                <span className="studio__step-num">{idx + 1}</span>
                <span className="studio__step-label">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <section className="studio__panel">
          {currentStep === 'import' && (
            <ImportStep
              onParsed={handleParsed}
              onProjectLoaded={handleProjectLoaded}
              sharedColumnNames={sharedConfig?.columnsMeta?.map((c) => c.name) || null}
            />
          )}

          {currentStep === 'describe' && hasData && (
            <DescribeStep
              config={config}
              totalRows={totalRows}
              onToggleHeader={handleToggleHeader}
              onChangeType={handleChangeType}
              onBack={handleReset}
              onNext={goVisualize}
            />
          )}

          {currentStep === 'visualize' && hasData && (
            <VisualizeStep
              config={config}
              onSetView={handleSetView}
              onSetFilters={handleSetFilters}
              onPatchConfig={handlePatchConfig}
              onBack={() => setStepIndex(1)}
              onNext={() => setStepIndex(3)}
            />
          )}

          {currentStep === 'export' && hasView && (
            <ExportStep config={config} onBack={() => setStepIndex(2)} />
          )}
        </section>
      </div>
    </div>
  )
}
