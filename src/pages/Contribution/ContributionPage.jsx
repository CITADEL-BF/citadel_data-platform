import { useMemo, useState } from 'react'
import './ContributionPage.css'

const STEPS = [
  'Partage',
  'Description',
  'Infos supplémentaires',
  'Fichiers',
  'Aperçu',
  'Soumission',
]

const LICENSE_OPTIONS = [
  'CC0 1.0',
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC BY-ND 4.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA 4.0',
  'CC BY-NC-ND 4.0',
  'CC BY 3.0 IGO',
  'CC BY-SA 3.0 IGO',
  'CC BY-NC 3.0 IGO',
  'CC BY-NC-SA 3.0 IGO',
  'ODC-By 1.0',
  'ODbL 1.0',
  'PDDL 1.0',
  'Etalab Open Licence 2.0',
  'Open Government Licence (OGL) v3.0',
  'IODL 2.0 (India Open Data License)',
  'Open Data Commons Attribution (legacy)',
  'CDLA Permissive 2.0',
  'CDLA Sharing 1.0',
  'CDLA Permissive 1.0',
  'GNU FDL 1.3',
  'Open Database License with Commercial Use',
  'Open Use with Attribution',
  'Public Domain Mark',
  'Licence propriétaire organisationnelle',
  'Licence restreinte interne',
  'Licence gouvernementale spécifique',
  'Accord bilatéral de partage',
  'À préciser',
]

const UPDATE_FREQUENCIES = [
  'Temps réel',
  'Quotidienne',
  'Hebdomadaire',
  'Mensuelle',
  'Trimestrielle',
  'Annuelle',
  'Ponctuelle',
]

const GUIDELINES = [
  'Classez les ressources avec le fichier le plus recent en premier.',
  'Utilisez des acronymes pour les sources lorsque cela est possible.',
  'Ajoutez des etiquettes pertinentes pour faciliter la recherche.',
]

