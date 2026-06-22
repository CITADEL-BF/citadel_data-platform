import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useVisualisations } from '../app/visualisations/VisualisationsContext'
import KpiCockpit from '../components/KpiCockpit/KpiCockpit'
import DomainSidebar from '../components/DomainSidebar/DomainSidebar'
import './VisualisationsLayout.css'

const BestOfGrid = lazy(() => import('../components/BestOfGrid/BestOfGrid'))
const SecuritePage = lazy(() => import('../pages/modules/Securite/SecuritePage'))
const PopulationPage = lazy(() => import('../pages/modules/Population/PopulationPage'))
const EducationPage = lazy(() => import('../pages/modules/Education/EducationPage'))
const EconomiePage = lazy(() => import('../pages/modules/Economie/EconomiePage'))
const SantePage = lazy(() => import('../pages/modules/Sante/SantePage'))

const DOMAINES = [
  { id: 'securite', label: 'Sécurité', accent: '#af0012', soft: 'rgba(175, 0, 18, 0.10)', icon: 'shield', subtitle: '14 312 incidents', trend: '+3% ce mois' },
  { id: 'population', label: 'Population', accent: '#0d631b', soft: 'rgba(13, 99, 27, 0.10)', icon: 'people', subtitle: '22 752 315 habitants', trend: 'Croissance stable' },
  { id: 'education', label: 'Éducation', accent: '#1565c0', soft: 'rgba(21, 101, 192, 0.10)', icon: 'school', subtitle: '64% scolarisation', trend: 'Taux de scolarisation' },
  { id: 'economie', label: 'Économie', accent: '#a16d00', soft: 'rgba(161, 109, 0, 0.10)', icon: 'briefcase', subtitle: '21 787 entreprises', trend: 'Prévision croissance', highlighted: true },
  { id: 'sante', label: 'Santé', accent: '#00695c', soft: 'rgba(0, 105, 92, 0.10)', icon: 'hospital', subtitle: '92,4% couverture', trend: 'Couverture vaccinale' },
]

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const fmtInt = (value) => Number(value || 0).toLocaleString('fr-FR')
const fmtPct = (value) => `${Number(value || 0).toFixed(1)}%`
const CPN2_INDICATOR = 'Evolution du taux de couverture en CPN2 par région'
const IND_RESULTATS_BEPC = 'Evolution des résultats du BEPC'
const IND_RESULTATS_CEP = "Evolution des résultats du Certificat d'Etudes Primaires (CEP)"
const IND_RESULTATS_BAC = 'Evolution des résultats du baccaulauréat'

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim()
    })
    return row
  })
}

function DeferredChunk({ children, minHeight = '18rem' }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return undefined

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '180px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  )
}

function ModuleFallback() {
  return <div style={{ minHeight: '24rem' }} />
}

