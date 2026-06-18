import { useState } from 'react'
import { Link } from 'react-router-dom'
import './OrganizationAccessPage.css'

const STEPS = ['Détails', 'Soumis']
const STORAGE_KEY = 'citadel_new_organization_requests'

const INITIAL_FORM = {
  name: '',
  description: '',
  website: '',
  role: '',
  dataTypes: '',
  dataPublic: '',
  dataPublicLink: '',
}

export default function NewOrganizationRequestPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  function submitRequest(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Le nom de l’organisation est obligatoire.')
      return
    }
    if (!form.description.trim()) {
      setError('La description de l’organisation est obligatoire.')
      return
    }
    if (!form.role.trim()) {
      setError('Votre rôle au sein de l’organisation est obligatoire.')
      return
    }
    if (!form.dataTypes.trim()) {
      setError('Veuillez décrire le type de données que votre organisation souhaite partager.')
      return
    }
    if (!form.dataPublic) {
      setError('Veuillez indiquer si les données sont déjà disponibles publiquement.')
      return
    }
    if (form.dataPublic === 'oui' && !form.dataPublicLink.trim()) {
      setError('Veuillez fournir le lien vers les donnees publiques.')
      return
    }

    const payload = {
      id: `org-${Date.now()}`,
      ...form,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing = raw ? JSON.parse(raw) : []
      localStorage.setItem(STORAGE_KEY, JSON.stringify([payload, ...existing]))
    } catch {
      // No-op in static mode
    }

    setError('')
    setStep(2)
  }

  return (
    <section className="org-access-page">
      <div className="container org-access-page__inner org-access-page__inner--narrow">
        <header className="org-access-page__hero">
          <h1>Création d’une nouvelle organisation</h1>
          <p>
            Remplissez ce formulaire si votre organisation n'apparaît pas dans la liste existante.
          </p>
        </header>

        <ol className="org-access-stepper" aria-label="Étapes de création d’organisation">
          {STEPS.map((label, index) => {
            const stepIndex = index + 1
            const state = step === stepIndex ? 'is-active' : step > stepIndex ? 'is-done' : ''
            return (
              <li key={label} className={`org-access-stepper__item ${state}`.trim()}>
                <span>{stepIndex}</span>
                <strong>{label}</strong>
              </li>
            )
          })}
        </ol>

        <article className="org-access-card">
          {step === 1 && (
            <form className="org-access-form" onSubmit={submitRequest} noValidate>

              {/* Nom */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Nom de l’organisation <abbr title="obligatoire">*</abbr></span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nom officiel de l’organisation"
                  />
                </label>
              </div>

              {/* Description */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Description de l’organisation <abbr title="obligatoire">*</abbr></span>
                  <span className="org-access-hint">
                    Veuillez fournir une description de l’organisation, notamment son domaine d’activité, sa localisation et ses activités.
                  </span>
                  <textarea
                    name="description"
                    rows={5}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Décrivez l’organisation..."
                  />
                </label>
              </div>

              {/* Site web */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Lien vers le site web</span>
                  <span className="org-access-hint">Veuillez partager le site web de l’organisation.</span>
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </label>
              </div>

              {/* Role */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Votre rôle au sein de l’organisation <abbr title="obligatoire">*</abbr></span>
                  <span className="org-access-hint">Décrivez votre rôle au sein de l’organisation.</span>
                  <input
                    type="text"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="Ex : Responsable donnees, charge de projet..."
                  />
                </label>
              </div>

              {/* Type de données */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Type de données que votre organisation souhaite partager <abbr title="obligatoire">*</abbr></span>
                  <span className="org-access-hint">Quel type de données votre organisation souhaite-t-elle partager ?</span>
                  <ul className="org-access-guidance">
                    <li>Le sujet des données – comme les réfugiés, l’éducation, etc.</li>
                    <li>Les lieux couverts par les donnees – veuillez preciser si des donnees infranationales sont incluses.</li>
                    <li>
                      Le format de fichier dans lequel les donnees sont disponibles – les formats acceptables sont <strong>.csv</strong> ou <strong>.xlsx</strong> pour les donnees tabulaires et les formats <strong>json</strong> et <strong>geojson</strong> compresses pour les donnees geographiques.
                    </li>
                  </ul>
                  <textarea
                    name="dataTypes"
                    rows={5}
                    value={form.dataTypes}
                    onChange={handleChange}
                    placeholder="Décrivez les données..."
                  />
                </label>
              </div>

              {/* Données publiques */}
              <div className="org-access-field-group">
                <label className="org-access-field">
                  <span>Les données sont-elles déjà disponibles publiquement via un site web ? <abbr title="obligatoire">*</abbr></span>
                  <select
                    name="dataPublic"
                    value={form.dataPublic}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </label>
              </div>

              {/* Lien conditionnel si oui */}
              {form.dataPublic === 'oui' && (
                <div className="org-access-field-group">
                  <label className="org-access-field">
                    <span>Si oui, veuillez fournir un lien <abbr title="obligatoire">*</abbr></span>
                    <input
                      type="url"
                      name="dataPublicLink"
                      value={form.dataPublicLink}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </label>
                </div>
              )}

              {error && <p className="org-access-error">{error}</p>}

              <div className="org-access-actions">
                <Link to="/organisations/adhesion-organisation" className="btn-secondary">Retour</Link>
                <button type="submit" className="btn-primary">Soumettre</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="org-access-form">
              <p className="org-access-success">
                Votre demande de création d’organisation a été soumise avec succès. Elle sera examinée par
                l'équipe CITADEL. Après validation, vous pourrez soumettre une demande d'adhésion à cette
                nouvelle organisation.
              </p>
              <div className="org-access-actions">
                <Link to="/organisations/adhesion-organisation" className="btn-primary">Retour à l’adhésion</Link>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
