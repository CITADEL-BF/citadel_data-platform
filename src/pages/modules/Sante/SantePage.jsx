import ModuleLayout from '../ModuleLayout'

export default function SantePage() {
  return (
    <ModuleLayout
      accentColor="#00695C"
      domaine="Santé"
      description="Données sur la couverture sanitaire, les infrastructures de santé et les indicateurs épidémiologiques au Burkina Faso. Sources : INSD, OMS, PNUD."
    >
      <div className="container">
        <div className="module-placeholder">
          <div className="module-placeholder__icon">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
            </svg>
          </div>
          <span className="module-placeholder__tag">En développement — S8</span>
          <h2 className="module-placeholder__title">Module Santé</h2>
          <p className="module-placeholder__desc">
            Les visualisations de ce module seront disponibles lors du sprint S8.
            Les données incluent&nbsp;: centres de santé par région, couverture vaccinale,
            indicateurs épidémiologiques et infrastructures sanitaires.
          </p>
        </div>
      </div>
    </ModuleLayout>
  )
}
