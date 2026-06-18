import { useEffect, useMemo, useState } from 'react'
import mapPreview from '../../../assets/home/CITADEL-projet.webp'
import { DATASETS } from '../datasets/catalogueData'

const ORGANIZATIONS_DATA_URL = `${import.meta.env.BASE_URL}data/organisations_externes.json`

const DEFAULT_CONTENT = {
  types: [
    { value: 'all', label: 'Tous' },
    { value: 'ministere', label: 'Ministères' },
    { value: 'ong', label: 'ONGs' },
    { value: 'institut-recherche', label: 'Instituts de Recherche' },
    { value: 'partenaire', label: 'Partenaires' }
  ],
  organizations: [
    {
      slug: 'ministere-sante',
      name: 'Ministère de la Santé et de l’Hygiène Publique',
      shortName: 'MS',
      type: 'ministere',
      typeLabel: 'Administration publique',
      description: 'Pilotage des indicateurs sanitaires nationaux et des systemes de surveillance epidemiologique.',
      longDescription:
        'Le Ministère de la Santé assure la gouvernance des statistiques de santé publique, la consolidation des données de couverture sanitaire et la coordination des systèmes d’alerte épidémiologique.',
      website: 'https://www.sante.gov.bf',
      logo: '/assets/org/m_sante.jpg',
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 1230,
      headquarters: 'Ouagadougou, Burkina Faso',
      address: 'Avenue Kadiogo, 01 BP 7009 Ouagadougou 01',
      contactPerson: 'Direction des statistiques sanitaires',
      email: null,
      phone: null,
      aliases: ['Ministère Santé', 'DSF / Ministère Santé'],
      featuredDatasetIds: ['sante-centres-par-region', 'sante-kpi-epidemiologie'],
      linkedOrganizationSlugs: ['insd-burkina', 'menapln', 'sp-conasur']
    },
    {
      slug: 'insd-burkina',
      name: 'Institut National de la Statistique et de la Demographie (INSD)',
      shortName: 'INSD',
      type: 'institut-recherche',
      typeLabel: 'Recherche et analyse',
      description: 'Autorite statistique nationale chargee de la production, harmonisation et diffusion des donnees officielles.',
      longDescription:
        'L’INSD est l’organe central du Système Statistique National. Il consolide les informations démographiques, économiques et sociales utiles à la planification et au pilotage des politiques publiques.',
      website: 'https://www.insd.bf',
      logo: '/assets/org/insd.png',
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 1200,
      headquarters: 'Ouagadougou, Burkina Faso',
      address: 'Siege social, 01 BP 374 Ouagadougou 01',
      contactPerson: 'Direction générale - Dr. Boureima Ouedraogo',
      email: 'stats@insd.bf',
      phone: '+226 25 37 62 00',
      aliases: ['INSD Burkina'],
      featuredDatasetIds: ['ecvm-2023', 'ipc-prix-regionaux'],
      linkedOrganizationSlugs: ['ministere-sante', 'menapln', 'afristat']
    },
    {
      slug: 'menapln',
      name: 'Ministère de l’Éducation Nationale, de l’Alphabétisation et de la Promotion des Langues Nationales',
      shortName: 'MENAPLN',
      type: 'ministere',
      typeLabel: 'Administration publique',
      description: 'Suivi de la scolarisation, de l’accès numérique éducatif et des performances scolaires nationales.',
      longDescription:
        'Le MENAPLN pilote les statistiques educatives, la cartographie des ecoles ouvertes ou fermees, et la diffusion des resultats scolaires pour les cycles CEP, BEPC et Baccalaureat.',
      website: 'https://www.education.gov.bf',
      logo: '/assets/org/menapln.png',
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 740,
      headquarters: 'Ouagadougou, Burkina Faso',
      address: 'Avenue de l’Éducation, 03 BP 7133 Ouagadougou 03',
      contactPerson: 'Direction des etudes et de la planification',
      email: null,
      phone: null,
      aliases: ['MENAPLN'],
      featuredDatasetIds: ['education-ecoles-par-region', 'education-resultats-scolaires'],
      linkedOrganizationSlugs: ['insd-burkina', 'ministere-sante', 'sp-conasur']
    },
    {
      slug: 'sp-conasur',
      name: "Secrétariat Permanent du Conseil National de Secours d'Urgence et de Réhabilitation",
      shortName: 'SP/CONASUR',
      type: 'ong',
      typeLabel: 'Organisation nationale',
      description: 'Coordination des données de déplacements forcés et des indicateurs de vulnérabilité communautaire.',
      longDescription:
        'Le SP/CONASUR assure la collecte et la consolidation des informations sur les personnes déplacées internes et les zones fragilisées afin de faciliter la réponse humanitaire.',
      website: 'https://www.conasur.gov.bf',
      logo: '/assets/org/sp-conasur.png',
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 420,
      headquarters: 'Ouagadougou, Burkina Faso',
      address: 'Avenue de l Humanitaire, 11 BP 824 CMS Ouagadougou',
      contactPerson: 'Cellule information et suivi humanitaire',
      email: null,
      phone: null,
      aliases: ['SP/CONASUR'],
      featuredDatasetIds: ['population-pdi-par-region'],
      linkedOrganizationSlugs: ['insd-burkina', 'ministere-sante']
    },
    {
      slug: 'afristat',
      name: 'AFRISTAT Data Portal',
      shortName: 'AFRISTAT',
      type: 'partenaire',
      typeLabel: 'Partenaire technique',
      description: "Appui méthodologique et harmonisation régionale des indicateurs économiques et d'emploi.",
      longDescription:
        "AFRISTAT accompagne le Burkina Faso sur la standardisation des statistiques économiques, les séries d'emploi et les comparaisons régionales utiles à l'analyse macro-économique.",
      website: 'https://www.afristat.org',
      logo: null,
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 360,
      headquarters: 'Bamako / Ouagadougou',
      address: 'Point focal national AFRISTAT, Ouagadougou',
      contactPerson: 'Coordination appui statistique',
      email: null,
      phone: null,
      aliases: ['AFRISTAT'],
      featuredDatasetIds: ['economie-marche-travail-afristat'],
      linkedOrganizationSlugs: ['insd-burkina', 'menapln']
    },
    {
      slug: 'hrp-acled',
      name: 'Humanitarian Response Plan & Armed Conflict Location & Event Data Project',
      shortName: 'HRP/ACLED',
      type: 'partenaire',
      typeLabel: 'Partenaire technique',
      description: 'Consolidation et analyse des incidents de sécurité et des dynamiques de conflit pour le suivi de la stabilité nationale.',
      longDescription:
        "Le partenariat HRP-ACLED assure la collecte systématique, la vérification et la diffusion des données d'incidents sécuritaires au Burkina Faso. Ces informations géoréférencées permettent d'orienter les stratégies de sécurisation et la réponse humanitaire dans les zones affectées.",
      website: 'https://www.acleddata.com',
      logo: '/assets/org/hrp-acled.png',
      verified: true,
      updateFrequency: 'Des que possible',
      subscribers: 580,
      headquarters: 'Coordination nationale Ouagadougou',
      address: 'Cellule de coordination HRP, Ouagadougou',
      contactPerson: 'Equipe de monitoring securitaire',
      email: null,
      phone: 'null',
      aliases: ['HRP / ACLED', 'ACLED'],
      featuredDatasetIds: ['securite-incidents-hrp'],
      linkedOrganizationSlugs: ['sp-conasur']
    }
  ],
  page: {
    badge: 'Répertoire de l’autorité',
    titlePrefix: 'Gouvernance des',
    titleHighlight: 'Organisations',
    description:
      "Découvrez les entités souveraines qui alimentent l'écosystème de données national du Burkina Faso. Transparence, redevabilité et intégrité institutionnelle.",
    searchPlaceholder: 'Rechercher une institution, un ministère...',
    cta: {
      title: "Votre organisation n'est pas répertoriée ?",
      description:
        "Partagez vos jeux de données de manière sécurisée et rejoignez le répertoire institutionnel national.",
      linkLabel: "Demander l'accès"
    },
    impact: {
      title: 'Impact des Organisations',
      description:
        'Plus de {count} institutions utilisent déjà la plateforme CITADEL pour centraliser et sécuriser les actifs de données nationaux.',
      visualCaption: 'Analyse en cours',
      visualTitle: 'Centre de Contrôle National',
      highlights: [
        {
          title: '98% de precision',
          description: 'Sur les donnees validees par les institutions.'
        },
        {
          title: '{datasets} jeux publies',
          description: 'Catalogues structurels relies a des metadonnees communes.'
        }
      ]
    }
  }
}

