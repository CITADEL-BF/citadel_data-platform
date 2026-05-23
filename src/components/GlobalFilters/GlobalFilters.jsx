import { useVisualisations } from '../../app/visualisations/VisualisationsContext'
import './GlobalFilters.css'

const regions = ['Toutes les Regions', 'Centre', 'Nord', 'Sahel', 'Est', 'Hauts-Bassins']
const periodes = ['Annuel', 'Mensuel', 'Derniers 12 Mois']
const organisations = ['Toutes les organisations', 'INSD', 'DGESS Sante', 'MENAPLN', 'SP CONASUR']

export default function GlobalFilters({ compact = false }) {
  const { globalFilters, setGlobalFilter } = useVisualisations()

  return (
    <section className={`global-filters${compact ? ' global-filters--compact' : ''}`} aria-label="Filtres globaux">
      <div className="global-filters__left">
        <label>
          <span>Region</span>
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
      <p className="global-filters__stamp">Derniere mise a jour: Aujourd&apos;hui, 08:42</p>
    </section>
  )
}
