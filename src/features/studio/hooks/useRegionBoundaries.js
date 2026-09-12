import { useEffect, useState } from 'react'
import { loadBfaRegions } from '../engine/geoBoundaries'

/**
 * Charge (et met en cache) les frontieres regionales BFA quand `enabled` est
 * vrai. `status` vaut 'idle' | 'loading' | 'ready' | 'error'.
 */
export function useRegionBoundaries(enabled) {
  const [state, setState] = useState({ status: 'idle', geojson: null, error: null })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    setState((s) => (s.status === 'ready' ? s : { status: 'loading', geojson: null, error: null }))

    loadBfaRegions()
      .then((geojson) => {
        if (!cancelled) setState({ status: 'ready', geojson, error: null })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', geojson: null, error: err?.message || String(err) })
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}
