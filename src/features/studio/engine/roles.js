/**
 * roles — quel role d'encodage une colonne peut tenir selon son type detecte.
 *
 *   'dimension' : axe de regroupement (X, serie, filtre)   -> date, categorie, texte, booleen
 *   'measure'   : valeur numerique agregee (Y)             -> number, geo-lat, geo-lon
 *
 * Le geo nomme (region, commune...) reste une 'dimension' ordinaire tant que la
 * vue carte n'est pas branchee (etape ulterieure).
 */

export const MEASURE_TYPES = new Set(['number', 'geo-lat', 'geo-lon'])
export const DIMENSION_TYPES = new Set(['date', 'category', 'text', 'boolean'])

export function rolesForType(type) {
  const roles = []
  if (MEASURE_TYPES.has(type)) roles.push('measure')
  if (DIMENSION_TYPES.has(type)) roles.push('dimension')
  // un nombre peut aussi servir de dimension (ex. annee stockee en number)
  if (type === 'number') roles.push('dimension')
  return roles
}

export const measureColumns = (columns) =>
  columns.filter((c) => rolesForType(c.type).includes('measure'))

export const dimensionColumns = (columns) =>
  columns.filter((c) => rolesForType(c.type).includes('dimension'))

export const AGGREGATIONS = ['sum', 'mean', 'count', 'min', 'max']

export const AGG_LABELS = {
  fr: { sum: 'Somme', mean: 'Moyenne', count: 'Nombre', min: 'Minimum', max: 'Maximum' },
  en: { sum: 'Sum', mean: 'Mean', count: 'Count', min: 'Minimum', max: 'Maximum' },
}
