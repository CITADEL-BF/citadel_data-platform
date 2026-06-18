import { useLanguage } from '../../../contexts/LanguageContext'
import { TRANSLATIONS } from './translations'
import './MethodologySection.css'

const ICONS = [
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" key="extraction">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" key="nettoyage">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" key="sources">
    <path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 00-6 0c0 .14.11.56.18 1H10c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h1v7h2v-7h6v7h2V9c0-.55-.45-1-1-1zm-8-1a1 1 0 112 0c0 .14-.1.53-.18 1h-1.64C12.1 5.53 12 5.14 12 5z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" key="licences">
    <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 2a9 9 0 110 18A9 9 0 0112 3zm-1 4v2H9v2h2v6h2V9h2V7h-4z" />
    <path d="M9 13.5A3.5 3.5 0 0112.5 10H14v1.5h-1.5A2 2 0 0010.5 14v.5A2 2 0 0012.5 16H14V17.5h-1.5A3.5 3.5 0 019 14v-.5z" />
  </svg>,
]

// Fiole de laboratoire — watermark SVG
function FlaskWatermark() {
  return (
    <svg
      className="methodology-section__watermark"
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corps de la fiole */}
      <path
        d="M42 8 L42 72 L8 138 Q4 148 14 152 L106 152 Q116 148 112 138 L78 72 L78 8 Z"
        stroke="currentColor" strokeWidth="5" strokeLinejoin="round" fill="none"
      />
      {/* Col */}
      <rect x="36" y="4" width="48" height="10" rx="5" stroke="currentColor" strokeWidth="5" fill="none" />
      {/* Liquide bouillonnant */}
      <path
        d="M20 128 Q40 118 60 128 Q80 138 100 128 L108 145 Q104 152 96 152 L24 152 Q16 152 12 145 Z"
        fill="currentColor" opacity="0.18"
      />
      {/* Bulles */}
      <circle cx="50" cy="118" r="5" fill="currentColor" opacity="0.18" />
      <circle cx="70" cy="108" r="3.5" fill="currentColor" opacity="0.14" />
      <circle cx="60" cy="130" r="2.5" fill="currentColor" opacity="0.12" />
    </svg>
  )
}

export default function MethodologySection() {
  const { language } = useLanguage()
  const t = TRANSLATIONS[language].methodology

  return (
    <section className="methodology-section" aria-label={t.ariaLabel}>
      <FlaskWatermark />

      <div className="container methodology-section__inner">
        <div className="methodology-section__header">
          <h2 className="methodology-section__title headline-md">{t.title}</h2>
          <p className="methodology-section__desc">
            {t.desc}
          </p>
        </div>

        <div className="methodology-grid">
          {t.steps.map((step, idx) => (
            <div key={step.num} className="methodology-card">
              <div className="methodology-card__num" aria-hidden="true">{step.num}</div>
              <div className="methodology-card__icon-wrap" aria-hidden="true">
                {ICONS[idx]}
              </div>
              <div className="methodology-card__body">
                <h3 className="methodology-card__title">{step.title}</h3>

                {step.desc && (
                  <p className="methodology-card__desc">{step.desc}</p>
                )}

                {step.sources && (
                  <ul className="methodology-card__sources">
                    {step.sources.map((s) => (
                      <li key={s.label}>
                        <span className="methodology-source__tag">{s.label}</span>
                        <span className="methodology-source__full">{s.full}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {step.badge && (
                  <span className="methodology-card__badge">{step.badge}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
