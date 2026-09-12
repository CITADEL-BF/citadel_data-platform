/**
 * chartConfig — objet d'etat serialisable d'un graphe.
 *
 * REGLE D'ARCHITECTURE : tout l'etat d'un graphe (donnees, colonnes, vue,
 * filtres, annotations, mise en page) tient dans CET objet, serialisable en
 * JSON. Aujourd'hui il vit en memoire ; demain il pourra devenir une ligne
 * `charts.config jsonb` dans Supabase sans toucher au moteur de rendu.
 *
 * Ne rien mettre ici qui ne soit pas JSON-serialisable (pas de File, pas de
 * fonction, pas de Map/Set).
 */

import { detectColumnType } from '../engine/detectTypes'

export const CONFIG_VERSION = 1

export function createEmptyConfig() {
  return {
    version: CONFIG_VERSION,
    meta: { title: '', note: '', byline: '' },
    source: { name: '', url: '' },
    data: {
      mode: 'inline',       // 'inline' | 'storage-ref' (Phase 2)
      fileName: '',
      delimiter: ',',
      hasHeaderRow: true,
      rows: [],             // matrice de chaines, en-tete incluse si presente
    },
    columns: [],            // [{ key, name, type, detectedType, role, format }]
    view: null,             // defini a l'etape "Visualiser"
    filters: [],
    annotations: [],        // [{ id, value, label }] -> lignes de reference
    refine: {
      decimals: null,       // null = auto
      thousands: true,      // separateur de milliers
      legend: true,         // legende (vues avec serie)
      palette: 'default',   // 'default' | 'vives' | 'sobre'
    },
    layout: {},
  }
}

function columnValues(rows, index, hasHeaderRow) {
  const body = hasHeaderRow ? rows.slice(1) : rows
  return body.map((row) => row[index] ?? '')
}

function defaultHeaderName(index, language = 'fr') {
  return language === 'en' ? `Column ${index + 1}` : `Colonne ${index + 1}`
}

/**
 * Construit la liste de colonnes (nom + type detecte) a partir de la matrice
 * brute et de la bascule "1re ligne = en-tetes".
 */
export function buildColumns(rows, hasHeaderRow, language = 'fr') {
  if (!rows.length) return []
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const headerRow = hasHeaderRow ? rows[0] : null

  return Array.from({ length: width }, (_, index) => {
    const rawName = headerRow?.[index]?.trim()
    const name = rawName || defaultHeaderName(index, language)
    const values = columnValues(rows, index, hasHeaderRow)
    const detection = detectColumnType({ name, values })
    return {
      key: `c${index}`,
      index,
      name,
      type: detection.type,
      detectedType: detection.type,
      confidence: detection.confidence,
      distinct: detection.distinct,
      nonConforming: detection.nonConforming,
      role: null,
      format: null,
    }
  })
}

/** Re-detecte tous les types (apres bascule de la ligne d'en-tete). */
export function redetectColumns(config, language = 'fr') {
  return buildColumns(config.data.rows, config.data.hasHeaderRow, language)
}

/** Serialisation vers un fichier projet .json (Phase 1 : persistance locale). */
export function serializeConfig(config) {
  return JSON.stringify(config, null, 2)
}

export function deserializeConfig(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json
  if (!parsed || typeof parsed !== 'object') throw new Error('Fichier projet invalide.')
  if (parsed.version !== CONFIG_VERSION) {
    // Pas de migration pour l'instant : on refuse plutot que de charger un
    // format incompatible en silence.
    throw new Error(`Version de projet non prise en charge (${parsed.version}).`)
  }
  const base = createEmptyConfig()
  return {
    ...base,
    ...parsed,
    meta: { ...base.meta, ...(parsed.meta || {}) },
    source: { ...base.source, ...(parsed.source || {}) },
    refine: { ...base.refine, ...(parsed.refine || {}) },
    data: { ...base.data, ...(parsed.data || {}) },
  }
}
