import { useEffect, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { TRANSLATIONS } from './translations'
import './MapSection.css'

const REGIONS_FALLBACK = [
  { nom: 'Région Centre', datasets: 640, code: 'centre', observations_valides: 640, indicateurs_distincts: 12, couverture_fichiers: 18, score_mixte: 89, indice: 89 },
  { nom: 'Sahel',         datasets: 215, code: 'sahel', observations_valides: 215, indicateurs_distincts: 10, couverture_fichiers: 17, score_mixte: 74, indice: 74 },
  { nom: 'Hauts-Bassins', datasets: 310, code: 'hauts-bassins', observations_valides: 310, indicateurs_distincts: 11, couverture_fichiers: 17, score_mixte: 79, indice: 79 },
  { nom: 'Est',           datasets: 178, code: 'est', observations_valides: 178, indicateurs_distincts: 9, couverture_fichiers: 16, score_mixte: 67, indice: 67 },
  { nom: 'Nord',          datasets: 193, code: 'nord', observations_valides: 193, indicateurs_distincts: 9, couverture_fichiers: 16, score_mixte: 69, indice: 69 },
]

const REGION_COLORS = {
  centre: '#e53935',
  'hauts-bassins': '#fb8c00',
  nord: '#1e88e5',
  est: '#8e24aa',
  sahel: '#00897b',
  'centre-nord': '#7cb342',
  'centre-est': '#f4511e',
  'centre-ouest': '#3949ab',
  cascades: '#6d4c41',
  boucle: '#546e7a',
  plateau: '#00acc1',
  'centre-sud': '#c0ca33',
  'sud-ouest': '#d81b60',
}

const VIEWBOX_WIDTH = 880
const VIEWBOX_HEIGHT = 640

const REGION_CODE_FROM_NAME = {
  centre: 'centre',
  est: 'est',
  nord: 'nord',
  sahel: 'sahel',
  cascades: 'cascades',
  'centre-est': 'centre-est',
  'centre-nord': 'centre-nord',
  'centre-ouest': 'centre-ouest',
  'centre-sud': 'centre-sud',
  'hauts-bassins': 'hauts-bassins',
  'plateau-central': 'plateau',
  'sud-ouest': 'sud-ouest',
  'boucle-du-mouhoun': 'boucle',
}

const normalizeName = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const getRings = (geometry) => {
  if (!geometry?.coordinates) return []
  if (geometry.type === 'Polygon') return geometry.coordinates
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((polygon) => polygon)
  }
  return []
}

const getBoundsFromFeatures = (features) => {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((feature) => {
    getRings(feature.geometry).forEach((ring) => {
      ring.forEach(([lon, lat]) => {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      })
    })
  })

  return { minLon, maxLon, minLat, maxLat }
}

