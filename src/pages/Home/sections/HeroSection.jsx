import { NavLink } from 'react-router-dom'
import './HeroSection.css'

const MODULES = [
  { label: 'Sécurité',        to: '/modules/securite',   r: 175, g: 0,   b: 18 },
  { label: 'Population & PDI',to: '/modules/population', r: 13,  g: 99,  b: 27 },
  { label: 'Éducation',       to: '/modules/education',  r: 21,  g: 101, b: 192 },
  { label: 'Économie & Emploi',to: '/modules/economie',  r: 161, g: 109, b: 0 },
  { label: 'Santé',           to: '/modules/sante',      r: 0,   g: 105, b: 92 },
]


export default function HeroSection() {
  return (
    <section className="hero" aria-label="Section principale">
      <div className="hero__blob hero__blob--green" aria-hidden="true" />
      <div className="hero__blob hero__blob--red" aria-hidden="true" />

      <div className="container hero__inner">
        <p className="hero__badge">
          <span className="hero__badge-dot" aria-hidden="true" />
          Plateforme nationale · Burkina Faso
        </p>

        <h1 className="hero__title">
          Portail National de Données
          <br />
          <span className="hero__title-accent">pour la Décision Publique</span>
        </h1>

        <p className="hero__tagline">
          La plateforme CITADEL centralise les jeux de données stratégiques du Burkina Faso
          pour soutenir la gouvernance basée sur l'évidence et la prise de décision publique.
        </p>

        <form className="hero__search" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="hero__search-field">
            <svg className="hero__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="hero__search-input"
              placeholder="Rechercher datasets, organisations, indicateurs..."
              aria-label="Rechercher dans la plateforme"
            />
          </div>
          <button type="submit" className="hero__search-btn">
            Explorer les données
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </form>

        <nav className="hero__pills" aria-label="Accès rapide aux modules thématiques">
          <span className="hero__pills-label" aria-hidden="true">Accès rapide :</span>
          {MODULES.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className="hero__pill"
              style={{ '--pill-r': m.r, '--pill-g': m.g, '--pill-b': m.b }}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <p className="hero__coverage">
          <strong>Plus de 1&nbsp;000</strong> ensembles de données provenant de <strong>plus de 15</strong> agences nationales et de portails officiels
        </p>
      </div>
    </section>
  )
}
