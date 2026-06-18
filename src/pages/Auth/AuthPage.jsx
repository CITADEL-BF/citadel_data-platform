import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import authIllustration from '../../../assets/connexion-4.png'
import { signInWithSupabase, signUpWithSupabase } from '../../app/auth/supabaseAuth'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import './AuthPage.css'

const INITIAL_LOGIN = {
  email: '',
  password: '',
}

const INITIAL_SIGNUP = {
  username: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptNewsletter: false,
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState(location.pathname === '/inscription' ? 'signup' : 'login')
  const [loginFields, setLoginFields] = useState(INITIAL_LOGIN)
  const [signupFields, setSignupFields] = useState(INITIAL_SIGNUP)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [globalNotice, setGlobalNotice] = useState('')

  const redirectTo = useMemo(() => {
    const candidate = location.state?.from?.pathname
    return candidate || '/'
  }, [location.state])

  function handleLoginChange(event) {
    const { name, value } = event.target
    setLoginFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSignupChange(event) {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setSignupFields((prev) => ({ ...prev, [name]: nextValue }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function submitLogin(event) {
    event.preventDefault()
    const nextErrors = {}

    if (!loginFields.email.trim()) {
      nextErrors.email = 'Email requis'
    } else if (!isValidEmail(loginFields.email.trim())) {
      nextErrors.email = 'Email invalide'
    }

    if (!loginFields.password.trim()) {
      nextErrors.password = 'Mot de passe requis'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setGlobalNotice('')
    try {
      await signInWithSupabase({
        email: loginFields.email.trim(),
        password: loginFields.password,
      })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setGlobalNotice(error.message || 'Connexion impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSignup(event) {
    event.preventDefault()
    const nextErrors = {}

    if (!signupFields.username.trim()) nextErrors.username = 'Champ requis'
    if (!signupFields.lastName.trim()) nextErrors.lastName = 'Champ requis'

    if (!signupFields.email.trim()) {
      nextErrors.email = 'Email requis'
    } else if (!isValidEmail(signupFields.email.trim())) {
      nextErrors.email = 'Email invalide'
    }

    if (!signupFields.confirmEmail.trim()) {
      nextErrors.confirmEmail = 'Confirmation email requise'
    } else if (!isValidEmail(signupFields.confirmEmail.trim())) {
      nextErrors.confirmEmail = 'Email invalide'
    } else if (signupFields.confirmEmail.trim() !== signupFields.email.trim()) {
      nextErrors.confirmEmail = 'Les emails ne correspondent pas'
    }

    if (!signupFields.password.trim()) {
      nextErrors.password = 'Mot de passe requis'
    } else if (signupFields.password.trim().length < 8) {
      nextErrors.password = '8 caracteres minimum'
    }

    if (signupFields.confirmPassword !== signupFields.password) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    if (!signupFields.acceptTerms) {
      nextErrors.acceptTerms = 'Vous devez accepter les conditions d’utilisation'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setGlobalNotice('')
    try {
      const result = await signUpWithSupabase({
        email: signupFields.email.trim(),
        password: signupFields.password,
        username: signupFields.username.trim(),
        fullName: signupFields.lastName.trim(),
      })

      if (result.needsEmailConfirmation) {
        setGlobalNotice('Compte créé. Vérifiez votre email pour confirmer l’inscription.')
      } else {
        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setGlobalNotice(error.message || 'Inscription impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  const isProtectedRedirect = Boolean(location.state?.from?.pathname)

  return (
    <section className="auth-page">
      <div className="container auth-page__inner">
        <div className="auth-card">
          <div className="auth-card__grid">
            <aside
              className="auth-aside"
              aria-label="Informations sur les usages de la plateforme"
              style={{ '--auth-aside-bg': `url(${authIllustration})` }}
            >
              <div className="auth-aside__overlay">
                <div className="auth-aside__sections">
                  <section className="auth-aside__section">
                    <h2>Rechercher et télécharger des données</h2>
                    <p>
                      Explorez et utilisez des milliers d’ensembles de données sur data.citadel.bf sans compte.
                    </p>
                  </section>

                  <section className="auth-aside__section">
                    <h2>Creer un compte</h2>
                    <p>
                      Accédez à des fonctionnalités supplémentaires avec un compte data.citadel.bf individuel.
                    </p>
                  </section>

                  <section className="auth-aside__section">
                    <h2>Partager des donnees</h2>
                    <p>Pour les organisations qui doivent publier des donnees sur data.citadel.bf.</p>
                    <ul className="auth-aside__list">
                      <li>Commencez par creer un compte individuel</li>
                      <li>Votre demande sera examinée</li>
                      <li>Fournir des exemples de donnees pour verification</li>
                    </ul>
                  </section>
                </div>
              </div>
            </aside>

            <div className="auth-main">
              {!isSupabaseConfigured && (
                <p className="auth-card__notice">
                  Supabase n’est pas configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
                </p>
              )}

              {isProtectedRedirect && (
                <p className="auth-card__notice">
                  Vous devez vous connecter pour acceder a la page Ajouter des donnees.
                </p>
              )}

              {globalNotice && (
                <p className="auth-card__notice">
                  {globalNotice}
                </p>
              )}

              <div className="auth-card__head">
                <h1 className="auth-card__title">{mode === 'signup' ? 'Inscription' : 'Connexion'}</h1>
                <p className="auth-card__subtitle">
                  Connectez-vous pour acceder a la soumission de jeux de donnees.
                </p>
              </div>

              <div className="auth-tabs" role="tablist" aria-label="Connexion ou inscription">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
                  onClick={() => {
                    setMode('login')
                    setErrors({})
                  }}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={`auth-tab${mode === 'signup' ? ' auth-tab--active' : ''}`}
                  onClick={() => {
                    setMode('signup')
                    setErrors({})
                  }}
                >
                  S’inscrire
                </button>
              </div>

              {mode === 'login' ? (
                <form className="auth-form" onSubmit={submitLogin} noValidate>
                  <label className="auth-form__field">
                    <span className="auth-form__label">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={loginFields.email}
                      onChange={handleLoginChange}
                      className={`auth-form__input${errors.email ? ' auth-form__input--error' : ''}`}
                      placeholder="vous@organisation.bf"
                      autoComplete="email"
                    />
                    {errors.email && <span className="auth-form__error">{errors.email}</span>}
                  </label>

                  <label className="auth-form__field">
                    <span className="auth-form__label">Mot de passe</span>
                    <input
                      type="password"
                      name="password"
                      value={loginFields.password}
                      onChange={handleLoginChange}
                      className={`auth-form__input${errors.password ? ' auth-form__input--error' : ''}`}
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                    />
                    {errors.password && <span className="auth-form__error">{errors.password}</span>}
                  </label>

                  <button type="submit" className="btn-primary auth-form__submit" disabled={submitting || !isSupabaseConfigured}>
                    {submitting ? 'Connexion...' : 'Se connecter'}
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={submitSignup} noValidate>
                  <div className="auth-form__row">
                    <label className="auth-form__field">
                      <span className="auth-form__label">Nom d’utilisateur</span>
                      <input
                        type="text"
                        name="username"
                        value={signupFields.username}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.username ? ' auth-form__input--error' : ''}`}
                        placeholder="Nom d’utilisateur"
                      />
                      {errors.username && <span className="auth-form__error">{errors.username}</span>}
                    </label>

                    <label className="auth-form__field">
                      <span className="auth-form__label">Nom</span>
                      <input
                        type="text"
                        name="lastName"
                        value={signupFields.lastName}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.lastName ? ' auth-form__input--error' : ''}`}
                        placeholder="Nom"
                      />
                      {errors.lastName && <span className="auth-form__error">{errors.lastName}</span>}
                    </label>
                  </div>

                  <div className="auth-form__row">
                    <label className="auth-form__field">
                      <span className="auth-form__label">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={signupFields.email}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.email ? ' auth-form__input--error' : ''}`}
                        placeholder="vous@organisation.bf"
                        autoComplete="email"
                      />
                      {errors.email && <span className="auth-form__error">{errors.email}</span>}
                    </label>

                    <label className="auth-form__field">
                      <span className="auth-form__label">Ressaisie email</span>
                      <input
                        type="email"
                        name="confirmEmail"
                        value={signupFields.confirmEmail}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.confirmEmail ? ' auth-form__input--error' : ''}`}
                        placeholder="Confirmez votre email"
                        autoComplete="email"
                      />
                      {errors.confirmEmail && <span className="auth-form__error">{errors.confirmEmail}</span>}
                    </label>
                  </div>

                  <div className="auth-form__row">
                    <label className="auth-form__field">
                      <span className="auth-form__label">Mot de passe</span>
                      <input
                        type="password"
                        name="password"
                        value={signupFields.password}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.password ? ' auth-form__input--error' : ''}`}
                        autoComplete="new-password"
                      />
                      {errors.password && <span className="auth-form__error">{errors.password}</span>}
                    </label>

                    <label className="auth-form__field">
                      <span className="auth-form__label">Confirmation</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={signupFields.confirmPassword}
                        onChange={handleSignupChange}
                        className={`auth-form__input${errors.confirmPassword ? ' auth-form__input--error' : ''}`}
                        autoComplete="new-password"
                      />
                      {errors.confirmPassword && <span className="auth-form__error">{errors.confirmPassword}</span>}
                    </label>
                  </div>

                  <div className="auth-form__checkboxes">
                    <label className="auth-form__check">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={signupFields.acceptTerms}
                        onChange={handleSignupChange}
                      />
                      <span>J’accepte les conditions d’utilisation du site</span>
                    </label>
                    {errors.acceptTerms && <span className="auth-form__error">{errors.acceptTerms}</span>}

                    <label className="auth-form__check">
                      <input
                        type="checkbox"
                        name="acceptNewsletter"
                        checked={signupFields.acceptNewsletter}
                        onChange={handleSignupChange}
                      />
                      <span>J accepte de recevoir les newsletters</span>
                    </label>
                  </div>

                  <button type="submit" className="btn-primary auth-form__submit" disabled={submitting || !isSupabaseConfigured}>
                    {submitting ? 'Creation...' : 'Creer mon compte'}
                  </button>
                </form>
              )}

              {mode === 'login' ? (
                <div className="auth-card__actions">
                  <Link to="/contact" className="auth-card__hint-link">Mot de passe oublie ?</Link>
                  <p className="auth-card__hint">
                    Pas encore membre ?
                    {' '}
                    <button
                      type="button"
                      className="auth-card__hint-button"
                      onClick={() => {
                        setMode('signup')
                        setErrors({})
                      }}
                    >
                      Inscrivez-vous
                    </button>
                  </p>
                </div>
              ) : (
                <p className="auth-card__hint">
                  Déjà membre ?
                  {' '}
                  <button
                    type="button"
                    className="auth-card__hint-button"
                    onClick={() => {
                      setMode('login')
                      setErrors({})
                    }}
                  >
                    Connectez-vous
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
