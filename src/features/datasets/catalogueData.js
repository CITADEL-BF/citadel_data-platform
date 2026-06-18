export const DATASETS = [
  {
    id: 'ecvm-2023',
    title: 'Enquete sur les Conditions de Vie des Menages (ECVM) - 2023',
    description: 'Apercu socio-economique des menages: revenus, depenses, acces aux services essentiels et vulnerabilites territoriales.',
    domain: 'population',
    domainLabel: 'Population',
    organization: 'INSD Burkina',
    region: 'National',
    format: 'CSV/JSON',
    status: 'vérifié',
    updatedLabel: 'il y a 1 mois',
    updatedAt: '2026-05-24',
    rows: 15240,
    variables: 42,
    sizeMb: 4.2,
    license: 'Creative Commons Attribution 4.0',
    coverage: 'National (13 regions)',
    collectionPeriod: 'Jan - Oct 2023',
    methodology: 'Face-a-face CAPI',
    apiPath: '/api/v1/datasets/ecvm-2023',
    contact: 'contact@insd.bf',
    downloads: [
      { label: 'CSV principal', href: 'data/viz/csv/population_vulnerabilite_menages.csv', size: '2.4 MB' },
      { label: 'JSON structure', href: 'data/viz/json/population/vulnerabilite_menages.json', size: '0.9 MB' },
      { label: 'CSV regional', href: 'data/viz/csv/population_vulnerabilite_regionale.csv', size: '0.3 MB' }
    ],
    quickSeries: {
      categories: ['2018', '2019', '2020', '2021', '2022', '2023'],
      values: [41.8, 42.3, 44.1, 43.2, 45.4, 46.8],
      unit: '%'
    },
    sample: [
      { id: 'BF-23-001', region: 'Centre', residence: 'Urbain', taille: 4, statut: 'Non-pauvre', poids: 284.21 },
      { id: 'BF-23-002', region: 'Hauts-Bassins', residence: 'Rural', taille: 7, statut: 'Pauvre', poids: 192.55 },
      { id: 'BF-23-003', region: 'Sahel', residence: 'Rural', taille: 12, statut: 'Extrême pauvreté', poids: 88.10 },
      { id: 'BF-23-004', region: 'Centre-Est', residence: 'Urbain', taille: 5, statut: 'Non-pauvre', poids: 312.44 }
    ]
  },
  {
    id: 'ipc-prix-regionaux',
    title: 'Indice des Prix a la Consommation (IPC)',
    description: "Suivi mensuel de l'inflation par denrée et par région.",
    domain: 'economie',
    domainLabel: 'Économie',
    organization: 'INSD Burkina',
    region: 'National',
    format: 'CSV/JSON',
    status: 'actif',
    updatedLabel: 'Il y a 1 mois',
    updatedAt: '2026-05-24',
    rows: 9200,
    variables: 16,
    sizeMb: 1.9,
    license: 'CC BY 4.0',
    coverage: '13 regions',
    collectionPeriod: 'Mensuel 2020-2026',
    methodology: 'Compilation IPC INSD',
    apiPath: '/api/v1/datasets/ipc-prix-regionaux',
    contact: 'stats@insd.bf',
    downloads: [
      { label: 'CSV prix alimentaires', href: 'data/viz/csv/economie_prix_alimentaires.csv', size: '1.1 MB' },
      { label: 'CSV prix par région', href: 'data/viz/csv/economie_prix_par_region.csv', size: '0.6 MB' }
    ],
    quickSeries: {
      categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin'],
      values: [102.4, 103.1, 104.2, 104.0, 105.3, 106.1],
      unit: 'index'
    },
    sample: [
      { id: 'IPC-001', region: 'Centre', residence: 'Urbain', taille: 0, statut: 'Inflation modérée', poids: 104.0 }
    ]
  },
  {
    id: 'education-ecoles-par-region',
    title: 'État des Écoles par Région',
    description: 'Écoles ouvertes, fermées et réouvertes par région administrative.',
    domain: 'education',
    domainLabel: 'Éducation',
    organization: 'MENAPLN',
    region: 'National',
    format: 'CSV/GeoJSON',
    status: 'actif',
    updatedLabel: 'il y a 3 semaines',
    updatedAt: '2026-05-26',
    rows: 780,
    variables: 12,
    sizeMb: 0.8,
    license: 'CC BY 4.0',
    coverage: '13 regions',
    collectionPeriod: 'Mensuel 2024-2026',
    methodology: 'Consolidation des inspections academiques',
    apiPath: '/api/v1/datasets/education-ecoles-par-region',
    contact: 'data@menapln.gov.bf',
    downloads: [
      { label: 'CSV écoles par région', href: 'data/viz/csv/education_ecoles_par_region.csv', size: '0.2 MB' },
      { label: 'GeoJSON points ecoles', href: 'data/viz/geojson/bfa_adminpoints.geojson', size: '1.4 MB' }
    ],
    quickSeries: {
      categories: ['2021', '2022', '2023', '2024', '2025', '2026'],
      values: [86.2, 84.7, 82.3, 81.5, 83.9, 85.1],
      unit: '% ouvertes'
    },
    sample: [
      { id: 'EDU-001', region: 'Sahel', residence: 'Rural', taille: 0, statut: 'Fermée', poids: 0 }
    ]
  },
  {
    id: 'sante-centres-par-region',
    title: 'Localisation des Centres de Santé (CSPS)',
    description: 'Disponibilité des centres de santé fonctionnels et couverture régionale.',
    domain: 'sante',
    domainLabel: 'Santé',
    organization: 'Ministère Santé',
    region: 'National',
    format: 'CSV/GeoJSON',
    status: 'actif',
    updatedLabel: 'Il y a 1 mois',
    updatedAt: '2026-04-28',
    rows: 530,
    variables: 10,
    sizeMb: 1.2,
    license: 'CC BY 4.0',
    coverage: '13 regions',
    collectionPeriod: 'Annee 2025',
    methodology: 'Inventaire formations sanitaires',
    apiPath: '/api/v1/datasets/sante-centres-par-region',
    contact: 'open.data@sante.gov.bf',
    downloads: [
      { label: 'CSV centres par région', href: 'data/viz/csv/sante_centres_par_region.csv', size: '0.3 MB' },
      { label: 'GeoJSON accessibilite', href: 'data/viz/geojson/sante_carte_accessibilite.geojson', size: '0.8 MB' }
    ],
    quickSeries: {
      categories: ['2021', '2022', '2023', '2024', '2025'],
      values: [71.2, 73.4, 75.0, 76.1, 77.8],
      unit: '% couverture'
    },
    sample: [
      { id: 'SAN-001', region: 'Nord', residence: 'Mixte', taille: 0, statut: 'Fonctionnel', poids: 1 }
    ]
  },
  {
    id: 'securite-incidents-hrp',
    title: 'Incidents Sécuritaires HRP (mensuel)',
    description: 'Incidents par région, province et typologie pour le suivi de stabilité.',
    domain: 'securite',
    domainLabel: 'Sécurité',
    organization: 'HRP / ACLED',
    region: 'National',
    format: 'CSV/JSON',
    status: 'sensible',
    updatedLabel: 'Il y a 5 jours',
    updatedAt: '2026-05-21',
    rows: 46980,
    variables: 18,
    sizeMb: 7.6,
    license: 'Usage analytique CITADEL',
    coverage: 'Regions et provinces',
    collectionPeriod: '1997-2026',
    methodology: 'Consolidation HRP + ACLED',
    apiPath: '/api/v1/datasets/securite-incidents-hrp',
    contact: 'coordination@citadel.bf',
    downloads: [
      { label: 'CSV incidents mensuels', href: 'data/viz/csv/securite_incidents_hrp_mensuel.csv', size: '3.4 MB' },
      { label: 'CSV incidents regionaux', href: 'data/viz/csv/securite_incidents_par_region_total.csv', size: '0.4 MB' }
    ],
    quickSeries: {
      categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin'],
      values: [410, 438, 399, 442, 468, 452],
      unit: 'incidents'
    },
    sample: [
      { id: 'SEC-001', region: 'Sahel', residence: 'N/A', taille: 0, statut: 'Violence politique', poids: 66 }
    ]
  },
  {
    id: 'population-pdi-par-region',
    title: 'Personnes Déplacées Internes par Région',
    description: 'Volume annuel de PDI avec comparaison regionale et historique IDMC.',
    domain: 'population',
    domainLabel: 'Population',
    organization: 'SP/CONASUR',
    region: 'National',
    format: 'CSV/JSON',
    status: 'vérifié',
    updatedLabel: 'Il y a 3 jours',
    updatedAt: '2026-05-23',
    rows: 1040,
    variables: 9,
    sizeMb: 0.7,
    license: 'CC BY 4.0',
    coverage: '8 régions documentées',
    collectionPeriod: '2016-2024',
    methodology: 'Consolidation SP/CONASUR + IDMC',
    apiPath: '/api/v1/datasets/population-pdi-par-region',
    contact: 'open.data@conasur.gov.bf',
    downloads: [
      { label: 'CSV PDI par région', href: 'data/viz/csv/population_pdi_par_region.csv', size: '0.1 MB' },
      { label: 'JSON courbe PDI', href: 'data/viz/json/population/courbe_pdi.json', size: '0.1 MB' }
    ],
    quickSeries: {
      categories: ['2019', '2020', '2021', '2022', '2023', '2024'],
      values: [520000, 698000, 1060000, 1440000, 1890000, 2063000],
      unit: 'personnes'
    },
    sample: [
      { id: 'PDI-001', region: 'Nord', residence: 'N/A', taille: 0, statut: 'PDI', poids: 154280 }
    ]
  },
  {
    id: 'education-resultats-scolaires',
    title: 'Resultats Scolaires CEP-BEPC-BAC',
    description: 'Taux de réussite et volumes présents/admis par cycle scolaire.',
    domain: 'education',
    domainLabel: 'Éducation',
    organization: 'MENAPLN',
    region: 'National',
    format: 'CSV',
    status: 'actif',
    updatedLabel: 'Il y a 1 semaine',
    updatedAt: '2026-05-18',
    rows: 630,
    variables: 11,
    sizeMb: 0.4,
    license: 'CC BY 4.0',
    coverage: 'National + regional',
    collectionPeriod: '2018-2025',
    methodology: 'Extraction statistiques ministerielles',
    apiPath: '/api/v1/datasets/education-resultats-scolaires',
    contact: 'data@menapln.gov.bf',
    downloads: [
      { label: 'CSV indicateurs education', href: 'data/viz/csv/education_indicateurs.csv', size: '0.4 MB' }
    ],
    quickSeries: {
      categories: ['2019', '2020', '2021', '2022', '2023', '2024'],
      values: [51.2, 49.8, 52.6, 55.1, 57.4, 59.0],
      unit: '% reussite'
    },
    sample: [
      { id: 'RES-001', region: 'Centre', residence: 'N/A', taille: 0, statut: 'CEP', poids: 59.0 }
    ]
  },
  {
    id: 'economie-marche-travail-afristat',
    title: 'Marche du Travail AFRISTAT',
    description: 'Taux d’activité, emploi, part salariée et main d’œuvre féminine.',
    domain: 'economie',
    domainLabel: 'Économie',
    organization: 'AFRISTAT',
    region: 'National',
    format: 'CSV/JSON',
    status: 'vérifié',
    updatedLabel: 'Il y a 6 jours',
    updatedAt: '2026-05-20',
    rows: 1180,
    variables: 14,
    sizeMb: 0.9,
    license: 'CC BY 4.0',
    coverage: 'National',
    collectionPeriod: '2010-2025',
    methodology: 'Harmonisation AFRISTAT',
    apiPath: '/api/v1/datasets/economie-marche-travail-afristat',
    contact: 'support@afristat.org',
    downloads: [
      { label: 'CSV marche du travail', href: 'data/viz/csv/economie_marche_travail_afristat.csv', size: '0.5 MB' },
      { label: 'JSON taux emploi', href: 'data/viz/json/economie/serie_taux_emploi.json', size: '0.2 MB' }
    ],
    quickSeries: {
      categories: ['2020', '2021', '2022', '2023', '2024', '2025'],
      values: [58.4, 59.1, 60.5, 61.2, 62.0, 62.4],
      unit: '% emploi'
    },
    sample: [
      { id: 'EMP-001', region: 'National', residence: 'N/A', taille: 0, statut: 'Taux emploi', poids: 62.4 }
    ]
  },
  {
    id: 'sante-kpi-epidemiologie',
    title: 'Indicateurs Epidémiologiques Prioritaires',
    description: 'Synthèse des cas, décès et alertes sur les maladies sous surveillance.',
    domain: 'sante',
    domainLabel: 'Santé',
    organization: 'DSF / Ministère Santé',
    region: 'National',
    format: 'CSV/JSON',
    status: 'actif',
    updatedLabel: 'Hier',
    updatedAt: '2026-05-25',
    rows: 420,
    variables: 8,
    sizeMb: 0.3,
    license: 'CC BY 4.0',
    coverage: 'National',
    collectionPeriod: 'Hebdomadaire',
    methodology: 'Surveillance sentinelle',
    apiPath: '/api/v1/datasets/sante-kpi-epidemiologie',
    contact: 'veille@sante.gov.bf',
    downloads: [
      { label: 'CSV KPI epidemiologie', href: 'data/viz/csv/sante_kpi_epidemiologie.csv', size: '0.2 MB' }
    ],
    quickSeries: {
      categories: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      values: [110, 98, 127, 115, 109, 102],
      unit: 'cas'
    },
    sample: [
      { id: 'EPI-001', region: 'Boucle du Mouhoun', residence: 'N/A', taille: 0, statut: 'Paludisme', poids: 102 }
    ]
  },
  {
    id: 'securite-series-annuelles',
    title: 'Series Annuelles Incidents de Sécurité',
    description: 'Séries consolidées des incidents et typologies d’attaque par année.',
    domain: 'securite',
    domainLabel: 'Sécurité',
    organization: 'SP/CONASUR',
    region: 'National',
    format: 'CSV',
    status: 'sensible',
    updatedLabel: 'Il y a 8 jours',
    updatedAt: '2026-05-18',
    rows: 300,
    variables: 7,
    sizeMb: 0.2,
    license: 'CC BY-NC 4.0',
    coverage: 'National + regional',
    collectionPeriod: '2016-2026',
    methodology: 'Harmonisation multi-sources',
    apiPath: '/api/v1/datasets/securite-series-annuelles',
    contact: 'open.data@conasur.gov.bf',
    downloads: [
      { label: 'CSV series annuelles', href: 'data/viz/csv/securite_series_annuelles.csv', size: '0.2 MB' }
    ],
    quickSeries: {
      categories: ['2019', '2020', '2021', '2022', '2023', '2024'],
      values: [2840, 3120, 3448, 3650, 3880, 4022],
      unit: 'incidents'
    },
    sample: [
      { id: 'ANN-001', region: 'Est', residence: 'N/A', taille: 0, statut: 'Conflit', poids: 4022 }
    ]
  },
  {
    id: 'population-pyramide-ages',
    title: 'Pyramide Demographique Nationale',
    description: 'Distribution hommes/femmes par tranche d’âge (INSD 2019).',
    domain: 'population',
    domainLabel: 'Population',
    organization: 'INSD Burkina',
    region: 'National',
    format: 'CSV/JSON',
    status: 'vérifié',
    updatedLabel: 'Il y a 4 jours',
    updatedAt: '2026-05-22',
    rows: 170,
    variables: 6,
    sizeMb: 0.2,
    license: 'CC BY 4.0',
    coverage: 'National',
    collectionPeriod: 'Reference 2019',
    methodology: 'Projection demographique INSD',
    apiPath: '/api/v1/datasets/population-pyramide-ages',
    contact: 'stats@insd.bf',
    downloads: [
      { label: 'CSV pyramide des ages', href: 'data/viz/csv/population_pyramide_ages.csv', size: '0.1 MB' }
    ],
    quickSeries: {
      categories: ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29'],
      values: [17.2, 16.8, 15.9, 14.1, 12.7, 11.5],
      unit: '%'
    },
    sample: [
      { id: 'DEM-001', region: 'National', residence: 'N/A', taille: 0, statut: '15-19', poids: 14.1 }
    ]
  }
]

