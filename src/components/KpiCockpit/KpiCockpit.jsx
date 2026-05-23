import { useVisualisations } from '../../app/visualisations/VisualisationsContext'
import { DOMAIN_ICONS } from '../../app/visualisations/domainIcons'
import './KpiCockpit.css'

export default function KpiCockpit({ domaines, kpis }) {
  const { setActiveDomaine } = useVisualisations()

  return (
    <section className="kpi-cockpit" aria-label="Cockpit KPI domaines">
      {domaines.map((domaine) => (
        <button
          key={domaine.id}
          type="button"
          className={`kpi-cockpit__card${domaine.highlighted ? ' kpi-cockpit__card--highlighted' : ''}`}
          style={{ '--card-accent': domaine.accent, '--card-accent-soft': domaine.soft }}
          onClick={() => setActiveDomaine(domaine.id)}
        >
          <span className="kpi-cockpit__icon">{DOMAIN_ICONS[domaine.id]}</span>
          <span className="kpi-cockpit__label">{domaine.label}</span>
          <strong className="kpi-cockpit__value">{kpis[domaine.id]?.value || domaine.subtitle}</strong>
          <span className="kpi-cockpit__trend">{kpis[domaine.id]?.detail || domaine.trend}</span>
        </button>
      ))}
    </section>
  )
}
