/**
 * detectTypes — heuristiques de detection du type d'une colonne.
 *
 * Types possibles :
 *   'number'   valeurs numeriques (entiers ou decimaux, separateurs FR toleres)
 *   'date'     dates ou annees reconnues
 *   'boolean'  exactement deux valeurs booleennes (oui/non, true/false, 0/1...)
 *   'geo-lat'  latitude (deduit surtout du nom de colonne)
 *   'geo-lon'  longitude
 *   'category' faible cardinalite -> dimension de regroupement
 *   'text'     texte libre
 *
 * Chaque detection renvoie aussi les valeurs "fautives" (non conformes au type
 * majoritaire) pour alimenter le panneau de problemes de l'etape "Verifier".
 */

const SAMPLE_SIZE = 300
const CONFORM_THRESHOLD = 0.9

const BOOLEAN_TRUE = new Set(['true', 'vrai', 'oui', 'yes', '1', 'y', 'o'])
const BOOLEAN_FALSE = new Set(['false', 'faux', 'non', 'no', '0', 'n'])

const LAT_NAME = /^(lat|latitude|lat_dd|y)$/i
const LON_NAME = /^(lon|lng|long|longitude|lon_dd|x)$/i
const YEAR_NAME = /(^|[_\s-])(annee|année|year|exercice|millesime|millésime)([_\s-]|$)/i
const GEO_NAME = /(pays|region|région|province|commune|departement|département|district|ville|localite|localité|zone|secteur|arrondissement)/i

const DATE_PATTERNS = [
  /^\d{4}$/,                                   // 2023
  /^\d{4}-\d{2}$/,                             // 2023-04
  /^\d{4}-\d{2}-\d{2}([ T].*)?$/,             // 2023-04-01 / ISO datetime
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,                // 01/04/2023
  /^\d{1,2}-\d{1,2}-\d{4}$/,                  // 01-04-2023
  /^\d{1,2}\/\d{4}$/,                         // 04/2023
]

function normalizeNumber(raw) {
  // Retire espaces (y compris fines/insecables) utilises comme separateurs de
  // milliers, puis convertit une virgule decimale isolee en point.
  let s = raw.replace(/[\s  ]/g, '').replace(/[%€$]/g, '')
  if (/,\d+$/.test(s) && !s.includes('.')) s = s.replace(',', '.')
  else s = s.replace(/,/g, '')
  return s
}

function isNumeric(raw) {
  const s = normalizeNumber(raw)
  if (s === '' || s === '-' || s === '.') return false
  return !Number.isNaN(Number(s))
}

function isDate(raw) {
  const s = raw.trim()
  if (DATE_PATTERNS.some((re) => re.test(s))) {
    if (/^\d{4}$/.test(s)) {
      const y = Number(s)
      return y >= 1900 && y <= 2100
    }
    return true
  }
  return false
}

function sampleNonEmpty(values) {
  const out = []
  for (const v of values) {
    const t = (v ?? '').trim()
    if (t !== '') out.push(t)
    if (out.length >= SAMPLE_SIZE) break
  }
  return out
}

/**
 * @param {{ name: string, values: string[] }} column
 * @returns {{ type: string, confidence: number, distinct: number,
 *             nonConforming: { count: number, examples: string[] } }}
 */
export function detectColumnType({ name, values }) {
  const sample = sampleNonEmpty(values)
  const distinct = new Set(sample).size
  const empty = { count: 0, examples: [] }

  if (sample.length === 0) {
    return { type: 'text', confidence: 0, distinct: 0, nonConforming: empty }
  }

  // 1. Indices forts par nom de colonne
  if (LAT_NAME.test(name) && sample.every(isNumeric)) {
    return { type: 'geo-lat', confidence: 1, distinct, nonConforming: empty }
  }
  if (LON_NAME.test(name) && sample.every(isNumeric)) {
    return { type: 'geo-lon', confidence: 1, distinct, nonConforming: empty }
  }

  // 2. Booleen : deux valeurs, toutes booleennes
  const lowered = sample.map((v) => v.toLowerCase())
  if (
    distinct <= 2 &&
    lowered.every((v) => BOOLEAN_TRUE.has(v) || BOOLEAN_FALSE.has(v)) &&
    !lowered.every((v) => v === '0' || v === '1') // "0/1" pur -> plutot number
  ) {
    return { type: 'boolean', confidence: 0.95, distinct, nonConforming: empty }
  }

  // 3. Date (le nom "annee" renforce, mais on teste toujours les valeurs)
  const dateHits = sample.filter(isDate).length
  const dateRatio = dateHits / sample.length
  if (dateRatio >= CONFORM_THRESHOLD || (YEAR_NAME.test(name) && dateRatio >= 0.6)) {
    return {
      type: 'date',
      confidence: dateRatio,
      distinct,
      nonConforming: collectNonConforming(sample, isDate),
    }
  }

  // 4. Nombre
  const numHits = sample.filter(isNumeric).length
  const numRatio = numHits / sample.length
  if (numRatio >= CONFORM_THRESHOLD) {
    return {
      type: 'number',
      confidence: numRatio,
      distinct,
      nonConforming: collectNonConforming(sample, isNumeric),
    }
  }

  // 5. Categorie vs texte libre
  const ratio = distinct / sample.length
  const looksCategorical = distinct <= 50 && (ratio <= 0.5 || GEO_NAME.test(name))
  return {
    type: looksCategorical ? 'category' : 'text',
    confidence: looksCategorical ? 1 - ratio : ratio,
    distinct,
    nonConforming: empty,
  }
}

function collectNonConforming(sample, predicate) {
  const bad = []
  for (const v of sample) {
    if (!predicate(v)) {
      if (bad.length < 5 && !bad.includes(v)) bad.push(v)
    }
  }
  const count = sample.filter((v) => !predicate(v)).length
  return { count, examples: bad }
}

/** Un type est-il exploitable comme axe geographique nomme (region, commune...) ? */
export function isGeoNameCandidate(name) {
  return GEO_NAME.test(name)
}

export const TYPE_LABELS = {
  fr: {
    number: 'Nombre',
    date: 'Date',
    boolean: 'Booléen',
    'geo-lat': 'Latitude',
    'geo-lon': 'Longitude',
    category: 'Catégorie',
    text: 'Texte',
  },
  en: {
    number: 'Number',
    date: 'Date',
    boolean: 'Boolean',
    'geo-lat': 'Latitude',
    'geo-lon': 'Longitude',
    category: 'Category',
    text: 'Text',
  },
}

export const SELECTABLE_TYPES = ['number', 'date', 'boolean', 'geo-lat', 'geo-lon', 'category', 'text']
