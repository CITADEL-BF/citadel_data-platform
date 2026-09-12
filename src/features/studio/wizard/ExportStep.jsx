/**
 * ExportStep — etape 4 : apercu final compose (titre + note + source + mention
 * dans l'image), apercu responsive, et telechargement / partage.
 *
 *   - PNG : rasterisation du canvas ECharts en haute resolution.
 *   - Projet .json : la config serialisable, pour re-ouvrir plus tard.
 *   - Lien de configuration : encode la mise en forme (pas les donnees) dans
 *     l'URL, a rejouer apres reimport du meme fichier.
 *
 * Aucun envoi reseau : tout est genere dans le navigateur.
 */

import { useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { buildEchartsOption } from '../engine/buildEchartsOption'
import { getView } from '../engine/viewCatalog'
import { useRegionBoundaries } from '../hooks/useRegionBoundaries'
import { serializeConfig } from '../state/chartConfig'
import { encodeShareUrl } from '../state/urlState'
import { useStudioText } from '../i18n'
import './ExportStep.css'

const SCALES = [1, 2, 3]
const PREVIEW_WIDTHS = { desktop: null, tablet: 480, mobile: 320 }

function slugify(text, fallback) {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return s || fallback
}

function triggerDownload(href, filename, revoke) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (revoke) URL.revokeObjectURL(href)
}

export default function ExportStep({ config, onBack }) {
  const { language } = useLanguage()
  const t = useStudioText()
  const chartRef = useRef(null)
  const [scale, setScale] = useState(2)
  const [done, setDone] = useState('')
  const [previewWidth, setPreviewWidth] = useState('desktop')
  const [shareUrl, setShareUrl] = useState('')

  const viewSpec = getView(config.view?.type) || {}
  const boundaries = useRegionBoundaries(viewSpec.isGeo)
  const mapNotReady = viewSpec.isGeo && boundaries.status !== 'ready'

  const { option } = useMemo(
    () =>
      buildEchartsOption({
        columns: config.columns,
        rows: config.data.rows,
        hasHeaderRow: config.data.hasHeaderRow,
        filters: config.filters,
        view: config.view?.type,
        encodings: config.view?.encodings,
        meta: config.meta,
        source: config.source,
        refine: config.refine,
        annotations: config.annotations,
        language,
        boundaries: boundaries.geojson,
      }),
    [config, language, boundaries.geojson]
  )

  const baseName = slugify(config.meta?.title, language === 'en' ? 'chart' : 'graphique')

  function downloadPng() {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return
    const url = inst.getDataURL({ type: 'png', pixelRatio: scale, backgroundColor: '#ffffff' })
    triggerDownload(url, `${baseName}.png`)
    setDone('png')
  }

  function downloadJson() {
    const blob = new Blob([serializeConfig(config)], { type: 'application/json' })
    triggerDownload(URL.createObjectURL(blob), `${baseName}.json`, true)
    setDone('json')
  }

  function copyShareLink() {
    const url = encodeShareUrl(config)
    setShareUrl(url)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => setDone('link'),
        () => setDone('')
      )
    }
  }

  return (
    <div className="export-step">
      <div className="export-step__toolbar">
        <div className="export-step__widths" role="group" aria-label={t.export.previewWidth}>
          {Object.keys(PREVIEW_WIDTHS).map((w) => (
            <button
              key={w}
              type="button"
              className={
                'export-step__width-btn' + (previewWidth === w ? ' export-step__width-btn--active' : '')
              }
              onClick={() => setPreviewWidth(w)}
            >
              {t.export.widths[w]}
            </button>
          ))}
        </div>
      </div>

      <div
        className="export-step__preview"
        style={{ maxWidth: PREVIEW_WIDTHS[previewWidth] || '100%' }}
      >
        {mapNotReady ? (
          <p className="export-step__map-status" role="status">
            {boundaries.status === 'error' ? t.visualize.mapError : t.visualize.mapLoading}
          </p>
        ) : (
          <ReactECharts
            key={previewWidth}
            ref={chartRef}
            option={option}
            notMerge
            style={{ height: 460, width: '100%', background: '#ffffff' }}
          />
        )}
      </div>

      <div className="export-step__bar">
        <label className="export-step__scale">
          {t.export.resolution}
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
            {SCALES.map((s) => (
              <option key={s} value={s}>{`×${s}`}</option>
            ))}
          </select>
        </label>

        <button type="button" className="btn-primary" onClick={downloadPng} disabled={mapNotReady}>
          {t.export.downloadPng}
        </button>
        <button type="button" className="btn-ghost" onClick={downloadJson}>
          {t.export.downloadJson}
        </button>
        <button type="button" className="btn-ghost" onClick={copyShareLink}>
          {t.export.copyLink}
        </button>
      </div>

      {done && (
        <p className="export-step__done" role="status">
          {done === 'png' ? t.export.donePng : done === 'json' ? t.export.doneJson : t.export.doneLink}
        </p>
      )}
      {shareUrl && (
        <div className="export-step__share">
          <input type="text" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
          <p className="export-step__share-hint">{t.export.shareHint}</p>
        </div>
      )}
      <p className="export-step__note">{t.export.note}</p>

      <div className="export-step__actions">
        <button type="button" className="btn-ghost" onClick={onBack}>
          {t.export.back}
        </button>
      </div>
    </div>
  )
}
