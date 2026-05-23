import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import logoImg from '../../../assets/logo-citadel.png'
import './Header.css'

const ROUTE_LABELS = {
  donnees: 'Données',
  visualisations: 'Visualisations',
  organisations: 'Organisations',
  contact: 'Contact',
  faq: 'FAQ',
  connexion: 'Connexion',
  inscription: 'Inscription',
  contribution: 'Contribution',
  docs: 'Documentation',
}

const MODULE_LABELS = {
  securite: 'Securite',
  population: 'Population',
  education: 'Education',
  economie: 'Economie',
  sante: 'Sante',
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const breadcrumbItems = useMemo(() => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/'
    if (cleanPath === '/') return []

    const segments = cleanPath.split('/').filter(Boolean)
    const items = [{ label: 'Accueil', to: '/' }]
    let currentPath = ''

    segments.forEach((segment, idx) => {
      currentPath += `/${segment}`
      let label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

      if (segments[0] === 'visualisations' && idx === 1) {
        label = MODULE_LABELS[segment] || label
      }

      if (segments[0] === 'modules' && idx === 1) {
        label = MODULE_LABELS[segment] || label
      }

      if (segment === 'modules') {
        label = 'Visualisations'
      }

      items.push({
        label,
        to: idx === segments.length - 1 ? null : currentPath,
      })
    })

    return items
  }, [pathname])

  const showBreadcrumb = breadcrumbItems.length > 0

  return (
    <header className="header">
      {/* Barre supérieure */}
      <div className="header__topbar">
        <div className="container header__topbar-inner">
          <a href="https://data.citadel.bf" className="header__topbar-brand">data.citadel.bf</a>
          <div className="header__topbar-right">
            <a href="/faq" className="header__topbar-link">FAQ</a>
            <div className="header__lang">
              <button className="header__lang-btn header__lang-btn--active">FR</button>
              <span className="header__lang-sep">|</span>
              <button className="header__lang-btn">EN</button>
            </div>
            <a href="/connexion" className="header__topbar-link">SE CONNECTER</a>
            <a href="/inscription" className="header__topbar-btn">S'INSCRIRE</a>
          </div>
        </div>
      </div>

      {/* Barre principale */}
      <div className="header__main">
        <div className="container header__main-inner">
          {/* Logo */}
          <NavLink to="/" className="header__logo" aria-label="CITADEL — Accueil">
            <img src={logoImg} alt="Logo CITADEL" className="header__logo-img" />
          </NavLink>

          {/* Navigation principale */}
          <nav className="header__nav" aria-label="Navigation principale">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'
              }
            >
              Accueil
            </NavLink>
            <NavLink to="/donnees" className="header__nav-link">Données</NavLink>
            <NavLink to="/visualisations" className="header__nav-link">Visualisations</NavLink>

            <NavLink to="/organisations" className="header__nav-link">Organisations</NavLink>
            <NavLink to="/contact" className="header__nav-link">Contact</NavLink>
          </nav>

          {/* Barre de recherche + CTA */}
          <div className="header__actions">
            <div className="header__search" role="search">
              <svg className="header__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="#9ca3af" strokeWidth="1.5" />
                <path d="M13 13l3.5 3.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Rechercher..."
                className="header__search-input"
                aria-label="Rechercher dans la plateforme"
              />
            </div>
            <a href="/contribution" className="btn-primary header__cta">Ajouter des données</a>
          </div>

          {/* Hamburger mobile */}
          <button
            className={`header__hamburger${mobileOpen ? ' header__hamburger--open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {showBreadcrumb && (
        <div className="header__breadcrumb" aria-label="Fil d'ariane">
          <div className="container header__breadcrumb-inner">
            <nav className="header__breadcrumb-trail" aria-label="Navigation de contexte">
              {breadcrumbItems.map((item, idx) => (
                <span key={`${item.label}-${idx}`} className="header__breadcrumb-item">
                  {item.to ? <Link to={item.to} className="header__breadcrumb-link">{item.label}</Link> : <span className="header__breadcrumb-current">{item.label}</span>}
                  {idx < breadcrumbItems.length - 1 && <span className="header__breadcrumb-sep">/</span>}
                </span>
              ))}
            </nav>
            <span className="header__breadcrumb-version">V1.0.4</span>
          </div>
        </div>
      )}

      {/* Menu mobile */}
      {mobileOpen && (
        <nav className="header__mobile-nav" aria-label="Navigation mobile">
          <NavLink to="/" end className="header__mobile-link" onClick={() => setMobileOpen(false)}>Accueil</NavLink>
          <NavLink to="/donnees" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Données</NavLink>
          <NavLink to="/visualisations" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Visualisations</NavLink>
          <NavLink to="/organisations" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Organisations</NavLink>
          <NavLink to="/contact" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Contact</NavLink>
          <a href="/contribution" className="btn-primary header__mobile-cta">Ajouter des données</a>
        </nav>
      )}
    </header>
  )
}
