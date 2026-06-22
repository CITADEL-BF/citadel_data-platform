import { useState, useMemo } from 'react'

/* ──────────────────────────────────────────────
   Génération d'avatar SVG déterministe
   (initiales sur fond coloré — non modifiable)
────────────────────────────────────────────── */
const AVATAR_PALETTE = [
  ['#1a4f8f', '#d0e4ff'],
  ['#176719', '#d4f7d4'],
  ['#7a3c00', '#fde9c8'],
  ['#6b1b2a', '#fddce2'],
  ['#2d5a6e', '#c8eaf7'],
  ['#4a2b7a', '#e8d8ff'],
]

function getAvatarColors(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function AvatarSVG({ name, size = 80 }) {
  const initials = getInitials(name || 'U')
  const [bg, fg] = getAvatarColors(name || 'citadel')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-label={`Avatar de ${name}`}
      role="img"
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
    >
      <rect width="80" height="80" rx="40" fill={bg} />
      <text
        x="40"
        y="40"
        dominantBaseline="central"
        textAnchor="middle"
        fill={fg}
        fontSize="26"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {initials}
      </text>
    </svg>
  )
}

/* ──────────────────────────────────────────────
   Composant principal
────────────────────────────────────────────── */
export default function ProfilSection({ user, onSave }) {
  const [profil, setProfil] = useState({
    nom: user?.name || '',
    email: user?.email || '',
    apropos: user?.apropos || '',
  })

  const [pwd, setPwd] = useState({
    actuel: '',
    nouveau: '',
    confirm: '',
  })

  const [profilErrors, setProfilErrors] = useState({})
  const [pwdErrors, setPwdErrors] = useState({})
  const [profilSaved, setProfilSaved] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)

  const initials = useMemo(() => getInitials(profil.nom || 'U'), [profil.nom])

  function handleProfilChange(e) {
    const { name, value } = e.target
    setProfil((p) => ({ ...p, [name]: value }))
    if (profilErrors[name]) setProfilErrors((p) => ({ ...p, [name]: undefined }))
    setProfilSaved(false)
  }

  function handlePwdChange(e) {
    const { name, value } = e.target
    setPwd((p) => ({ ...p, [name]: value }))
    if (pwdErrors[name]) setPwdErrors((p) => ({ ...p, [name]: undefined }))
    setPwdSaved(false)
  }

  function submitProfil(e) {
    e.preventDefault()
    const errs = {}
    if (!profil.nom.trim()) errs.nom = 'Le nom est requis'
    if (!profil.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profil.email)) {
      errs.email = 'Email invalide'
    }
    if (Object.keys(errs).length) { setProfilErrors(errs); return }
    onSave?.({ ...user, name: profil.nom, email: profil.email, apropos: profil.apropos })
    setProfilSaved(true)
  }

  function submitPwd(e) {
    e.preventDefault()
    const errs = {}
    if (!pwd.actuel.trim()) errs.actuel = 'Mot de passe actuel requis'
    if (!pwd.nouveau.trim() || pwd.nouveau.length < 8) errs.nouveau = '8 caractères minimum'
    if (pwd.confirm !== pwd.nouveau) errs.confirm = 'Les mots de passe ne correspondent pas'
    if (Object.keys(errs).length) { setPwdErrors(errs); return }
    setPwd({ actuel: '', nouveau: '', confirm: '' })
    setPwdSaved(true)
  }

  return (
    <div className="settings-section">
      {/* Avatar */}
      <div className="settings-avatar-block">
        <AvatarSVG name={profil.nom || 'Utilisateur'} size={80} />
        <div>
          <p className="settings-avatar-block__name">{profil.nom || 'Utilisateur'}</p>
          <p className="settings-avatar-block__hint">
            {profil.apropos?.trim() || "Vous n'avez pas fourni de biographie"}
          </p>
        </div>
      </div>

      {/* Formulaire profil */}
      <form className="settings-form" onSubmit={submitProfil} noValidate>
        <h3>Informations personnelles</h3>

        <div className="settings-form__row">
          <label className="settings-form__field">
            <span>Nom complet <abbr title="obligatoire">*</abbr></span>
            <input
              type="text"
              name="nom"
              value={profil.nom}
              onChange={handleProfilChange}
              className={profilErrors.nom ? 'error' : ''}
              placeholder="Votre nom complet"
            />
            {profilErrors.nom && <span className="settings-form__error" role="alert">{profilErrors.nom}</span>}
          </label>

          <label className="settings-form__field">
            <span>Email <abbr title="obligatoire">*</abbr></span>
            <input
              type="email"
              name="email"
              value={profil.email}
              onChange={handleProfilChange}
              className={profilErrors.email ? 'error' : ''}
              placeholder="vous@exemple.bf"
              autoComplete="email"
            />
            {profilErrors.email && <span className="settings-form__error" role="alert">{profilErrors.email}</span>}
          </label>
        </div>

        <label className="settings-form__field">
          <span>A propos</span>
          <textarea
            name="apropos"
            value={profil.apropos}
            onChange={handleProfilChange}
            rows={3}
            placeholder="Décrivez brièvement votre rôle ou votre organisation..."
          />
        </label>

        <div className="settings-form__actions">
          {profilSaved && (
            <p className="settings-form__success" role="status">Profil enregistré avec succès.</p>
          )}
          <button type="submit" className="btn-primary">Enregistrer le profil</button>
        </div>
      </form>

      <hr className="settings-divider" />

      {/* Formulaire mot de passe */}
      <form className="settings-form" onSubmit={submitPwd} noValidate>
        <h3>Modifier le mot de passe</h3>

        <label className="settings-form__field">
          <span>Mot de passe actuel</span>
          <input
            type="password"
            name="actuel"
            value={pwd.actuel}
            onChange={handlePwdChange}
            className={pwdErrors.actuel ? 'error' : ''}
            autoComplete="current-password"
          />
          {pwdErrors.actuel && <span className="settings-form__error" role="alert">{pwdErrors.actuel}</span>}
        </label>

        <div className="settings-form__row">
          <label className="settings-form__field">
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              name="nouveau"
              value={pwd.nouveau}
              onChange={handlePwdChange}
              className={pwdErrors.nouveau ? 'error' : ''}
              autoComplete="new-password"
            />
            {pwdErrors.nouveau && <span className="settings-form__error" role="alert">{pwdErrors.nouveau}</span>}
          </label>

          <label className="settings-form__field">
            <span>Confirmation</span>
            <input
              type="password"
              name="confirm"
              value={pwd.confirm}
              onChange={handlePwdChange}
              className={pwdErrors.confirm ? 'error' : ''}
              autoComplete="new-password"
            />
            {pwdErrors.confirm && <span className="settings-form__error" role="alert">{pwdErrors.confirm}</span>}
          </label>
        </div>

        <div className="settings-form__actions">
          {pwdSaved && (
            <p className="settings-form__success" role="status">Mot de passe modifié avec succès.</p>
          )}
          <button type="submit" className="btn-primary">Mettre à jour le mot de passe</button>
        </div>
      </form>
    </div>
  )
}
