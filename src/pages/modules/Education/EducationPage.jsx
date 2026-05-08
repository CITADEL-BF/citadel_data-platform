import ModuleLayout from '../ModuleLayout'

export default function EducationPage() {
  return (
    <ModuleLayout
      accentColor="#1565C0"
      domaine="Éducation"
      description="Données sur la scolarisation, les résultats scolaires, les écoles ouvertes/fermées et l'accès au numérique au Burkina Faso. Sources : MENAPLN, AFRISTAT, INSD."
    >
      <div className="container">
        <div className="module-placeholder">
          <div className="module-placeholder__icon">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>
          <span className="module-placeholder__tag">En développement — S7</span>
          <h2 className="module-placeholder__title">Module Éducation</h2>
          <p className="module-placeholder__desc">
            Les visualisations de ce module seront disponibles lors du sprint S7.
            Les données incluent&nbsp;: indicateurs scolaires nationaux, écoles par région,
            résultats CEP/BEPC/BAC et accès au numérique.
          </p>
        </div>
      </div>
    </ModuleLayout>
  )
}
