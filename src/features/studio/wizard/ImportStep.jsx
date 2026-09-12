/**
 * ImportStep — etape 1 : recuperer des donnees.
 * Trois entrees pour des donnees CSV : depot/selection de fichier, texte
 * colle, jeu d'exemple (parsing delegue a `parseCsv`, PapaParse en worker).
 * Une quatrieme entree distincte permet de rouvrir un projet .json deja
 * exporte a l'etape "Exporter" (config complete, aucune perte).
 */

import { useRef, useState } from 'react'
import { parseCsv } from '../engine/parseCsv'
import { deserializeConfig } from '../state/chartConfig'
import { SAMPLE_CSV, SAMPLE_FILE_NAME, SAMPLE_PYRAMID_CSV, SAMPLE_PYRAMID_FILE_NAME } from '../sampleData'
import { useStudioText } from '../i18n'
import './ImportStep.css'

export default function ImportStep({ onParsed, onProjectLoaded }) {
  const t = useStudioText()
  const fileInputRef = useRef(null)
  const projectInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pasteValue, setPasteValue] = useState('')

  async function ingest(input, fileName) {
    setBusy(true)
    setError('')
    try {
      const result = await parseCsv(input)
      if (!result.rows.length || result.rows.every((r) => r.every((c) => c === ''))) {
        setError(t.import.emptyError)
        return
      }
      onParsed({
        rows: result.rows,
        delimiter: result.delimiter,
        fileName: fileName || '',
        totalRows: result.totalRows,
      })
    } catch (err) {
      setError(t.import.errorPrefix + (err?.message || String(err)))
    } finally {
      setBusy(false)
    }
  }

  function handleFiles(fileList) {
    const file = fileList?.[0]
    if (!file) return
    ingest(file, file.name)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleProjectFile(fileList) {
    const file = fileList?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const text = await file.text()
      const config = deserializeConfig(text)
      onProjectLoaded(config)
    } catch (err) {
      setError(t.import.errorPrefix + (err?.message || String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="import-step">
      <div
        className={`import-step__drop${dragOver ? ' import-step__drop--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <svg className="import-step__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V4m0 0L7 9m5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p className="import-step__drop-title">{t.import.dropTitle}</p>
        <p className="import-step__drop-hint">{t.import.dropHint}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {t.import.browse}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="import-step__file-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="import-step__sample-links">
          <button
            type="button"
            className="import-step__sample-link"
            onClick={() => ingest(SAMPLE_CSV, SAMPLE_FILE_NAME)}
            disabled={busy}
          >
            {t.import.sampleButton}
          </button>
          <button
            type="button"
            className="import-step__sample-link"
            onClick={() => ingest(SAMPLE_PYRAMID_CSV, SAMPLE_PYRAMID_FILE_NAME)}
            disabled={busy}
          >
            {t.import.samplePyramidButton}
          </button>
        </div>
      </div>

      <details className="import-step__paste">
        <summary>{t.import.pasteLabel}</summary>
        <textarea
          className="import-step__textarea"
          rows={8}
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => ingest(pasteValue, '')}
          disabled={busy || pasteValue.trim() === ''}
        >
          {t.import.pasteButton}
        </button>
      </details>

      {busy && <p className="import-step__status" role="status">{t.import.parsing}</p>}
      {error && <p className="import-step__error" role="alert">{error}</p>}

      <div className="import-step__reopen">
        <button
          type="button"
          className="import-step__reopen-link"
          onClick={() => projectInputRef.current?.click()}
          disabled={busy}
        >
          {t.import.openProject}
        </button>
        <input
          ref={projectInputRef}
          type="file"
          accept=".json,application/json"
          className="import-step__file-input"
          onChange={(e) => handleProjectFile(e.target.files)}
        />
      </div>

      <p className="import-step__privacy">{t.import.privacyNote}</p>
    </div>
  )
}