export const DOMAIN_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'economie', label: 'Economie' },
  { value: 'population', label: 'Population' },
  { value: 'education', label: 'Education' },
  { value: 'sante', label: 'Sante' },
  { value: 'securite', label: 'Sécurité' }
]

export const REGION_OPTIONS = [
  'National',
  'Boucle du Mouhoun',
  'Cascades',
  'Centre',
  'Centre-Est',
  'Centre-Nord',
  'Centre-Ouest',
  'Centre-Sud',
  'Est',
  'Hauts-Bassins',
  'Nord',
  'Plateau-Central',
  'Sahel',
  'Sud-Ouest'
]

export const DOMAIN_STYLES = {
  economie: { bg: 'rgba(117, 91, 0, 0.14)', color: '#6a5100' },
  population: { bg: 'rgba(46, 125, 50, 0.14)', color: '#1d6f31' },
  education: { bg: 'rgba(21, 101, 192, 0.14)', color: '#1254a8' },
  sante: { bg: 'rgba(175, 0, 18, 0.12)', color: '#9b0010' },
  securite: { bg: 'rgba(175, 0, 18, 0.18)', color: '#8b0010' }
}

export function getDatasetById(datasetId) {
  return DATASETS.find((item) => item.id === datasetId) || null
}

export function getRelatedDatasets(datasetId, max = 3) {
  const current = getDatasetById(datasetId)
  if (!current) return []

  return DATASETS.filter((item) => item.id !== datasetId && (item.domain === current.domain || item.organization === current.organization)).slice(0, max)
}
