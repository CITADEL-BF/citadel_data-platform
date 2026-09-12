/**
 * viewCatalog — catalogue des vues disponibles.
 *
 * Chaque vue declare les roles d'encodage dont elle a besoin. Le moteur de
 * compatibilite (compatibility.js) croise ces besoins avec les types de
 * colonnes detectes pour proposer / griser les vues.
 *
 * Perimetre actuel : barres et courbe. Nuage de points, histogramme, carte et
 * table viendront ensuite, sur le meme modele.
 */

export const VIEWS = {
  bar: {
    id: 'bar',
    label: { fr: 'Barres', en: 'Bars' },
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    zeroBaseline: true,
  },
  line: {
    id: 'line',
    label: { fr: 'Courbe', en: 'Line' },
    needs: { x: 'dimension', y: 'measure' },
    allowsSeries: true,
    prefersTemporalX: true,
    zeroBaseline: false,
  },
}

export const VIEW_LIST = Object.values(VIEWS)

export function getView(id) {
  return VIEWS[id] || null
}
