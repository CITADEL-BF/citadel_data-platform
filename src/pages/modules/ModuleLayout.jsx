import { NavLink } from 'react-router-dom'
import './ModuleLayout.css'

const MODULES = [
  { to: '/modules/securite',   label: 'Sécurité',        color: '#AF0012' },
  { to: '/modules/population', label: 'Population & PDI', color: '#0d631b' },
  { to: '/modules/education',  label: 'Éducation',        color: '#1565C0' },
  { to: '/modules/economie',   label: 'Économie & Emploi',color: '#A16D00' },
  { to: '/modules/sante',      label: 'Santé',            color: '#00695C' },
]

/**
 * Layout commun à tous les modules thématiques.
 *
 * Props :
 *   - accentColor  : ex. '#AF0012' — couleur thématique du module
 *   - domaine      : label court ex. 'Sécurité'
 *   - description  : phrase d'intro du module
 *   - children     : contenu spécifique du module
 */
export default function ModuleLayout({ accentColor = 'var(--color-primary)', domaine, description, children }) {
  return (
    <div className="module-layout" style={{ '--module-accent': accentColor }}>

      {/* Breadcrumb + sous-navigation modules */}
      <div className="module-layout__subnav">
        <div className="container module-layout__subnav-inner">
          <nav aria-label="Fil d'ariane" className="module-layout__breadcrumb">
            <NavLink to="/" className="module-layout__breadcrumb-link">Accueil</NavLink>
            <span className="module-layout__breadcrumb-sep" aria-hidden="true">/</span>
            <NavLink to="/modules" className="module-layout__breadcrumb-link">Modules</NavLink>
            <span className="module-layout__breadcrumb-sep" aria-hidden="true">/</span>
            <span className="module-layout__breadcrumb-current" aria-current="page">{domaine}</span>
          </nav>

          <nav aria-label="Modules thématiques" className="module-layout__tabs">
            {MODULES.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                style={{ '--tab-color': m.color }}
                className={({ isActive }) =>
                  `module-layout__tab${isActive ? ' module-layout__tab--active' : ''}`
                }
              >
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* En-tête du module */}
      <header className="module-layout__header">
        <div className="container module-layout__header-inner">
          <div className="module-layout__header-badge" aria-hidden="true">MODULE</div>
          <h1 className="module-layout__title">{domaine}</h1>
          {description && (
            <p className="module-layout__description">{description}</p>
          )}
        </div>
      </header>

      {/* Contenu */}
      <div className="module-layout__content">
        {children}
      </div>
    </div>
  )
}
