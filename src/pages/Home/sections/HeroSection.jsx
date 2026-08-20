import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { TRANSLATIONS } from './translations'
import './HeroSection.css'

const MODULE_COLORS = [
  { r: 175, g: 0,   b: 18 },
  { r: 13,  g: 99,  b: 27 },
  { r: 21,  g: 101, b: 192 },
  { r: 161, g: 109, b: 0 },
  { r: 0,   g: 105, b: 92 },
]

export default function HeroSection() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { language } = useLanguage()
  const t = TRANSLATIONS[language].hero

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    navigate(`/donnees${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <section className="hero" aria-label="Section principale">
      <div className="hero__blob hero__blob--green" aria-hidden="true" />
      <div className="hero__blob hero__blob--red" aria-hidden="true" />

      <div className="container hero__inner">
        <p className="hero__badge">
          <span className="hero__badge-dot" aria-hidden="true" />
          {t.badge}
        </p>

        <h1 className="hero__title">
          {t.title}
          <br />
          <span className="hero__title-accent">{t.titleAccent}</span>
        </h1>

        <p className="hero__tagline">
          {t.tagline}
        </p>

        <form className="hero__search" role="search" onSubmit={handleSubmit}>
          <div className="hero__search-field">
            <svg className="hero__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="hero__search-input"
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAriaLabel}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="hero__search-btn">
            {t.searchButton}
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </form>

        <nav className="hero__pills" aria-label="Accès rapide aux modules thématiques">
          <span className="hero__pills-label" aria-hidden="true">{t.quickAccessLabel}</span>
          {t.modules.map((m, idx) => (
            <NavLink
              key={m.to}
              to={m.to}
              className="hero__pill"
              style={{ '--pill-r': MODULE_COLORS[idx].r, '--pill-g': MODULE_COLORS[idx].g, '--pill-b': MODULE_COLORS[idx].b }}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        <p className="hero__coverage">
          <strong>Plus de 145</strong> {t.coverage} <strong>plus de 5</strong> {t.coverageAgencies}
        </p>
      </div>
    </section>
  )
}