let cachedContent = null
let pendingContentRequest = null

function normalizeContent(payload) {
  const source = payload && typeof payload === 'object' ? payload : {}
  const organizations = Array.isArray(source.organizations) ? source.organizations : DEFAULT_CONTENT.organizations

  return {
    types: Array.isArray(source.types) ? source.types : DEFAULT_CONTENT.types,
    organizations: organizations.map((item) => {
      const logoPath = typeof item.logoPath === 'string' ? item.logoPath.trim() : ''
      const logo =
        logoPath.length > 0
          ? logoPath.startsWith('http')
            ? logoPath
            : `${import.meta.env.BASE_URL}${logoPath.replace(/^\/+/, '')}`
          : null

      return {
        ...item,
        logo,
      }
    }),
    page: source.page && typeof source.page === 'object' ? source.page : DEFAULT_CONTENT.page
  }
}

export async function loadOrganizationsContent() {
  if (cachedContent) return cachedContent
  if (pendingContentRequest) return pendingContentRequest

  pendingContentRequest = fetch(ORGANIZATIONS_DATA_URL)
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      cachedContent = normalizeContent(payload)
      return cachedContent
    })
    .catch(() => {
      cachedContent = DEFAULT_CONTENT
      return cachedContent
    })
    .finally(() => {
      pendingContentRequest = null
    })

  return pendingContentRequest
}

