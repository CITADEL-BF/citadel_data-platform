import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './ContactPage.css'

const SUBJECTS = [
  'Demande d\'accès aux données',
  'Signalement d\'erreur ou donnée incorrecte',
  'Proposition de jeu de données',
  'Partenariat ou collaboration',
  'Demande presse / communication',
  'Question technique',
  'Autre',
]

const INFO_CARDS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
    label: 'Email',
    value: 'info@citadel.bf',
    href: 'mailto:info@citadel.bf',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
    label: 'Adresse',
    value: 'Université Joseph KI-ZERBO, 03 BP 7021 Ouagadougou 03, Burkina Faso',
    href:null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
    label: 'Téléphone',
    value: '+226 02 20 31 31',
    href: 'tel:+22602203131',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
      </svg>
    ),
    label: 'Disponibilité',
    value: 'Lun – Ven, 8h – 17h GMT',
    href: null,
  },
]

const INITIAL = { nom: '', email: '', organisation: '', sujet: '', message: '' }

function validate(fields) {
  const errors = {}
  if (!fields.nom.trim()) errors.nom = 'Champ requis'
  if (!fields.email.trim()) {
    errors.email = 'Champ requis'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Adresse e-mail invalide'
  }
  if (!fields.sujet) errors.sujet = 'Veuillez sélectionner un sujet'
  if (!fields.message.trim()) errors.message = 'Champ requis'
  else if (fields.message.trim().length < 20) errors.message = 'Message trop court (20 caractères min.)'
  return errors
}

