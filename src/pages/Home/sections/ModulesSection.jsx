import './ModulesSection.css'

const MODULES = [
  {
    id: 'securite',
    label: 'Sécurité',
    desc: "Analyse prédictive des zones de conflit et surveillance de l'intégrité territoriale.",
    href: '/modules/securite',
    color: 'var(--domain-securite)',
    bg: 'rgba(175, 0, 18, 0.07)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
    large: true,
  },
  {
    id: 'population',
    label: 'Population & PDI',
    desc: 'Gestion des flux migratoires et des personnes déplacées internes.',
    href: '/modules/population',
    color: 'var(--domain-population)',
    bg: 'rgba(46, 125, 50, 0.08)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    id: 'education',
    label: 'Éducation',
    desc: 'Suivi des taux de scolarisation et déploiement des infrastructures scolaires.',
    href: '/modules/education',
    color: 'var(--domain-education)',
    bg: 'rgba(21, 101, 192, 0.08)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
      </svg>
    ),
  },
  {
    id: 'economie',
    label: 'Économie & Emploi',
    desc: "PIB, indicateurs de croissance et marchés de l'emploi nationaux.",
    href: '/modules/economie',
    color: 'var(--domain-economie)',
    bg: 'rgba(117, 91, 0, 0.08)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    id: 'sante',
    label: 'Santé',
    desc: 'Cartographie sanitaire et gestion des épidémies régionales.',
    href: '/modules/sante',
    color: 'var(--domain-sante)',
    bg: 'rgba(0, 105, 92, 0.08)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
      </svg>
    ),
  },
]

export default function ModulesSection() {
  return (
    <section className="modules-section section--low" aria-label="Axes stratégiques et modules thématiques">
      <div className="container">
        <h2 className="modules-section__title headline-md">[DOMAINES CLÉS]</h2>

        <div className="modules-grid">
          {MODULES.map((m) => (
            <a
              key={m.id}
              href={m.href}
              className={`module-card${m.large ? ' module-card--large' : ''}`}
              style={{ '--module-color': m.color, '--module-bg': m.bg }}
              aria-label={`Module ${m.label}`}
            >
              <div className="module-card__icon-wrap">
                <span className="module-card__icon">{m.icon}</span>
              </div>
              <div className="module-card__body">
                <h3 className="module-card__title">{m.label}</h3>
                <p className="module-card__desc">{m.desc}</p>
              </div>
              <span className="module-card__cta">
                VOIR LE DOMAINE
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
