/**
 * urlState — encode/decode un lien de configuration (SANS les donnees).
 *
 * Ce que le lien transporte : titre/note/source/mention, reglages de
 * personnalisation, annotations, filtres et vue (type + encodage). Il ne
 * transporte jamais `data.rows` : les donnees ne sont pas conservees, un
 * lien ne peut donc que "rejouer" une mise en forme une fois le meme fichier
 * (memes colonnes, meme ordre) reimporte.
 *
 * Encodage : JSON -> UTF-8 -> base64 URL-safe (pas de dependance externe).
 */

import { CONFIG_VERSION } from './chartConfig'

const PARAM = 'c'

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Construit le fragment de config partageable (sans les donnees). */
export function buildShareableConfig(config) {
  return {
    version: CONFIG_VERSION,
    meta: config.meta,
    source: config.source,
    refine: config.refine,
    annotations: config.annotations,
    filters: config.filters,
    view: config.view,
    // repères humains pour aider a reimporter le bon fichier (pas utilise pour la reconstruction)
    columnsMeta: config.columns.map((c) => ({ name: c.name, type: c.type })),
    dataMeta: { hasHeaderRow: config.data.hasHeaderRow, fileName: config.data.fileName },
  }
}

export function encodeShareUrl(config) {
  const json = JSON.stringify(buildShareableConfig(config))
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set(PARAM, toBase64Url(json))
  return url.toString()
}

/** Lit un `c=...` present dans l'URL courante ; renvoie null si absent/invalide. */
export function readShareParam(searchParams) {
  const raw = searchParams.get(PARAM)
  if (!raw) return null
  try {
    const json = fromBase64Url(raw)
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CONFIG_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** Reapplique un fragment partage sur une config fraichement importee (memes colonnes/ordre attendus). */
export function applySharedConfig(freshConfig, shared) {
  if (!shared) return freshConfig
  return {
    ...freshConfig,
    meta: { ...freshConfig.meta, ...(shared.meta || {}) },
    source: { ...freshConfig.source, ...(shared.source || {}) },
    refine: { ...freshConfig.refine, ...(shared.refine || {}) },
    annotations: shared.annotations || [],
    filters: shared.filters || [],
    view: shared.view || null,
  }
}
