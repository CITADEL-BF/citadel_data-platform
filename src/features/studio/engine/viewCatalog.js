/**
 * viewCatalog — catalogue des vues disponibles.
 *
 * Chaque vue declare les roles d'encodage dont elle a besoin. Le moteur de
 * compatibilite (compatibility.js) croise ces besoins avec les types de
 * colonnes detectes pour proposer / griser les vues.
 *
 *   bar / line  : X = dimension, Y = mesure agregee, serie optionnelle
 *   scatter     : X = mesure, Y = mesure (points bruts), serie optionnelle
 *   histogram   : X = mesure (repartie en classes), Y = effectif
 *
 * Carte et table viendront ensuite, sur le meme modele.
 */

export const VIEWS = {
  bar: {
    id: 'bar',
    label: { fr: 'Barres', en: 'Bars' },
    icon: '📊',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    usesAggregation: true,
    zeroBaseline: true,
  },
  line: {
    id: 'line',
    label: { fr: 'Courbe', en: 'Line' },
    icon: '📈',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    usesAggregation: true,
    prefersTemporalX: true,
    zeroBaseline: false,
  },
  scatter: {
    id: 'scatter',
    label: { fr: 'Nuage de points', en: 'Scatter' },
    icon: '⋯',
    needs: { x: 'measure', y: 'measure' },
    allowsSeries: true,
    usesAggregation: false,
    zeroBaseline: false,
  },
  histogram: {
    id: 'histogram',
    label: { fr: 'Histogramme', en: 'Histogram' },
    icon: '▟',
    needs: { x: 'measure' },
    allowsSeries: false,
    usesAggregation: false,
    zeroBaseline: true,
  },
  map: {
    id: 'map',
    label: { fr: 'Carte (régions BF)', en: 'Map (BF regions)' },
    icon: '🗺️',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: false,
    usesAggregation: true,
    isGeo: true,
    zeroBaseline: false,
  },
}

export const VIEW_LIST = Object.values(VIEWS)

export function getView(id) {
  return VIEWS[id] || null
}
