import logoImg from '../../../assets/logo-citadel.png'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import './Footer.css'

const TRANSLATIONS = {
  fr: {
    brandDesc: "Plateforme de données pour l'analyse humanitaire, économique et sociale du Burkina Faso.",
    quickNav: 'Navigation Rapide',
    quickLinks: [
      { href: '/', label: 'Accueil' },
      { href: '/donnees', label: 'Données' },
      { href: '/visualisations', label: 'Visualisations' },
      { href: '/organisations', label: 'Organisations' },
      { href: '/contribution', label: 'Ajouter des données' },
      { href: '/faq', label: 'FAQ' },
    ],
    newsletter: {
      title: 'Newsletter',
      desc: "Restez informé des dernières publications de données et rapports d'analyse.",
      placeholder: 'Votre adresse email',
      ariaLabel: 'Adresse email pour la newsletter',
      button: "S'abonner",
    },
    contact: {
      title: 'Contact',
    },
    license: {
      notice: "Sauf indication contraire, le contenu de ce site est mis à disposition selon les termes de la\u00a0",
      link: 'licence Creative Commons Attribution 4.0 International',
      label: 'Licence Creative Commons Attribution 4.0 International',
    },
    copyright: '© 2025 data.citadel.bf. Tous droits réservés.',
    licenseBadge: 'Licence CC BY 4.0',
    privacy: 'Politique de confidentialité',
    terms: "Conditions d'utilisation",
  },
  en: {
    brandDesc: 'Data platform for humanitarian, economic and social analysis of Burkina Faso.',
    quickNav: 'Quick Navigation',
    quickLinks: [
      { href: '/', label: 'Home' },
      { href: '/donnees', label: 'Data' },
      { href: '/visualisations', label: 'Visualizations' },
      { href: '/organisations', label: 'Organizations' },
      { href: '/contribution', label: 'Add data' },
      { href: '/faq', label: 'FAQ' },
    ],
    newsletter: {
      title: 'Newsletter',
      desc: 'Stay informed about the latest data publications and analysis reports.',
      placeholder: 'Your email address',
      ariaLabel: 'Email address for newsletter',
      button: 'Subscribe',
    },
    contact: {
      title: 'Contact',
    },
    license: {
      notice: 'Unless otherwise stated, the content of this site is made available under the terms of the\u00a0',
      link: 'Creative Commons Attribution 4.0 International License',
      label: 'Creative Commons Attribution 4.0 International License',
    },
    copyright: '© 2025 data.citadel.bf. All rights reserved.',
    licenseBadge: 'License CC BY 4.0',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
  },
}

export default function Footer() {
  const { language } = useLanguage()
  const t = TRANSLATIONS[language]

  return (
    <footer className="footer">
      <div className="container footer__card-wrap">
        <div className="footer__card">
          <div className="footer__grid">
            {/* Colonne 1 — Identité */}
            <div className="footer__brand">
              <div className="footer__logo">
                <img src={logoImg} alt="Logo CITADEL" className="footer__logo-img" />
              </div>
              <p className="footer__brand-desc">
                {t.brandDesc}
              </p>
              <div className="footer__social">
                <a href="https://www.facebook.com/profile.php?id=100072284842721" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/citadel-bf/" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                {/* X (anciennement Twitter) */}
                <a href="https://x.com/citadel_uvbf" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Colonne 2 — Navigation rapide */}
            <div className="footer__col">
              <h3 className="footer__col-title">{t.quickNav}</h3>
              <ul className="footer__links">
                {t.quickLinks.map((link) => (
                  <li key={link.href}>
                    <NavLink to={link.href} className="footer__link">{link.label}</NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3 — Newsletter */}
            <div className="footer__col">
              <h3 className="footer__col-title">{t.newsletter.title}</h3>
              <p className="footer__col-desc">
                {t.newsletter.desc}
              </p>
              <form className="footer__newsletter" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={t.newsletter.placeholder}
                  className="footer__newsletter-input"
                  aria-label={t.newsletter.ariaLabel}
                />
                <button type="submit" className="btn-primary footer__newsletter-btn">{t.newsletter.button}</button>
              </form>
            </div>

            {/* Colonne 4 — Contact */}
            <div className="footer__col">
              <h3 className="footer__col-title">{t.contact.title}</h3>
              <address className="footer__address">
                <a href="mailto:info@citadel.bf" className="footer__contact-item">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M2.5 6.5l7.5 5 7.5-5M3 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  citadel.uvbf@gmail.com
                </a>
                <span className="footer__contact-item">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M10 2C6.134 2 3 5.134 3 9c0 5 7 11 7 11s7-6 7-11c0-3.866-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                   Université Joseph KI-ZERBO,<br></br>
                   03 BP 7021 Ouagadougou 03, Burkina Faso
                </span>
              </address>
            </div>
          </div>

          {/* Barre de bas de page */}
          <div className="footer__bottom">
            <p className="footer__license-notice">
              {t.license.notice}
              <a
                href={language === 'fr' ? 'https://creativecommons.org/licenses/by/4.0/deed.fr' : 'https://creativecommons.org/licenses/by/4.0/deed.en'}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__license-link"
              >
               {t.license.link}
              </a>.
            </p>
            <div className="footer__bottom-inner">
              <span>{t.copyright}</span>
              <a
                href={language === 'fr' ? 'https://creativecommons.org/licenses/by/4.0/deed.fr' : 'https://creativecommons.org/licenses/by/4.0/deed.en'}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__license"
                aria-label={t.license.label}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-4h-2v4zm0-6h2V8h-2v2z" />
                </svg>
                Licence CC BY 4.0
              </a>
              <div className="footer__bottom-links">
                <NavLink to="/confidentialite" className="footer__bottom-link">{t.privacy}</NavLink>
                <NavLink to="/conditions" className="footer__bottom-link">{t.terms}</NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
