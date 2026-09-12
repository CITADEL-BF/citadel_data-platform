/**
 * RefinePanel — personnalisation du graphe : titre, note, source, mention,
 * format des nombres, palette, legende, et lignes de reference (annotations).
 *
 * Replie par defaut pour ne pas alourdir l'etape Visualiser.
 */

import { useLanguage } from '../../../contexts/LanguageContext'
import { coerceNumber } from '../engine/detectTypes'
import { useStudioText } from '../i18n'
import './RefinePanel.css'

const PALETTES = ['default', 'vives', 'sobre']
const DECIMALS = ['auto', '0', '1', '2', '3']

export default function RefinePanel({ meta, source, refine, annotations, hasSeries, viewSpec, onChange }) {
  const { language } = useLanguage()
  const t = useStudioText()
  const r = t.refine
  const isPie = viewSpec?.id === 'pie'
  const showAnnotations = viewSpec?.supportsAnnotations !== false

  const setMeta = (patch) => onChange({ meta: { ...meta, ...patch } })
  const setSource = (patch) => onChange({ source: { ...source, ...patch } })
  const setRefine = (patch) => onChange({ refine: { ...refine, ...patch } })

  function addAnnotation() {
    onChange({
      annotations: [...annotations, { id: `a${Date.now()}`, value: null, label: '' }],
    })
  }
  function updateAnnotation(id, patch) {
    onChange({ annotations: annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
  }
  function removeAnnotation(id) {
    onChange({ annotations: annotations.filter((a) => a.id !== id) })
  }

  return (
    <details className="refine-panel">
      <summary>{r.title}</summary>

      <div className="refine-panel__grid">
        <label className="refine-panel__field refine-panel__field--wide">
          <span>{r.chartTitle}</span>
          <input value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} />
        </label>
        <label className="refine-panel__field refine-panel__field--wide">
          <span>{r.note}</span>
          <input value={meta.note} onChange={(e) => setMeta({ note: e.target.value })} />
        </label>
        <label className="refine-panel__field">
          <span>{r.sourceName}</span>
          <input value={source.name} onChange={(e) => setSource({ name: e.target.value })} />
        </label>
        <label className="refine-panel__field">
          <span>{r.sourceUrl}</span>
          <input
            type="url"
            value={source.url}
            placeholder="https://"
            onChange={(e) => setSource({ url: e.target.value })}
          />
        </label>
        <label className="refine-panel__field refine-panel__field--wide">
          <span>{r.byline}</span>
          <input
            value={meta.byline}
            placeholder={language === 'en' ? 'Made with data.citadel.bf' : 'Créé avec data.citadel.bf'}
            onChange={(e) => setMeta({ byline: e.target.value })}
          />
        </label>

        <label className="refine-panel__field">
          <span>{r.decimals}</span>
          <select
            value={refine.decimals == null ? 'auto' : String(refine.decimals)}
            onChange={(e) =>
              setRefine({ decimals: e.target.value === 'auto' ? null : Number(e.target.value) })
            }
          >
            {DECIMALS.map((d) => (
              <option key={d} value={d}>{d === 'auto' ? r.auto : d}</option>
            ))}
          </select>
        </label>
        <label className="refine-panel__field">
          <span>{r.palette}</span>
          <select value={refine.palette} onChange={(e) => setRefine({ palette: e.target.value })}>
            {PALETTES.map((p) => (
              <option key={p} value={p}>{r.palettes[p]}</option>
            ))}
          </select>
        </label>
        <label className="refine-panel__check">
          <input
            type="checkbox"
            checked={refine.thousands !== false}
            onChange={(e) => setRefine({ thousands: e.target.checked })}
          />
          {r.thousands}
        </label>
        {hasSeries && (
          <label className="refine-panel__check">
            <input
              type="checkbox"
              checked={refine.legend !== false}
              onChange={(e) => setRefine({ legend: e.target.checked })}
            />
            {r.legend}
          </label>
        )}
        {isPie && (
          <label className="refine-panel__check">
            <input
              type="checkbox"
              checked={refine.donut === true}
              onChange={(e) => setRefine({ donut: e.target.checked })}
            />
            {r.donut}
          </label>
        )}
      </div>

      {showAnnotations && (
        <div className="refine-panel__annotations">
          <div className="refine-panel__annotations-head">
            <span>{r.annotations}</span>
            <button type="button" onClick={addAnnotation}>{r.addAnnotation}</button>
          </div>
          {annotations.length === 0 && <p className="refine-panel__hint">{r.annotationsHint}</p>}
          {annotations.map((a) => (
            <div key={a.id} className="refine-panel__annotation">
              <label>
                {r.atValue}
                <input
                  type="number"
                  value={a.value ?? ''}
                  onChange={(e) =>
                    updateAnnotation(a.id, { value: e.target.value === '' ? null : coerceNumber(e.target.value) })
                  }
                />
              </label>
              <label className="refine-panel__annotation-label">
                {r.annotationLabel}
                <input
                  value={a.label}
                  onChange={(e) => updateAnnotation(a.id, { label: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="refine-panel__annotation-remove"
                onClick={() => removeAnnotation(a.id)}
                aria-label={r.remove}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </details>
  )
}
