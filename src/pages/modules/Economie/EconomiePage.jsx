import ModuleLayout from '../ModuleLayout'

export default function EconomiePage() {
  return (
    <ModuleLayout
      accentColor="#A16D00"
      domaine="Économie & Emploi"
      description="Données sur les prix alimentaires, l'emploi, le chômage, les entreprises et les activités économiques au Burkina Faso. Sources : INSD, FAO, Banque mondiale, AFRISTAT."
    >
      <div className="container">
        <div className="module-placeholder">
          <div className="module-placeholder__icon">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          </div>
          <span className="module-placeholder__tag">En développement — S8</span>
          <h2 className="module-placeholder__title">Module Économie & Emploi</h2>
          <p className="module-placeholder__desc">
            Les visualisations de ce module seront disponibles lors du sprint S8.
            Les données incluent&nbsp;: prix alimentaires mensuels depuis 1992, emploi/chômage
            par milieu, activités économiques locales et PME.
          </p>
        </div>
      </div>
    </ModuleLayout>
  )
}