const projectPoint = (lon, lat, bounds) => {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * VIEWBOX_WIDTH
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * VIEWBOX_HEIGHT
  return [x, y]
}

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const buildPathD = (feature, bounds) => {
  const rings = getRings(feature.geometry)
  if (!rings.length) return ''

  return rings
    .map((ring) => {
      if (!ring.length) return ''
      const [firstLon, firstLat] = ring[0]
      const [firstX, firstY] = projectPoint(firstLon, firstLat, bounds)
      const lines = ring
        .slice(1)
        .map(([lon, lat]) => {
          const [x, y] = projectPoint(lon, lat, bounds)
          return `L ${x.toFixed(2)} ${y.toFixed(2)}`
        })
        .join(' ')

      return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${lines} Z`
    })
    .join(' ')
}

export default function MapSection() {
  const { language } = useLanguage()
  const t = TRANSLATIONS[language].map
  
  const [regions, setRegions] = useState(REGIONS_FALLBACK)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [mapFeatures, setMapFeatures] = useState([])

  useEffect(() => {
    fetch(withBase('data/home/regions.json'))
      .then((r) => r.json())
      .then((d) => { if (d.regions?.length) setRegions(d.regions) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(withBase('data/viz/geojson/bfa_regions_boundaries.geojson'))
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.features)) return
        setMapFeatures(d.features)
      })
      .catch(() => {
        setMapFeatures([])
      })
  }, [])

  const maxDatasets = Math.max(...regions.map((r) => r.observations_valides || r.datasets || 0), 1)
  const hasPctIndex = regions.some((r) => typeof r.indice === 'number')

  const displayedRegions =
    selectedRegion === 'all'
      ? [...regions].sort((a, b) => (b.score_mixte || 0) - (a.score_mixte || 0))
      : regions.filter((r) => r.code === selectedRegion)

  const getRegionColor = (code) => REGION_COLORS[code] || 'var(--color-primary)'
  const mapBounds = mapFeatures.length ? getBoundsFromFeatures(mapFeatures) : null

  const formatMeta = (region) => {
    const obs = region.observations_valides ?? region.datasets ?? 0
    const ind = region.indicateurs_distincts ?? 0
    const cov = region.couverture_fichiers ?? 0
    const locale = language === 'fr' ? 'fr-FR' : 'en-US'
    return `${obs.toLocaleString(locale)} ${t.observations} · ${ind.toLocaleString(locale)} ${t.indicators} · ${cov.toLocaleString(locale)} ${t.files}`
  }

  return (
    <section className="map-section" aria-label={t.ariaLabel}>
      <div className="map-section__inner">
        {/* Carte */}
        <div className="map-section__map-col">
          <div className="map-section__map" aria-label={t.mapAriaLabel}>
            {/* Sélecteur de région */}
            <div className="map-section__selector">
              <label htmlFor="region-select" className="label-sm map-section__selector-label">
                {t.selectorLabel}
              </label>
              <select
                id="region-select"
                className="map-section__select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">{t.allRegions}</option>
                {regions.map((r) => (
                  <option key={r.code} value={r.code}>{r.nom}</option>
                ))}
              </select>
            </div>

            <div className="map-section__map-bg" aria-hidden="true">
              <div className="map-section__map-overlay">
                {mapFeatures.length && mapBounds ? (
                  <svg
                    className="map-section__svg"
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    role="img"
                    aria-label={t.svgAriaLabel}
                  >
                    {mapFeatures.map((feature, idx) => {
                      const key = feature.properties?.shapeID || `${feature.properties?.shapeName || 'region'}-${idx}`
                      const shapeName = normalizeName(feature.properties?.shapeName)
                      const code = REGION_CODE_FROM_NAME[shapeName]
                      const color = getRegionColor(code)
                      const d = buildPathD(feature, mapBounds)
                      if (!d) return null

                      const isSelected = selectedRegion === 'all' || code === selectedRegion
                      return (
                        <path
                          key={key}
                          d={d}
                          className="map-section__region-shape"
                          style={{ '--region-color': color, opacity: isSelected ? 0.92 : 0.35 }}
                        >
                          <title>{feature.properties?.shapeName || t.regionDefaultLabel}</title>
                        </path>
                      )
                    })}
                  </svg>
                ) : null}
              </div>
            </div>

            {/* Contrôles zoom 
            <div className="map-section__zoom" aria-label="Contrôles de zoom de la carte">
              <button className="map-section__zoom-btn" aria-label="Zoomer">+</button>
              <button className="map-section__zoom-btn" aria-label="Dézoomer">−</button>
            </div> */}
          </div>
        </div>

        {/* Panneau de données */}
        <div className="map-section__data-col">
          <h2 className="map-section__data-title headline-md">{t.dataTitle}</h2>
          <p className="map-section__data-subtitle">
            {t.dataSubtitle}
          </p>

          <div className="map-section__regions">
            {displayedRegions.map((r) => {
              const obs = r.observations_valides ?? r.datasets ?? 0
              const pct = hasPctIndex ? r.indice : Math.round((obs / maxDatasets) * 100)
              const locale = language === 'fr' ? 'fr-FR' : 'en-US'
              return (
                <div key={r.code} className="map-region">
                  <div className="map-region__header">
                    <span className="map-region__name label-sm">
                      <span className="map-region__swatch" style={{ '--region-color': getRegionColor(r.code) }} aria-hidden="true" />
                      {r.nom.toUpperCase()}
                    </span>
                    <span className="map-region__count">
                      <strong>{(r.score_mixte ?? pct).toLocaleString(locale)}</strong> {t.score}
                    </span>
                  </div>
                  <div className="map-region__bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.nom} ${t.score} ${pct} / 100`}>
                    <div className="map-region__bar-fill" style={{ width: `${pct}%`, '--region-color': getRegionColor(r.code) }} />
                  </div>
                  <p className="map-region__meta">{formatMeta(r)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
