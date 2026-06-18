import { useMemo } from 'react'

function formatRelative(isoStr) {
  const target = new Date(isoStr)
  if (Number.isNaN(target.getTime())) return 'il y a quelques instants'

  const diffMs = target.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (abs < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
  if (abs < day) return rtf.format(Math.round(diffMs / hour), 'hour')
  if (abs < month) return rtf.format(Math.round(diffMs / day), 'day')
  if (abs < year) return rtf.format(Math.round(diffMs / month), 'month')
  return rtf.format(Math.round(diffMs / year), 'year')
}

function normalizeName(name) {
  const value = String(name || '').trim()
  if (!value) return 'Utilisateur'
  return value.toUpperCase()
}

function buildBaseSignupEvent(displayName, connectedAt) {
  return {
    id: 'signup-event',
    message: `${normalizeName(displayName)} s'est inscrit`,
    at: connectedAt || new Date().toISOString(),
  }
}

export default function ActiviteSection({ entries, connectedAt, displayName }) {
  const feed = useMemo(() => {
    const remote = Array.isArray(entries) ? entries : []
    const hasSignupEvent = remote.some((entry) => String(entry.type || '').toLowerCase() === 'inscription')
    const merged = hasSignupEvent ? remote : [buildBaseSignupEvent(displayName, connectedAt), ...remote]

    const deduped = []
    const seen = new Set()

    merged.forEach((item) => {
      const key = `${item.message || ''}-${item.at || ''}`
      if (seen.has(key)) return
      seen.add(key)
      deduped.push(item)
    })

    return deduped
  }, [entries, connectedAt, displayName])

  const sortedFeed = useMemo(
    () => [...feed].sort((a, b) => new Date(b.at) - new Date(a.at)),
    [feed]
  )

  return (
    <div className="settings-section">
      <div className="settings-activite-header">
        <div>
          <h3>Flux d’activité</h3>
          <p>Historique chronologique des activites importantes effectuees sur la plateforme.</p>
        </div>
        <span className="settings-activite-badge">{sortedFeed.length} événement{sortedFeed.length > 1 ? 's' : ''}</span>
      </div>

      <ol className="settings-activite-list" aria-label="Historique d’activité">
        {sortedFeed.map((entry, idx) => {
          return (
            <li key={entry.id || idx} className="settings-activite-item">
              <div className="settings-activite-item__body">
                <span className="settings-activite-item__label">
                  {entry.message
                    ? `${normalizeName(displayName)} ${entry.message}`
                    : `${normalizeName(displayName)} a effectué une action`}
                </span>
                {entry.detail && (
                  <span className="settings-activite-item__detail">{entry.detail}</span>
                )}
              </div>

              <time
                className="settings-activite-item__time"
                dateTime={entry.at}
                title={new Date(entry.at).toLocaleString('fr-FR')}
              >
                {formatRelative(entry.at)}
              </time>
            </li>
          )
        })}
      </ol>

      <p className="settings-activite-hint">
        La connexion au portail n’est pas affichée dans ce flux.
      </p>
    </div>
  )
}
