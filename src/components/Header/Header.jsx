import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logoImg from '../../../assets/logo-citadel.png'
import './Header.css'

const MEGA_MENU = [
  {
    group: 'Gouvernance & Analyse',
    items: [
      { href: '/modules/population', label: 'Population & PDI' },
      { href: '/modules/securite', label: 'Sécurité' },
    ],
  },
  {
    group: 'Développement Social',
    items: [
      { href: '/modules/education', label: 'Éducation' },
      { href: '/modules/sante', label: 'Santé' },
    ],
  },
  {
    group: 'Développement Économique',
    items: [
      { href: '/modules/economie', label: 'Économie & Emploi' },
    ],
  },
]

export default function Header() {
  const [modulesOpen, setModulesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

            {/* Méga-menu Modules */}
            <div
              className="header__dropdown"
              onMouseEnter={() => setModulesOpen(true)}
              onMouseLeave={() => setModulesOpen(false)}
            >
              <button
                className="header__nav-link header__nav-link--btn"
                aria-expanded={modulesOpen}
                aria-haspopup="true"
              >
                Modules
                <svg
                  className={`header__chevron${modulesOpen ? ' header__chevron--open' : ''}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {modulesOpen && (
                <div className="header__mega-menu" role="menu" aria-label="Modules thématiques">
                  {MEGA_MENU.map((section) => (
                    <div key={section.group} className="header__mega-group">
                      <span className="header__mega-group-title">{section.group}</span>
                      {section.items.map((item) => (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className="header__mega-item"
                          role="menuitem"
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

      {/* Menu mobile */}
      {mobileOpen && (
        <nav className="header__mobile-nav" aria-label="Navigation mobile">
          <NavLink to="/" end className="header__mobile-link" onClick={() => setMobileOpen(false)}>Accueil</NavLink>
          <NavLink to="/donnees" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Données</NavLink>
          {MEGA_MENU.map((section) => (
            <div key={section.group} className="header__mobile-group">
              <span className="header__mobile-label">{section.group}</span>
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className="header__mobile-link header__mobile-link--sub"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <NavLink to="/organisations" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Organisations</NavLink>
          <NavLink to="/contact" className="header__mobile-link" onClick={() => setMobileOpen(false)}>Contact</NavLink>
          <a href="/contribution" className="btn-primary header__mobile-cta">Ajouter des données</a>
        </nav>
      )}
    </header>
  )
}
