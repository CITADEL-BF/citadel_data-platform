/**
 * geoBoundaries — frontieres administratives du Burkina Faso (regions, ADM1)
 * pour la vue carte.
 *
 * Reutilise le GeoJSON deja produit pour le reste de la plateforme
 * (public/data/viz/geojson/bfa_regions_boundaries.geojson, 13 regions,
 * propriete `shapeName`) plutot que d'en embarquer une copie dans le bundle :
 * il n'est charge que si l'utilisateur choisit la vue carte, et mis en cache
 * en memoire pour le reste de la session.
 */

import * as echarts from 'echarts'

export const MAP_NAME = 'citadel-bfa-regions'
const BOUNDARIES_PATH = 'data/viz/geojson/bfa_regions_boundaries.geojson'

let pending = null

export function loadBfaRegions() {
  if (!pending) {
    const url = `${import.meta.env.BASE_URL}${BOUNDARIES_PATH}`
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((geojson) => {
        echarts.registerMap(MAP_NAME, geojson)
        return geojson
      })
      .catch((err) => {
        pending = null // permet un nouvel essai
        throw err
      })
  }
  return pending
}

export function regionNames(geojson) {
  return geojson.features.map((f) => f.properties.shapeName)
}

/** minuscule, sans accents, ponctuation reduite a un espace : tolere les variantes d'ecriture. */
export function normalizeRegionName(raw) {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Associe chaque valeur brute distincte a l'un des 13 noms de region reconnus.
 * @returns {{ matched: Map<string,string>, unmatched: string[] }}
 */
export function matchRegionNames(rawValues, geojson) {
  const names = regionNames(geojson)
  const byNorm = new Map(names.map((n) => [normalizeRegionName(n), n]))
  const matched = new Map()
  const unmatched = []
  for (const raw of rawValues) {
    const hit = byNorm.get(normalizeRegionName(raw))
    if (hit) matched.set(raw, hit)
    else unmatched.push(raw)
  }
  return { matched, unmatched }
}
