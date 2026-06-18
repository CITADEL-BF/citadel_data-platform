import { useLanguage } from '../../../contexts/LanguageContext'
import { TRANSLATIONS } from './translations'
import './StatusBanner.css'

export default function StatusBanner() {
  const { language } = useLanguage()
  const t = TRANSLATIONS[language].status
  const marqueeItems = [...t.items, ...t.items]

  return (
    <section className="status-banner" aria-label={t.ariaLabel}>
      <div className="container">
        <div className="status-banner__surface">
          <div className="status-banner__viewport">
            <ul className="status-banner__track" role="list">
              {marqueeItems.map((item, index) => (
              <li key={`${item.label}-${index}`} className="status-banner__item">
                <span className={`status-banner__icon status-banner__icon--${index % 2 === 0 ? 'primary' : 'secondary'}`} aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3a7 7 0 100 14 7 7 0 000-14zm0 4a1.25 1.25 0 110 2.5A1.25 1.25 0 0110 7zm1.2 7H8.8v-1.2H10V9.8H8.8V8.6H11.2V14z" />
                  </svg>
                </span>
                <div className="status-banner__text">
                  <span className="status-banner__label">{item.label}</span>
                  <strong className="status-banner__value">{item.value}</strong>
                </div>
              </li>
            ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
