import { useMemo } from 'react'
import { useOrganizationsContent } from '../../../features/organizations/organizationsData'

function readSubscriptionSlugs() {
  try {
    const raw = localStorage.getItem('citadel_subscriptions')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function NotificationsSection() {
  const { content } = useOrganizationsContent()

  const notifications = useMemo(() => {
    const slugs = readSubscriptionSlugs()
    const orgs = Array.isArray(content?.organizations) ? content.organizations : []

    return slugs.map((slug) => {
      const org = orgs.find((item) => item.slug === slug)
      const label = org?.name || slug

      return {
        id: slug,
        title: `Vous etes abonne a la newsletter de ${label}`,
        detail: 'Vous recevrez les prochaines notifications liees a cet abonnement.',
      }
    })
  }, [content])

  return (
    <div className="settings-section">
      <div className="settings-activite-header">
        <div>
          <h3>Notifications abonnement</h3>
          <p>Notifications relatives a vos abonnements newsletters.</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="settings-activite-hint">
          Vous n'avez pas de notifications concernant vos abonnements. Pensez a vous abonner.
        </p>
      ) : (
        <ol className="settings-activite-list" aria-label="Notifications abonnement">
          {notifications.map((notification) => (
            <li key={notification.id} className="settings-activite-item">
              <div className="settings-activite-item__body">
                <span className="settings-activite-item__label">{notification.title}</span>
                <span className="settings-activite-item__detail">{notification.detail}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