export default function ContactPage() {
  const [fields, setFields] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    // Simulation d'envoi (sans backend)
    setSent(true)
  }

  function handleReset() {
    setFields(INITIAL)
    setErrors({})
    setSent(false)
  }

  return (
    <div className="contact-page">
      {/* ── En-tête ── */}
      <div className="contact-page__header">
        <div className="container contact-page__header-inner">
          <nav className="contact-page__breadcrumb" aria-label="Fil d'Ariane">
            <NavLink to="/" className="contact-page__breadcrumb-link">Accueil</NavLink>
            <span className="contact-page__breadcrumb-sep" aria-hidden="true">›</span>
            <span className="contact-page__breadcrumb-current">Contact</span>
          </nav>

          <div className="contact-page__header-badge">Nous contacter</div>

          <h1 className="contact-page__title">
            [Nous Écrire]
          </h1>
          <p className="contact-page__subtitle">
            Une question sur les données, un signalement d&apos;erreur ou une proposition de
            collaboration&nbsp;? L&apos;équipe CITADEL vous répond sous 2 jours ouvrés.
          </p>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="container contact-page__body">
        <div className="contact-page__grid">

          {/* ── Colonne formulaire ── */}
          <div className="contact-page__form-col">
            {sent ? (
              <div className="contact-success" role="status">
                <div className="contact-success__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
                <h2 className="contact-success__title">Message envoyé !</h2>
                <p className="contact-success__desc">
                  Merci, <strong>{fields.nom}</strong>. Votre message a bien été reçu.
                  Nous vous répondrons à <strong>{fields.email}</strong> dans les meilleurs délais.
                </p>
                <button className="contact-page__btn contact-page__btn--outline" onClick={handleReset}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form
                className="contact-form"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Formulaire de contact"
              >
                <div className="contact-form__row">
                  {/* Nom */}
                  <div className={`contact-form__field${errors.nom ? ' contact-form__field--error' : ''}`}>
                    <label className="contact-form__label" htmlFor="cf-nom">
                      Nom complet <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="cf-nom"
                      name="nom"
                      type="text"
                      className="contact-form__input"
                      placeholder="Prénom Nom"
                      value={fields.nom}
                      onChange={handleChange}
                      autoComplete="name"
                      aria-required="true"
                      aria-describedby={errors.nom ? 'cf-nom-err' : undefined}
                    />
                    {errors.nom && <span id="cf-nom-err" className="contact-form__error" role="alert">{errors.nom}</span>}
                  </div>

                  {/* Email */}
                  <div className={`contact-form__field${errors.email ? ' contact-form__field--error' : ''}`}>
                    <label className="contact-form__label" htmlFor="cf-email">
                      Adresse e-mail <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="cf-email"
                      name="email"
                      type="email"
                      className="contact-form__input"
                      placeholder="vous@exemple.com"
                      value={fields.email}
                      onChange={handleChange}
                      autoComplete="email"
                      aria-required="true"
                      aria-describedby={errors.email ? 'cf-email-err' : undefined}
                    />
                    {errors.email && <span id="cf-email-err" className="contact-form__error" role="alert">{errors.email}</span>}
                  </div>
                </div>

                {/* Organisation (optionnel) */}
                <div className="contact-form__field">
                  <label className="contact-form__label" htmlFor="cf-org">
                    Organisation <span className="contact-form__optional">(facultatif)</span>
                  </label>
                  <input
                    id="cf-org"
                    name="organisation"
                    type="text"
                    className="contact-form__input"
                    placeholder="Ministère, ONG, université…"
                    value={fields.organisation}
                    onChange={handleChange}
                    autoComplete="organization"
                  />
                </div>

                {/* Sujet */}
                <div className={`contact-form__field${errors.sujet ? ' contact-form__field--error' : ''}`}>
                  <label className="contact-form__label" htmlFor="cf-sujet">
                    Sujet <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="cf-sujet"
                    name="sujet"
                    className="contact-form__select"
                    value={fields.sujet}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby={errors.sujet ? 'cf-sujet-err' : undefined}
                  >
                    <option value="" disabled>Sélectionner un sujet…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.sujet && <span id="cf-sujet-err" className="contact-form__error" role="alert">{errors.sujet}</span>}
                </div>

                {/* Message */}
                <div className={`contact-form__field${errors.message ? ' contact-form__field--error' : ''}`}>
                  <label className="contact-form__label" htmlFor="cf-message">
                    Message <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="cf-message"
                    name="message"
                    className="contact-form__textarea"
                    placeholder="Décrivez votre demande avec le plus de détails possible…"
                    rows={6}
                    value={fields.message}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby={errors.message ? 'cf-message-err' : undefined}
                  />
                  <span className="contact-form__char-count">
                    {fields.message.length} caractère{fields.message.length !== 1 ? 's' : ''}
                  </span>
                  {errors.message && <span id="cf-message-err" className="contact-form__error" role="alert">{errors.message}</span>}
                </div>

                <div className="contact-form__footer">
                  <p className="contact-form__notice">
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="14" height="14">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" />
                    </svg>
                    Vos données sont utilisées uniquement pour répondre à votre demande. Aucune revente, aucun démarchage.
                  </p>
                  <button type="submit" className="contact-page__btn">
                    Envoyer le message
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Colonne informations ── */}
          <aside className="contact-page__info-col" aria-label="Informations de contact">
            <div className="contact-info">
              <h2 className="contact-info__title">Informations</h2>

              <div className="contact-info__cards">
                {INFO_CARDS.map((card) => (
                  <div key={card.label} className="contact-info__card">
                    <div className="contact-info__card-icon" aria-hidden="true">
                      {card.icon}
                    </div>
                    <div className="contact-info__card-body">
                      <span className="contact-info__card-label">{card.label}</span>
                      {card.href ? (
                        <a href={card.href} className="contact-info__card-value contact-info__card-value--link">
                          {card.value}
                        </a>
                      ) : (
                        <span className="contact-info__card-value">{card.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Délimiteur */}
              <hr className="contact-info__divider" />

              {/* À propos / liens utiles */}
              <div className="contact-info__links">
                <h3 className="contact-info__links-title">Liens utiles</h3>
                <ul className="contact-info__link-list">
                  <li>
                    <NavLink to="/donnees" className="contact-info__link">
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="14" height="14">
                        <path d="M13.5 3A1.5 1.5 0 0 1 15 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 11.5v-7A1.5 1.5 0 0 1 2.5 3h11zm-11-1A2.5 2.5 0 0 0 0 4.5v7A2.5 2.5 0 0 0 2.5 14h11A2.5 2.5 0 0 0 16 11.5v-7A2.5 2.5 0 0 0 13.5 2h-11z" />
                        <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                      </svg>
                      Catalogue des données
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/organisations" className="contact-info__link">
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="14" height="14">
                        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                        <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z" />
                        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                      </svg>
                      Partenaires & Organisations
                    </NavLink>
                  </li>
                  <li>
                    <a href="https://citadel.bf" target="_blank" rel="noopener noreferrer" className="contact-info__link">
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="14" height="14">
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm-.5 11V5.5L11 8.25 7.5 11z" />
                      </svg>
                      Projet CITADEL (site officiel)
                    </a>
                  </li>
                </ul>
              </div>

              {/* Badge réponse */}
              <div className="contact-info__sla">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Réponse sous <strong>2 jours ouvrés</strong></span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
