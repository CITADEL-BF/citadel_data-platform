import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import './ExploreCtaSection.css'

const TEXT = {
  fr: {
    kicker: 'Nouveau',
    title: 'Visualisez vos propres données',
    body:
      'Chargez un fichier CSV et construisez vos graphiques en quelques clics. Tout se passe dans votre navigateur : aucun compte, aucune donnée conservée.',
    cta: 'Ouvrir l’explorateur',
    steps: ['Importer un CSV', 'Choisir une vue', 'Exporter en image'],
  },
  en: {
    kicker: 'New',
    title: 'Visualize your own data',
    body:
      'Load a CSV file and build your charts in a few clicks. Everything runs in your browser: no account, no data retained.',
    cta: 'Open the explorer',
    steps: ['Import a CSV', 'Pick a view', 'Export as image'],
  },
}

export default function ExploreCtaSection() {
  const { language } = useLanguage()
  const t = TEXT[language] || TEXT.fr

  return (
    <section className="explore-cta">
      <div className="container explore-cta__inner">
        <div className="explore-cta__content">
          <span className="explore-cta__kicker">{t.kicker}</span>
          <h2 className="explore-cta__title">{t.title}</h2>
          <p className="explore-cta__body">{t.body}</p>
          <Link to="/explorer" className="btn-primary explore-cta__btn">{t.cta}</Link>
        </div>
        <ol className="explore-cta__steps">
          {t.steps.map((step, idx) => (
            <li key={step} className="explore-cta__step">
              <span className="explore-cta__step-num">{idx + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