export default function ContributionPage() {
  const [shareMode, setShareMode] = useState('public')
  const [licenseType, setLicenseType] = useState('CC BY 4.0')
  const [uploadMode, setUploadMode] = useState('fichier')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [urlResources, setUrlResources] = useState([])
  const [urlResourceDraft, setUrlResourceDraft] = useState({
    url: '',
    nameFormat: '',
    notes: '',
    containsPersonal: false,
    containsMicrodata: false,
  })
  const [urlResourceError, setUrlResourceError] = useState('')
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [previewFile, setPreviewFile] = useState('')
  const [complianceChecked, setComplianceChecked] = useState(false)

  const resourceOptions = useMemo(() => {
    const localOptions = selectedFiles.map((file, index) => ({
      value: `file-${index}`,
      label: `[Fichier] ${file.name} (${file.type || 'type inconnu'})`,
    }))
    const urlOptions = urlResources.map((resource, index) => ({
      value: `url-${index}`,
      label: `[URL] ${resource.nameFormat}`,
    }))
    return [...localOptions, ...urlOptions]
  }, [selectedFiles, urlResources])

  const allResources = useMemo(() => {
    const locals = selectedFiles.map((file, index) => ({
      key: `file-${index}`,
      title: `${index + 1}. ${file.name}`,
      meta: `${(file.size / 1024).toFixed(1)} Ko`,
      type: 'Fichier local',
    }))
    const remotes = urlResources.map((resource, index) => ({
      key: `url-${index}`,
      title: `${locals.length + index + 1}. ${resource.nameFormat}`,
      meta: resource.url,
      type: 'Ressource URL',
    }))
    return [...locals, ...remotes]
  }, [selectedFiles, urlResources])

  function appendFiles(fileList) {
    const nextFiles = Array.from(fileList || [])
    if (nextFiles.length === 0) return

    setSelectedFiles((prev) => {
      const merged = [...prev, ...nextFiles]
      if (!previewFile && merged.length > 0) {
        setPreviewFile('file-0')
      }
      return merged
    })
  }

  function handleUrlResourceChange(event) {
    const { name, value, checked, type } = event.target
    setUrlResourceDraft((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (urlResourceError) setUrlResourceError('')
  }

  function addUrlResource() {
    const rawUrl = urlResourceDraft.url.trim()
    const rawName = urlResourceDraft.nameFormat.trim()

    if (!rawUrl || !rawName) {
      setUrlResourceError('URL et nom/format sont obligatoires.')
      return
    }

    try {
      new URL(rawUrl)
    } catch {
      setUrlResourceError('Veuillez entrer une URL valide (http/https).')
      return
    }

    setUrlResources((prev) => {
      const next = [...prev, { ...urlResourceDraft, url: rawUrl, nameFormat: rawName }]
      if (!previewFile) {
        setPreviewFile(`url-${next.length - 1}`)
      }
      return next
    })

    setUrlResourceDraft({
      url: '',
      nameFormat: '',
      notes: '',
      containsPersonal: false,
      containsMicrodata: false,
    })
    setUrlResourceError('')
  }

  function handleFileInput(event) {
    appendFiles(event.target.files)
  }

  function handleDrop(event) {
    event.preventDefault()
    appendFiles(event.dataTransfer.files)
  }

  function handleDragOver(event) {
    event.preventDefault()
  }

  return (
    <section className="contribution-page">
      <div className="contribution-hero">
        <div className="container contribution-hero__inner">
          <div>
            <h1 className="contribution-hero__title">Ajouter un jeu de donnees</h1>
            <p className="contribution-hero__subtitle">
              Suivez les 6 etapes pour preparer et soumettre votre ensemble de donnees.
            </p>
          </div>

          <ol className="contribution-stepper" aria-label="Progression de publication">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className={`contribution-stepper__item${index === 0 ? ' contribution-stepper__item--active' : ''}`}
              >
                <span className="contribution-stepper__bullet">{index + 1}</span>
                <span className="contribution-stepper__label">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="container contribution-layout">
        <div className="contribution-main">
          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">▣</span>
              <h2>1. Choisissez comment partager vos donnees</h2>
            </header>

            <div className="contribution-grid contribution-grid--two">
              <button
                type="button"
                className={`contribution-privacy${shareMode === 'public' ? ' contribution-privacy--active' : ''}`}
                onClick={() => {
                  setShareMode('public')
                }}
              >
                <strong>Public</strong>
                <span>Les donnees sont publiees ouvertement sur la plateforme.</span>
              </button>

              <button
                type="button"
                className={`contribution-privacy${shareMode === 'private' ? ' contribution-privacy--active' : ''}`}
                onClick={() => {
                  setShareMode('private')
                }}
              >
                <strong>Prive</strong>
                <span>Les donnees sont visibles uniquement par les membres de votre organisation.</span>
              </button>
            </div>
          </article>

          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">✎</span>
              <h2>2. Décrivez l’ensemble de données</h2>
            </header>

            <div className="contribution-grid contribution-grid--single">
              <label className="contribution-field">
                <span>Titre du jeu de donnees</span>
                <input type="text" placeholder="ex: Rendement agricole national 2023" />
                <small>Choisissez un titre clair et descriptif.</small>
              </label>

              <label className="contribution-field">
                <span>Description détaillée</span>
                <textarea rows={4} placeholder="Décrivez la méthodologie, l'objectif et la période couverte par la collecte..." />
              </label>
            </div>
          </article>

          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">⚙</span>
              <h2>3. Inclure des informations supplémentaires</h2>
            </header>

            <div className="contribution-grid contribution-grid--two">
              <label className="contribution-field">
                <span>Source</span>
                <input type="text" placeholder="INSD, OCHA, ACLED" />
                <small>Utilisez des acronymes et séparez les sources par des virgules.</small>
              </label>

              <label className="contribution-field">
                <span>Domaine / catégorie</span>
                <select defaultValue="">
                  <option value="" disabled>Sélectionner un domaine</option>
                  <option value="securite">Sécurité</option>
                  <option value="population">Population</option>
                  <option value="education">Éducation</option>
                  <option value="economie">Économie</option>
                  <option value="sante">Santé</option>
                </select>
              </label>

              <label className="contribution-field">
                <span>Organisation</span>
                <input type="text" placeholder="Organisation qui partage ce jeu de donnees" />
              </label>

              <label className="contribution-field">
                <span>Responsable de la maintenance</span>
                <input type="text" placeholder="Nom et email de la personne de reference" />
              </label>

              <label className="contribution-field">
                <span>Période</span>
                <input type="text" placeholder="ex: Janvier 2021 - Décembre 2025" />
              </label>

              <label className="contribution-field">
                <span>Fréquence de mise à jour</span>
                <select defaultValue="Temps reel">
                  {UPDATE_FREQUENCIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="contribution-field">
                <span>Localisation</span>
                <input type="text" placeholder="Pays, region ou zone couverte" />
              </label>

              <label className="contribution-field">
                <span>Methodologie</span>
                <textarea rows={3} placeholder="Expliquez comment les donnees ont ete collectees ou generees" />
              </label>

              <label className="contribution-field">
                <span>Avertissements / Commentaires</span>
                <textarea rows={3} placeholder="Limites, hypotheses ou considerations particulieres" />
              </label>

              <label className="contribution-field">
                <span>Etiquettes</span>
                <input type="text" placeholder="ex: pdi, sécurité alimentaire, burkina faso" />
              </label>
            </div>

            <div className="contribution-field contribution-field--chips">
              <span>Type de licence</span>
              <select value={licenseType} onChange={(event) => setLicenseType(event.target.value)}>
                {LICENSE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <small>Liste étendue de licences; choisissez "Autre" si votre licence n’est pas dans la liste.</small>
            </div>
          </article>

          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">⤴</span>
              <h2>4. Ajouter plus de fichiers</h2>
            </header>

            <div className="contribution-mode-switch" role="tablist" aria-label="Mode d’import des ressources">
              <button
                type="button"
                role="tab"
                aria-selected={uploadMode === 'fichier'}
                className={`contribution-mode-btn${uploadMode === 'fichier' ? ' contribution-mode-btn--active' : ''}`}
                onClick={() => setUploadMode('fichier')}
              >
                Importer un fichier (par defaut)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={uploadMode === 'url'}
                className={`contribution-mode-btn${uploadMode === 'url' ? ' contribution-mode-btn--active' : ''}`}
                onClick={() => setUploadMode('url')}
              >
                Importation depuis une URL
              </button>
            </div>

            {uploadMode === 'fichier' ? (
              <>
                <div
                  className="contribution-dropzone"
                  role="button"
                  tabIndex={0}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <p className="contribution-dropzone__title">Glisser-deposer vos fichiers</p>
                  <p className="contribution-dropzone__meta">Formats lisibles machine acceptes. Apercu disponible pour CSV, XLS, JSON et GeoJSON.</p>
                  <label className="btn-primary contribution-dropzone__browse">
                    Parcourir
                    <input type="file" multiple onChange={handleFileInput} hidden />
                  </label>
                </div>

                <div className="contribution-file-actions">
                  <label className="contribution-actions__draft contribution-file-actions__add-more">
                    Ajouter plus de fichiers
                    <input type="file" multiple onChange={handleFileInput} hidden />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="contribution-resource-list" aria-label="Liste des ressources ajoutees">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="contribution-resource-item">
                        <strong>{index + 1}. {file.name}</strong>
                        <span>{(file.size / 1024).toFixed(1)} Ko</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="contribution-grid contribution-grid--two">
                <label className="contribution-field">
                  <span>1. URL du fichier distant (obligatoire)</span>
                  <input
                    type="url"
                    name="url"
                    value={urlResourceDraft.url}
                    onChange={handleUrlResourceChange}
                    placeholder="https://..."
                    required
                  />
                </label>
                <label className="contribution-field">
                  <span>2. Nom et format du fichier (obligatoire)</span>
                  <input
                    type="text"
                    name="nameFormat"
                    value={urlResourceDraft.nameFormat}
                    onChange={handleUrlResourceChange}
                    placeholder="ex: incidents_2026.csv"
                    required
                  />
                </label>
                <label className="contribution-field">
                  <span>3. Notes sur ce fichier (facultatif)</span>
                  <textarea
                    rows={3}
                    name="notes"
                    value={urlResourceDraft.notes}
                    onChange={handleUrlResourceChange}
                    placeholder="Contexte, mode de calcul, limites"
                  />
                </label>
                <div className="contribution-field contribution-field--checks">
                  <span>4-5. Nature des donnees</span>
                  <label className="contribution-check">
                    <input
                      type="checkbox"
                      name="containsPersonal"
                      checked={urlResourceDraft.containsPersonal}
                      onChange={handleUrlResourceChange}
                    />
                    <span>Contient des donnees personnelles</span>
                  </label>
                  <label className="contribution-check">
                    <input
                      type="checkbox"
                      name="containsMicrodata"
                      checked={urlResourceDraft.containsMicrodata}
                      onChange={handleUrlResourceChange}
                    />
                    <span>Contient des microdonnees</span>
                  </label>
                </div>
                <div className="contribution-url-actions">
                  <button type="button" className="btn-primary" onClick={addUrlResource}>Ajouter la ressource URL</button>
                  {urlResourceError && <span className="contribution-url-error">{urlResourceError}</span>}
                </div>
              </div>
            )}

            {allResources.length > 0 && (
              <div className="contribution-resource-list" aria-label="Liste des ressources ajoutees">
                {allResources.map((resource) => (
                  <div key={resource.key} className="contribution-resource-item">
                    <div>
                      <strong>{resource.title}</strong>
                      <span className="contribution-resource-type">{resource.type}</span>
                    </div>
                    <span>{resource.meta}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">◫</span>
              <h2>5. Activer les aperçus automatiques (facultatif)</h2>
            </header>

            <div className="contribution-field contribution-field--checks">
              <label className="contribution-check">
                <input
                  type="checkbox"
                  checked={previewEnabled}
                  onChange={(event) => setPreviewEnabled(event.target.checked)}
                />
                <span>Activer l’aperçu des données</span>
              </label>
            </div>

            <label className="contribution-field">
              <span>Sélectionnez le fichier à prévisualiser</span>
              <select
                value={previewFile}
                onChange={(event) => setPreviewFile(event.target.value)}
                disabled={resourceOptions.length === 0}
              >
                {resourceOptions.length === 0 ? (
                  <option value="">Aucun fichier importé pour le moment</option>
                ) : (
                  resourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))
                )}
              </select>
            </label>

            <div className="contribution-field contribution-field--checks">
              <label className="contribution-check">
                <input
                  type="checkbox"
                  checked={complianceChecked}
                  onChange={(event) => setComplianceChecked(event.target.checked)}
                />
                <span>Je confirme que cet ensemble ne contient pas de données personnelles et respecte les conditions d'utilisation de data.citadel.bf.</span>
              </label>
            </div>
          </article>

          <article className="contribution-card">
            <header className="contribution-card__header">
              <span className="contribution-card__icon">✓</span>
              <h2>6. Soumettre l’ensemble de données</h2>
            </header>

            <p className="contribution-submit-text">
              Vérifiez une dernière fois vos informations puis soumettez votre ensemble de données.
            </p>

            <footer className="contribution-actions">
              <button type="button" className="contribution-actions__draft">Enregistrer comme brouillon</button>
              <button type="button" className="btn-primary" disabled={!complianceChecked}>Soumettre l’ensemble de données</button>
            </footer>
          </article>

        </div>

        <aside className="contribution-sidebar" aria-label="Consignes de publication">
          <article className="contribution-aside-card">
            <h3>Consignes de publication</h3>
            <ul>
              {GUIDELINES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  )
}
