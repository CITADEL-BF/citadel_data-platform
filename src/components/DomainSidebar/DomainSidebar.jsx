import { useVisualisations } from '../../app/visualisations/VisualisationsContext'
import { DOMAIN_ICONS } from '../../app/visualisations/domainIcons'
import './DomainSidebar.css'

export default function DomainSidebar({ domaines, kpis }) {
  const { activeDomaine, setActiveDomaine } = useVisualisations()

  return (
    <aside className="domain-sidebar" aria-label="Navigation domaines visualisations">
      {domaines.map((domaine) => (
        <button
          key={domaine.id}
          type="button"
          className={`domain-sidebar__item${activeDomaine === domaine.id ? ' domain-sidebar__item--active' : ''}`}
          onClick={() => setActiveDomaine(domaine.id)}
        >
          <span className="domain-sidebar__label">
            <span className="domain-sidebar__icon" aria-hidden="true">{DOMAIN_ICONS[domaine.id]}</span>
            <span className="domain-sidebar__label-text">{domaine.label}</span>
          </span>
          <small>{kpis[domaine.id]?.value || domaine.subtitle}</small>
        </button>
      ))}
    </aside>
  )
}
