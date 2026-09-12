/**
 * viewCatalog — catalogue des vues disponibles.
 *
 * Chaque vue declare les roles d'encodage dont elle a besoin. Le moteur de
 * compatibilite (compatibility.js) croise ces besoins avec les types de
 * colonnes detectees pour proposer / griser les vues.
 *
 *   bar / line / area : X = dimension, Y = mesure agregee, serie optionnelle
 *                        (bar/area peuvent s'empiler quand une serie est choisie)
 *   scatter            : X = mesure, Y = mesure (points bruts), serie optionnelle
 *   histogram          : X = mesure (repartie en classes), Y = effectif
 *   pie                : X = dimension (parts), Y = mesure agregee
 *   pyramid            : X = dimension (ex. tranche d'age), serie = dimension
 *                         BINAIRE obligatoire (ex. sexe), Y = mesure agregee,
 *                         barres horizontales miroir
 *   map                : X = dimension (nom de region BF), Y = mesure agregee
 */

export const VIEWS = {
  bar: {
    id: 'bar',
    label: { fr: 'Barres', en: 'Bars' },
    icon: '📊',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    usesAggregation: true,
    supportsAnnotations: true,
    zeroBaseline: true,
  },
  line: {
    id: 'line',
    label: { fr: 'Courbe', en: 'Line' },
    icon: '📈',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    usesAggregation: true,
    supportsAnnotations: true,
    prefersTemporalX: true,
    zeroBaseline: false,
  },
  area: {
    id: 'area',
    label: { fr: 'Aires', en: 'Area' },
    icon: '🌊',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    usesAggregation: true,
    supportsAnnotations: true,
    prefersTemporalX: true,
    zeroBaseline: true,
  },
  scatter: {
    id: 'scatter',
    label: { fr: 'Nuage de points', en: 'Scatter' },
    icon: '⋯',
    needs: { x: 'measure', y: 'measure' },
    allowsSeries: true,
    usesAggregation: false,
    supportsAnnotations: true,
    zeroBaseline: false,
  },
  histogram: {
    id: 'histogram',
    label: { fr: 'Histogramme', en: 'Histogram' },
    icon: '▟',
    needs: { x: 'measure' },
    allowsSeries: false,
    usesAggregation: false,
    supportsAnnotations: true,
    zeroBaseline: true,
  },
  pie: {
    id: 'pie',
    label: { fr: 'Circulaire', en: 'Pie' },
    icon: '🥧',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: false,
    usesAggregation: true,
    supportsAnnotations: false,
    zeroBaseline: false,
  },
  pyramid: {
    id: 'pyramid',
    label: { fr: 'Pyramide des âges', en: 'Population pyramid' },
    icon: '🔺',
    needs: { x: 'dimension', y: 'measure', series: 'binary' },
    allowsSeries: true,
    requiresSeries: true,
    usesAggregation: true,
    supportsAnnotations: false,
    zeroBaseline: false,
  },
  map: {
    id: 'map',
    label: { fr: 'Carte (régions BF)', en: 'Map (BF regions)' },
    icon: '🗺️',
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: false,
    usesAggregation: true,
    supportsAnnotations: false,
    isGeo: true,
    zeroBaseline: false,
  },
  geoPoints: {
    id: 'geoPoints',
    label: { fr: 'Carte (points lat/lon)', en: 'Map (lat/lon points)' },
    icon: '📍',
    needs: { lat: 'geo-lat', lon: 'geo-lon' },
    allowsSeries: true,
    usesAggregation: false,
    supportsAnnotations: false,
    isGeo: true,
    isLatLon: true,
    zeroBaseline: false,
  },
}

export const VIEW_LIST = Object.values(VIEWS)

export function getView(id) {
  return VIEWS[id] || null
}
