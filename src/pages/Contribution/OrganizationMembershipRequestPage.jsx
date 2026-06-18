import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrganizations, useOrganizationsContent } from '../../features/organizations/organizationsData'
import './OrganizationAccessPage.css'

const STEPS = ['Choix organisation', 'Détails', 'Soumis']

const STORAGE_KEY = 'citadel_membership_requests'

function readUserEmail() {
  try {
    const raw = localStorage.getItem('citadel_user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.email || ''
  } catch {
    return ''
  }
}

export default function OrganizationMembershipRequestPage() {
  const { content } = useOrganizationsContent()
  const organizations = useMemo(() => getAllOrganizations(content), [content])

  const [step, setStep] = useState(1)
  const [selectedOrganization, setSelectedOrganization] = useState('')
  const [motivation, setMotivation] = useState('')
  const [error, setError] = useState('')

  const currentOrganization = useMemo(
    () => organizations.find((org) => org.slug === selectedOrganization) || null,
    [organizations, selectedOrganization]
  )

  function goToStep2() {
    if (!selectedOrganization) {
      setError('Veuillez sélectionner une organisation avant de continuer.')
      return
    }
    setError('')
    setStep(2)
  }

  function submitRequest(event) {
    event.preventDefault()

    if (!motivation.trim()) {
      setError('Veuillez indiquer le motif de votre demande d’adhésion.')
      return
    }

    const payload = {
      id: `req-${Date.now()}`,
      organizationSlug: selectedOrganization,
      organizationName: currentOrganization?.name || selectedOrganization,
      motivation: motivation.trim(),
      requesterEmail: readUserEmail(),
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
    setStep(3)
  }

  return (
    <section className="org-access-page">
      <div className="container org-access-page__inner org-access-page__inner--narrow">
        <header className="org-access-page__hero">
          <h1>Demande d’adhésion à une organisation</h1>
          <p>
            Pour accéder au formulaire d’ajout de données, votre compte doit être rattaché à une organisation.
          </p>
        </header>

        <ol className="org-access-stepper" aria-label="Étapes de la demande d’adhésion">
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
            <>
              <p>
                Veuillez sélectionner une organisation à rejoindre dans la liste ci-dessous.
              </p>

              <label className="org-access-field">
                <span>Organisation</span>
                <select
                  value={selectedOrganization}
                  onChange={(event) => {
                    setSelectedOrganization(event.target.value)
                    if (error) setError('')
                  }}
                >
                  <option value="">Sélectionner une organisation</option>
                  {organizations.map((organization) => (
                    <option key={organization.slug} value={organization.slug}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <p className="org-access-inline-note">
                Si vous ne trouvez pas votre organisation dans la liste, vous pouvez demander la{' '}
                <Link to="/organisations/nouvelle" className="org-access-link">création d’une nouvelle</Link>.
              </p>

              {error && <p className="org-access-error">{error}</p>}

              <div className="org-access-actions">
                <button type="button" className="btn-primary" onClick={goToStep2}>Continuer</button>
              </div>
            </>
          )}

          {step === 2 && (
            <form onSubmit={submitRequest} className="org-access-form" noValidate>
              <p>
                Veuillez indiquer le motif de votre demande d’adhésion à cette organisation. Ce motif, accompagné de vos
                informations personnelles, sera transmis à l’administrateur de l’organisation.
              </p>

              <ul className="org-access-guidance">
                <li>Votre relation avec l’organisation que vous souhaitez rejoindre</li>
                <li>
                  Si vous rejoignez l’organisation pour partager des données, veuillez préciser le type de données que
                  vous souhaitez partager.
                </li>
              </ul>

              <label className="org-access-field">
                <span>Motif de votre demande</span>
                <textarea
                  rows={5}
                  value={motivation}
                  onChange={(event) => {
                    setMotivation(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Décrivez pourquoi vous souhaitez rejoindre cette organisation."
                />
              </label>

              {error && <p className="org-access-error">{error}</p>}

              <div className="org-access-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Retour</button>
                <button type="submit" className="btn-primary">Soumettre la demande</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <>
              <p className="org-access-success">
                Votre demande d’adhésion a bien été soumise. Elle sera examinée par l’administrateur de
                l’organisation sélectionnée. Vous serez notifié(e) dès qu’une décision sera prise.
              </p>

              <div className="org-access-actions">
                <Link to="/contribution" className="btn-secondary">Retour a contribution</Link>
                <Link to="/organisations" className="btn-primary">Voir les organisations</Link>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  )
}
