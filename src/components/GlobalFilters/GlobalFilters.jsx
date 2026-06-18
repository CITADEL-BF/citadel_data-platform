import { useMemo } from 'react'
import { useVisualisations } from '../../app/visualisations/VisualisationsContext'
import { getAllOrganizations, useOrganizationsContent } from '../../features/organizations/organizationsData'
import './GlobalFilters.css'

const regions = ['Toutes les Regions', 'Centre', 'Nord', 'Sahel', 'Est', 'Hauts-Bassins']
const periodes = ['Annuel', 'Mensuel', 'Derniers 12 Mois']

export default function GlobalFilters({ compact = false }) {
  const { globalFilters, setGlobalFilter } = useVisualisations()
  const { content } = useOrganizationsContent()

  const organisations = useMemo(() => {
    const all = getAllOrganizations(content)
    const labels = all.map((item) => item.shortName || item.name).filter(Boolean)
    const uniqueLabels = Array.from(new Set(labels))
    const base = ['Toutes les organisations', ...uniqueLabels]

    if (!base.includes(globalFilters.organisation)) {
      return [...base, globalFilters.organisation]
    }

    return base
  }, [content, globalFilters.organisation])

  return (
    <section className={`global-filters${compact ? ' global-filters--compact' : ''}`} aria-label="Filtres globaux">
      <div className="global-filters__left">
        <label>
          <span>Région</span>
          <select value={globalFilters.region} onChange={(e) => setGlobalFilter('region', e.target.value)}>
            {regions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Periode</span>
          <select value={globalFilters.periode} onChange={(e) => setGlobalFilter('periode', e.target.value)}>
            {periodes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {!compact && (
          <label>
            <span>Organisation</span>
            <select value={globalFilters.organisation} onChange={(e) => setGlobalFilter('organisation', e.target.value)}>
              {organisations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="global-filters__stamp">Dernière mise à jour: Aujourd&apos;hui, 08:42</p>
    </section>
  )
}