export default function VisualisationsLayout() {
  const { activeDomaine, setActiveDomaine } = useVisualisations()
  const [kpis, setKpis] = useState({})

  useEffect(() => {
    Promise.all([
      fetch(withBase('data/viz/json/securite/kpi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/population/kpi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/csv/education_indicateurs.csv')).then((r) => r.text()),
      fetch(withBase('data/viz/json/economie/activites_domaines_cefore.json')).then((r) => r.json()),
      fetch(withBase('data/viz/json/economie/serie_taux_emploi.json')).then((r) => r.json()),
      fetch(withBase('data/viz/csv/sante_couverture_sanitaire.csv')).then((r) => r.text()),
    ])
      .then(([securiteData, populationData, educationCsvText, economieData, tauxEmploiData, santeCoverageCsvText]) => {
        const securiteValue = Number(securiteData?.indicateurs?.nb_evenements_civils || 0)
        const securiteDeaths = Number(securiteData?.indicateurs?.nb_deces_totaux || 0)

        const populationKpi = (populationData?.kpis || []).find((item) => item.id === 'pop_totale')
        const populationRate = (populationData?.kpis || []).find((item) => item.id === 'taux_croissance')

        const educationRows = parseCsv(educationCsvText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          categorie_1: String(row.categorie_1 || '').trim().toLowerCase(),
        }))

        const resultsRows = educationRows.filter((row) => (
          [IND_RESULTATS_CEP, IND_RESULTATS_BEPC, IND_RESULTATS_BAC].includes(row.indicateur)
          && row.categorie_1 === 'pourcentage'
          && row.valeur > 0
        ))
        const educationYear = resultsRows.reduce((max, row) => Math.max(max, row.annee || 0), 0)
        const educationRates = resultsRows
          .filter((row) => row.annee === educationYear)
          .map((row) => Number(row.valeur || 0))
        const educationAvgRate = educationRates.length
          ? educationRates.reduce((sum, value) => sum + value, 0) / educationRates.length
          : 0

        const enterprisesValue = Number(economieData?.total_annee_reference || 0)
        const latestEmployment = (tauxEmploiData?.series || []).find((serie) => serie.nom === 'Ensemble')?.data?.slice(-1)[0] ?? null

        const santeRows = parseCsv(santeCoverageCsvText).map((row) => ({
          ...row,
          annee: Number(row.annee || 0),
          valeur: Number(row.valeur || 0),
          indicateur: String(row.indicateur || '').trim(),
          region: String(row.region || '').trim(),
        }))
        const cpn2Rows = santeRows
          .filter((row) => row.indicateur === CPN2_INDICATOR && row.region === 'Burkina Faso')
          .sort((a, b) => a.annee - b.annee)
        const latestCoverage = cpn2Rows[cpn2Rows.length - 1]

        setKpis({
          sécurité: { value: fmtInt(securiteValue), detail: `${fmtInt(securiteDeaths)} décès totaux` },
          population: { value: fmtInt(populationKpi?.valeur || 0), detail: populationRate ? `${populationRate.valeur}% de croissance` : 'Population totale' },
          education: { value: fmtPct(educationAvgRate), detail: educationYear ? `Taux moyen de reussite ${educationYear}` : 'Resultats scolaires' },
          economie: { value: fmtInt(enterprisesValue || 0), detail: latestEmployment ? `${fmtPct(latestEmployment)} d'emploi` : 'Entreprises CEFORE' },
          sante: { value: fmtPct(latestCoverage?.valeur || 0), detail: latestCoverage ? `Couverture CPN2 ${latestCoverage.annee}` : 'Couverture sanitaire' },
        })
      })
      .catch(() => {
        setKpis({
          sécurité: { value: '14 312', detail: 'Alerte nationale' },
          population: { value: '22 752 315', detail: 'Population totale' },
          education: { value: '64.0%', detail: 'Taux moyen de reussite' },
          economie: { value: '21 787', detail: 'Entreprises CEFORE' },
          sante: { value: '92.4%', detail: 'Couverture CPN2' },
        })
      })
  }, [])

  return (
    <div className={`visualisations-layout${activeDomaine ? ' visualisations-layout--analyse' : ''}`}>
      <div className="container visualisations-layout__container">
        {!activeDomaine && (
          <section key="landing" className="visualisations-landing visualisations-fade-enter" aria-label="Vue d'ensemble des visualisations">
            <KpiCockpit domaines={DOMAINES} kpis={kpis} />
            <DeferredChunk minHeight="22rem">
              <BestOfGrid />
            </DeferredChunk>

            <section className="visualisations-cta" aria-label="Bandeau institutionnel">
              <h2>Pret a approfondir vos recherches ?</h2>
              <p>Accedez au catalogue complet de jeux de donnees visualises et explorez les ressources methodologiques de la plateforme.</p>
              <div className="visualisations-cta__actions">
                <a href="/donnees" className="visualisations-cta__btn visualisations-cta__btn--solid">Explorer le catalogue</a>
                <a href="/docs" className="visualisations-cta__btn visualisations-cta__btn--outline">Documentation</a>
              </div>
            </section>
          </section>
        )}

        {activeDomaine && (
          <section key={activeDomaine} className="visualisations-analyse visualisations-fade-enter" aria-label="Mode analyse visualisations">
            <DomainSidebar domaines={DOMAINES} kpis={kpis} />

            <div className="visualisations-analyse__main">
              <Suspense fallback={<ModuleFallback />}>
                {activeDomaine === 'securite' && <SecuritePage />}
                {activeDomaine === 'population' && <PopulationPage />}
                {activeDomaine === 'education' && <EducationPage />}
                {activeDomaine === 'economie' && <EconomiePage />}
                {activeDomaine === 'sante' && <SantePage />}
              </Suspense>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