export function useOrganizationsContent() {
  const [content, setContent] = useState(cachedContent || DEFAULT_CONTENT)
  const [loading, setLoading] = useState(!cachedContent)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    loadOrganizationsContent()
      .then((loaded) => {
        if (!active) return
        setContent(loaded)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        setError(err)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return useMemo(() => ({ content, loading, error }), [content, loading, error])
}

function normalizeString(value) {
  return String(value || '').trim().toLowerCase()
}

function matchOrganization(datasetOrg, aliases) {
  const normalized = normalizeString(datasetOrg)
  return aliases.some((alias) => normalizeString(alias) === normalized)
}

export function getAllOrganizations(content) {
  return content && Array.isArray(content.organizations) ? content.organizations : DEFAULT_CONTENT.organizations
}

export function getOrganizationBySlug(content, slug) {
  return getAllOrganizations(content).find((item) => item.slug === slug) || null
}

export function getOrganizationDatasets(content, slug) {
  const org = getOrganizationBySlug(content, slug)
  if (!org) return []

  return DATASETS.filter((dataset) => matchOrganization(dataset.organization, org.aliases))
}

export function getOrganizationDatasetCount(content, slug) {
  return getOrganizationDatasets(content, slug).length
}

export function getOrganizationFeaturedDatasets(content, slug) {
  const org = getOrganizationBySlug(content, slug)
  if (!org) return []

  const datasetById = new Map(DATASETS.map((item) => [item.id, item]))
  const explicit = (org.featuredDatasetIds || [])
    .map((id) => datasetById.get(id))
    .filter(Boolean)

  if (explicit.length > 0) return explicit.slice(0, 2)
  return getOrganizationDatasets(content, slug).slice(0, 2)
}

export function getOrganizationLinkedInstitutions(content, slug) {
  const org = getOrganizationBySlug(content, slug)
  if (!org) return []

  return (org.linkedOrganizationSlugs || [])
    .map((linkedSlug) => getOrganizationBySlug(content, linkedSlug))
    .filter(Boolean)
}

export function getOrganizationTypes(content) {
  return content && Array.isArray(content.types) ? content.types : DEFAULT_CONTENT.types
}

export function getOrganizationsPageContent(content) {
  return content && content.page ? content.page : DEFAULT_CONTENT.page
}

export const ORGANIZATION_IMPACT_IMAGE = mapPreview
