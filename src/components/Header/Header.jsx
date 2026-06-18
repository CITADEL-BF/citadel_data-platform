import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logoImg from '../../../assets/logo-citadel.png'
import { getRoleDetails } from '../../app/auth/roles'
import { useSubscriptions } from '../../app/subscriptions/SubscriptionsContext'
import { signOutFromSupabase } from '../../app/auth/supabaseAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import './Header.css'

const TRANSLATIONS = {
  fr: {
    routes: {
      donnees: 'Données',
      visualisations: 'Visualisations',
      organisations: 'Organisations',
      contact: 'Contact',
      faq: 'FAQ',
      connexion: 'Connexion',
      inscription: 'Inscription',
      contribution: 'Contribution',
      docs: 'Documentation',
      accueil: 'Accueil',
    },
    modules: {
      securite: 'Sécurité',
      population: 'Population',
      education: 'Éducation',
      economie: 'Économie',
      sante: 'Santé',
    },
    topbar: {
      login: 'SE CONNECTER',
      signup: 'S\'INSCRIRE',
      settings: 'Paramètres utilisateur',
      dashboard: 'Dashboard',
      logout: 'Déconnexion',
    },
    nav: {
      home: 'Accueil',
      data: 'Données',
      visualizations: 'Visualisations',
      organizations: 'Organisations',
      contact: 'Contact',
    },
    cta: {
      addData: 'Ajouter des données',
    },
    search: {
      placeholder: 'Rechercher...',
      ariaLabel: 'Rechercher dans la plateforme',
    },
    aria: {
      mainNav: 'Navigation principale',
      mobileNav: 'Navigation mobile',
      breadcrumb: 'Fil d\'ariane',
      contextNav: 'Navigation de contexte',
      accountLinks: 'Liens du compte',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      homeLabel: 'CITADEL — Accueil',
    },
  },
  en: {
    routes: {
      donnees: 'Data',
      visualisations: 'Visualizations',
      organisations: 'Organizations',
      contact: 'Contact',
      faq: 'FAQ',
      connexion: 'Login',
      inscription: 'Sign up',
      contribution: 'Contribution',
      docs: 'Documentation',
      accueil: 'Home',
    },
    modules: {
      securite: 'Security',
      population: 'Population',
      education: 'Education',
      economie: 'Economy',
      sante: 'Health',
    },
    topbar: {
      login: 'LOG IN',
      signup: 'SIGN UP',
      settings: 'User settings',
      dashboard: 'Dashboard',
      logout: 'Log out',
    },
    nav: {
      home: 'Home',
      data: 'Data',
      visualizations: 'Visualizations',
      organizations: 'Organizations',
      contact: 'Contact',
    },
    cta: {
      addData: 'Add data',
    },
    search: {
      placeholder: 'Search...',
      ariaLabel: 'Search the platform',
    },
    aria: {
      mainNav: 'Main navigation',
      mobileNav: 'Mobile navigation',
      breadcrumb: 'Breadcrumb',
      contextNav: 'Context navigation',
      accountLinks: 'Account links',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      homeLabel: 'CITADEL — Home',
    },
  },
}

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
  securite: 'Sécurité',
  population: 'Population',
  education: 'Éducation',
  economie: 'Économie',
  sante: 'Santé',
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isConnected, currentRole, can } = useSubscriptions()
  const { language, setLang } = useLanguage()

  const t = TRANSLATIONS[language]

  const roleDetails = useMemo(
    () => getRoleDetails(currentRole, isConnected),
    [currentRole, isConnected]
  )

  const canOpenDashboard = isConnected && can('dashboard_settings')

  const userMenuLabel = useMemo(() => {
    if (!isConnected) return roleDetails.label
    if (roleDetails.key === 'sys_admin') return roleDetails.label

    try {
      const raw = localStorage.getItem('citadel_user')
      if (!raw) return roleDetails.label

      const parsed = JSON.parse(raw)
      const firstName = String(parsed.firstName || parsed.prenom || '').trim()
      const lastName = String(parsed.lastName || parsed.nom || '').trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const username = String(parsed.username || parsed.userName || '').trim()
      const name = String(parsed.name || '').trim()
      const email = String(parsed.email || '').trim()
      const emailLocalPart = email.includes('@') ? email.split('@')[0] : ''

      return fullName || username || name || emailLocalPart || roleDetails.label
    } catch {
      return roleDetails.label
    }
  }, [isConnected, roleDetails.key, roleDetails.label])

  useEffect(() => {
    setUserMenuOpen(false)
  }, [pathname])

  async function handleLogout() {
    await signOutFromSupabase()
    setUserMenuOpen(false)
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    navigate(`/donnees${params.toString() ? `?${params.toString()}` : ''}`)
    setMobileOpen(false)
  }

  const breadcrumbItems = useMemo(() => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/'
    if (cleanPath === '/') return []

    const segments = cleanPath.split('/').filter(Boolean)
    const items = [{ label: t.routes.accueil, to: '/' }]
    let currentPath = ''

    segments.forEach((segment, idx) => {
      currentPath += `/${segment}`
      let label = t.routes[segment] || ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

      if (segments[0] === 'visualisations' && idx === 1) {
        label = t.modules[segment] || MODULE_LABELS[segment] || label
      }

      if (segments[0] === 'modules' && idx === 1) {
        label = t.modules[segment] || MODULE_LABELS[segment] || label
      }

      if (segment === 'modules') {
        label = t.routes.visualisations
      }

      if (segments[0] === 'organisations' && idx === 1) {
        label = segment
          .split('-')
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      }

      items.push({
        label,
        to: idx === segments.length - 1 ? null : currentPath,
      })
    })

    return items
  }, [pathname, t])

  const showBreadcrumb = breadcrumbItems.length > 0

  return (
    <header className="header">
      {/* Barre supérieure */}
      <div className="header__topbar">
        <div className="container header__topbar-inner">
          <a href="https://data.citadel.bf" className="header__topbar-brand">data.citadel.bf</a>
          <div className="header__topbar-right">
            <NavLink to="/faq" className="header__topbar-link">FAQ</NavLink>
            <div className="header__lang">
              <button 
                className={`header__lang-btn ${language === 'fr' ? 'header__lang-btn--active' : ''}`}
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <span className="header__lang-sep">|</span>
              <button 
                className={`header__lang-btn ${language === 'en' ? 'header__lang-btn--active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
            {canOpenDashboard ? (
              <>
                <div className="header__account-menu">
                  <button
                    type="button"
                    className="header__role-pill header__role-pill--button"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                  >
                    {userMenuLabel}
                    <span className={`header__account-caret${userMenuOpen ? ' header__account-caret--open' : ''}`} aria-hidden="true">▾</span>
                  </button>

                  {userMenuOpen && (
                    <div className="header__account-dropdown" role="menu" aria-label={t.aria.accountLinks}>
                      <NavLink to="/dashboard" className="header__account-link" role="menuitem" onClick={() => setUserMenuOpen(false)}>{t.topbar.dashboard}</NavLink>
                      <NavLink to="/dashboard/parametres" className="header__account-link" role="menuitem" onClick={() => setUserMenuOpen(false)}>{t.topbar.settings}</NavLink>
                      <button type="button" className="header__account-link header__account-link--button" role="menuitem" onClick={handleLogout}>{t.topbar.logout}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/connexion" className="header__topbar-link">{t.topbar.login}</NavLink>
                <NavLink to="/inscription" className="header__topbar-btn">{t.topbar.signup}</NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barre principale */}
      <div className="header__main">
        <div className="container header__main-inner">
          {/* Logo */}
          <NavLink to="/" className="header__logo" aria-label={t.aria.homeLabel}>
            <img src={logoImg} alt="Logo CITADEL" className="header__logo-img" />
          </NavLink>

          {/* Navigation principale */}
          <nav className="header__nav" aria-label={t.aria.mainNav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'
              }
            >
              {t.nav.home}
            </NavLink>
            <NavLink to="/donnees" className="header__nav-link">{t.nav.data}</NavLink>
            <NavLink to="/visualisations" className="header__nav-link">{t.nav.visualizations}</NavLink>

            <NavLink to="/organisations" className="header__nav-link">{t.nav.organizations}</NavLink>
            <NavLink to="/contact" className="header__nav-link">{t.nav.contact}</NavLink>
          </nav>

          {/* Barre de recherche + CTA */}
          <div className="header__actions">
          {/*  <form className="header__search" role="search" onSubmit={handleSearchSubmit}>
              <svg className="header__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="#9ca3af" strokeWidth="1.5" />
                <path d="M13 13l3.5 3.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder={t.search.placeholder}
                className="header__search-input"
                aria-label={t.search.ariaLabel}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form> */}
            <NavLink to="/contribution" className="btn-primary header__cta">{t.cta.addData}</NavLink>
          </div>

          {/* Hamburger mobile */}
          <button
            className={`header__hamburger${mobileOpen ? ' header__hamburger--open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t.aria.closeMenu : t.aria.openMenu}
            aria-expanded={mobileOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {showBreadcrumb && (
        <div className="header__breadcrumb" aria-label={t.aria.breadcrumb}>
          <div className="container header__breadcrumb-inner">
            <nav className="header__breadcrumb-trail" aria-label={t.aria.contextNav}>
              {breadcrumbItems.map((item, idx) => (
                <span key={`${item.label}-${idx}`} className="header__breadcrumb-item">
                  {item.to ? <Link to={item.to} className="header__breadcrumb-link">{item.label}</Link> : <span className="header__breadcrumb-current">{item.label}</span>}
                  {idx < breadcrumbItems.length - 1 && <span className="header__breadcrumb-sep">/</span>}
                </span>
              ))}
            </nav>
            <span className="header__breadcrumb-version">V1.2</span>
          </div>
        </div>
      )}

      {/* Menu mobile */}
      {mobileOpen && (
        <nav className="header__mobile-nav" aria-label={t.aria.mobileNav}>
          <NavLink to="/" end className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.nav.home}</NavLink>
          <NavLink to="/donnees" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.nav.data}</NavLink>
          <NavLink to="/visualisations" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.nav.visualizations}</NavLink>
          <NavLink to="/organisations" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.nav.organizations}</NavLink>
          <NavLink to="/contact" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.nav.contact}</NavLink>
          {canOpenDashboard && <span className="header__mobile-label">{userMenuLabel}</span>}
          {canOpenDashboard && <NavLink to="/dashboard/parametres" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.topbar.settings}</NavLink>}
          {canOpenDashboard && <NavLink to="/dashboard" className="header__mobile-link" onClick={() => setMobileOpen(false)}>{t.topbar.dashboard}</NavLink>}
          {canOpenDashboard && <button type="button" className="header__mobile-link header__mobile-link--button" onClick={handleLogout}>{t.topbar.logout}</button>}
          <NavLink to="/contribution" className="btn-primary header__mobile-cta" onClick={() => setMobileOpen(false)}>{t.cta.addData}</NavLink>
        </nav>
      )}
    </header>
  )
}
