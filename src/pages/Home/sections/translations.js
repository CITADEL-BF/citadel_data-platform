// Traductions centralisées pour toutes les sections de la HomePage

export const TRANSLATIONS = {
  fr: {
    hero: {
      badge: 'Plateforme nationale · Burkina Faso',
      title: 'Portail National de Données',
      titleAccent: 'pour la Décision Publique',
      tagline: 'La plateforme CITADEL centralise les jeux de données stratégiques du Burkina Faso pour soutenir la gouvernance basée sur l\'évidence et la prise de décision publique.',
      searchPlaceholder: 'Rechercher datasets, organisations, indicateurs...',
      searchAriaLabel: 'Rechercher dans la plateforme',
      searchButton: 'Explorer les données',
      quickAccessLabel: 'Accès rapide :',
      coverage: 'ensembles de données provenant de',
      coverageAgencies: 'agences nationales et de portails officiels',
      modules: [
        { label: 'Sécurité', to: '/visualisations/securite' },
        { label: 'Population & PDI', to: '/visualisations/population' },
        { label: 'Éducation', to: '/visualisations/education' },
        { label: 'Économie & Emploi', to: '/visualisations/economie' },
        { label: 'Santé', to: '/visualisations/sante' },
      ],
    },
    modules: {
      title: '[DOMAINES CLÉS]',
      ariaLabel: 'Axes stratégiques et modules thématiques',
      cta: 'VOIR LE DOMAINE',
      items: [
        {
          id: 'securite',
          label: 'Sécurité',
          desc: 'Analyse prédictive des zones de conflit et surveillance de l\'intégrité territoriale.',
        },
        {
          id: 'population',
          label: 'Population & PDI',
          desc: 'Gestion des flux migratoires et des personnes déplacées internes.',
        },
        {
          id: 'education',
          label: 'Éducation',
          desc: 'Suivi des taux de scolarisation et déploiement des infrastructures scolaires.',
        },
        {
          id: 'economie',
          label: 'Économie & Emploi',
          desc: 'PIB, indicateurs de croissance et marchés de l\'emploi nationaux.',
        },
        {
          id: 'sante',
          label: 'Santé',
          desc: 'Cartographie sanitaire et gestion des épidémies régionales.',
        },
      ],
    },
    status: {
      ariaLabel: 'Indicateurs clés de la plateforme',
      items: [
        { label: 'Datasets disponibles', value: '147' },
        { label: 'En cours de validation', value: '12' },
        { label: 'Dernière mise à jour', value: '17 juin 2026' },
        { label: 'API publique', value: 'Non disponible' },
      ],
    },
    methodology: {
      title: '[Sources & Méthodologie]',
      desc: 'Un protocole rigoureux en quatre étapes garantit la fiabilité et la traçabilité de chaque donnée hébergée sur la plateforme CITADEL.',
      ariaLabel: 'Sources et méthodologie CITADEL',
      steps: [
        {
          num: '01',
          title: 'Extraction',
          desc: 'Collecte automatisée depuis les portails officiels (INSD, OCHA, FAO, Banque mondiale) via scripts Python certifiés. Chaque jeu de données est horodaté et versionné à la récupération.',
        },
        {
          num: '02',
          title: 'Nettoyage & Validation',
          desc: 'Dédoublonnage par clé (région, indicateur, année), harmonisation des libellés régionaux, détection des valeurs aberrantes par seuil IQR, et audit croisé par des experts thématiques nationaux.',
        },
        {
          num: '03',
          title: 'Sources principales',
          sources: [
            { label: 'INSD', full: 'Institut National de la Statistique et de la Démographie' },
            { label: 'OCHA', full: 'Bureau de la coordination des affaires humanitaires — ONU' },
            { label: 'FAO', full: 'Organisation des Nations Unies pour l\'alimentation et l\'agriculture' },
            { label: 'AFRISTAT', full: 'Observatoire économique et statistique d\'Afrique subsaharienne' },
            { label: 'Banque mondiale', full: 'Open Data World Bank — indicateurs développement' },
            { label: 'PNUD / OCHA HDX', full: 'Humanitarian Data Exchange — données crises et PDI' },
          ],
        },
        {
          num: '04',
          title: 'Licences & Accès',
          desc: 'Les données CITADEL sont distribuées sous licence Creative Commons CC BY 4.0 (attribution requise). Les sources institutionnelles conservent leurs droits d\'origine. L\'API publique est accessible sans authentification pour les endpoints agrégés.',
          badge: 'CC BY 4.0',
        },
      ],
    },
    citadel: {
      title: '[CITADEL]',
      subtitle: 'Centre d\'Excellence Interdisciplinaire en Intelligence Artificielle pour le Développement.',
      ariaLabel: 'Présentation CITADEL',
      sliderAriaLabel: 'Slider CITADEL',
      prevSlide: 'Slide précédent',
      nextSlide: 'Slide suivant',
      dotsAriaLabel: 'Navigation des slides',
      ctaButton: 'Visitez le site',
      ctaAriaLabel: 'Visitez le site officiel de la CITADEL',
      slides: {
        labels: [
          'Présentation CITADEL',
          'Mission',
          'Axes stratégiques de recherche',
          'Activités',
          'Partenaires',
          'Membres',
        ],
        slide1: {
          alt: 'Vue de la CITADEL',
          line1: 'Au CITADEL :',
          line2: 'Nous construisons les talents et les capacités en IA',
          line3: 'du Burkina Faso et de l\'Afrique.',
        },
        slide2: {
          title: 'Mission',
          desc: 'Notre ambition est de compléter les initiatives existantes en développant davantage les compétences techniques sur les architectures algorithmiques, les processus d\'apprentissage et les applications concrètes, dans un centre d\'excellence interdisciplinaire capable d\'accompagner les défis du développement de l\'IA.',
          missions: [
            {
              title: '01.RECHERCHE',
              desc: 'Mettre en œuvre l\'ensemble des théories et des techniques en vue de rendre des machines capables de simuler l\'intelligence humaine.',
            },
            {
              title: '02.INNOVATION',
              desc: 'Amplifier les talents africains de l\'IA.',
            },
            {
              title: '03.DÉVELOPPEMENT',
              desc: 'Utiliser l\'intelligence artificielle comme levier de développement.',
            },
          ],
        },
        slide3: {
          alt: 'Axes stratégiques de recherche',
        },
        slide4: {
          title: 'Activités',
          alt: 'Projets CITADEL',
          activities: [
            {
              title: 'ANALYSER',
              desc: 'l\'état de l\'art de la recherche fondamentale en IA, avec une perspective locale africaine.',
            },
            {
              title: 'FORMER',
              desc: 'en considérant les couches sociales les moins représentées, notamment la question du genre, pour dynamiser l\'industrie locale de l\'IA.',
            },
            {
              title: 'COORDONNER',
              desc: 'de manière holistique sur la mise en œuvre et le déploiement de modèles d\'IA dans des applications concrètes contextualisées.',
            },
            {
              title: 'DÉMONTRER',
              desc: 'de manière systématique les risques de l\'IA afin d\'informer les pouvoirs publics et la société civile sur les insuffisances des régulations locales.',
            },
          ],
        },
        slide5: {
          title: 'Partenaires',
          morePartners: 'Voir plus de partenaires',
          morePartnersAriaLabel: 'Voir plus de partenaires',
        },
        slide6: {
          title: 'Membres',
          members: [
            { line1: 'Dr. Tégawendé F. BISSYANDÉ', line2: 'Chercheur principal' },
            { line1: 'Dr. Aminata ZERBO/SABANE', line2: 'Adjointe au chercheur principal' },
            { line1: 'Teg-Wendé Idriss TINTO', line2: 'Responsable du transfert de technologie' },
            { line1: 'Dr. Serge A. SAWADOGO', line2: 'Leader/Co-lead' },
            { line1: 'Pr. François ZOUGOUMORÉ', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Tizane DAHO', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Inoussa TRAORE', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Tiaté NOUFÈ', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Yacouba N. NACAMBO', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Rodrique KAFANDO', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Abdoul Kader KABORÉ', line2: 'Leader/Co-lead' },
          ],
        },
      },
    },
    map: {
      ariaLabel: 'Concentration des données par région',
      mapAriaLabel: 'Carte du Burkina Faso — visualisation des données par région',
      selectorLabel: 'SÉLECTEUR DE RÉGION',
      allRegions: 'Toutes les régions',
      svgAriaLabel: 'Carte des régions du Burkina Faso',
      regionDefaultLabel: 'Région',
      zoomControls: 'Contrôles de zoom de la carte',
      zoomIn: 'Zoomer',
      zoomOut: 'Dézoomer',
      dataTitle: '[Concentration des Données]',
      dataSubtitle: 'Score mixte par région : couverture des fichiers + volume d\'observations valides.',
      score: 'score',
      observations: 'observations valides',
      indicators: 'indicateurs',
      files: 'fichiers',
    },
  },
  en: {
    hero: {
      badge: 'National Platform · Burkina Faso',
      title: 'National Data Portal',
      titleAccent: 'for Public Decision-Making',
      tagline: 'The CITADEL platform centralizes Burkina Faso\'s strategic datasets to support evidence-based governance and public decision-making.',
      searchPlaceholder: 'Search datasets, organizations, indicators...',
      searchAriaLabel: 'Search the platform',
      searchButton: 'Explore data',
      quickAccessLabel: 'Quick access:',
      coverage: 'datasets from',
      coverageAgencies: 'national agencies and official portals',
      modules: [
        { label: 'Security', to: '/visualisations/securite' },
        { label: 'Population & IDP', to: '/visualisations/population' },
        { label: 'Education', to: '/visualisations/education' },
        { label: 'Economy & Employment', to: '/visualisations/economie' },
        { label: 'Health', to: '/visualisations/sante' },
      ],
    },
    modules: {
      title: '[KEY DOMAINS]',
      ariaLabel: 'Strategic axes and thematic modules',
      cta: 'VIEW DOMAIN',
      items: [
        {
          id: 'securite',
          label: 'Security',
          desc: 'Predictive analysis of conflict zones and monitoring of territorial integrity.',
        },
        {
          id: 'population',
          label: 'Population & IDP',
          desc: 'Management of migration flows and internally displaced persons.',
        },
        {
          id: 'education',
          label: 'Education',
          desc: 'Monitoring of enrollment rates and deployment of school infrastructure.',
        },
        {
          id: 'economie',
          label: 'Economy & Employment',
          desc: 'GDP, growth indicators and national labor markets.',
        },
        {
          id: 'sante',
          label: 'Health',
          desc: 'Health mapping and management of regional epidemics.',
        },
      ],
    },
    status: {
      ariaLabel: 'Key platform indicators',
      items: [
        { label: 'Available datasets', value: '147' },
        { label: 'Under validation', value: '12' },
        { label: 'Last update', value: 'June 17, 2026' },
        { label: 'Public API', value: 'Not available' },
      ],
    },
    methodology: {
      title: '[Sources & Methodology]',
      desc: 'A rigorous four-step protocol ensures the reliability and traceability of every piece of data hosted on the CITADEL platform.',
      ariaLabel: 'CITADEL sources and methodology',
      steps: [
        {
          num: '01',
          title: 'Extraction',
          desc: 'Automated collection from official portals (INSD, OCHA, FAO, World Bank) via certified Python scripts. Each dataset is timestamped and versioned upon retrieval.',
        },
        {
          num: '02',
          title: 'Cleaning & Validation',
          desc: 'Deduplication by key (region, indicator, year), harmonization of regional labels, detection of outliers by IQR threshold, and cross-audit by national thematic experts.',
        },
        {
          num: '03',
          title: 'Main sources',
          sources: [
            { label: 'INSD', full: 'National Institute of Statistics and Demography' },
            { label: 'OCHA', full: 'Office for the Coordination of Humanitarian Affairs — UN' },
            { label: 'FAO', full: 'Food and Agriculture Organization of the United Nations' },
            { label: 'AFRISTAT', full: 'Economic and Statistical Observatory of Sub-Saharan Africa' },
            { label: 'World Bank', full: 'Open Data World Bank — development indicators' },
            { label: 'UNDP / OCHA HDX', full: 'Humanitarian Data Exchange — crisis and IDP data' },
          ],
        },
        {
          num: '04',
          title: 'Licenses & Access',
          desc: 'CITADEL data is distributed under Creative Commons CC BY 4.0 license (attribution required). Institutional sources retain their original rights. Public API is accessible without authentication for aggregated endpoints.',
          badge: 'CC BY 4.0',
        },
      ],
    },
    citadel: {
      title: '[CITADEL]',
      subtitle: 'Interdisciplinary Centre of Excellence in Artificial Intelligence for Development.',
      ariaLabel: 'CITADEL presentation',
      sliderAriaLabel: 'CITADEL Slider',
      prevSlide: 'Previous slide',
      nextSlide: 'Next slide',
      dotsAriaLabel: 'Slide navigation',
      ctaButton: 'Visit website',
      ctaAriaLabel: 'Visit CITADEL official website',
      slides: {
        labels: [
          'CITADEL Presentation',
          'Mission',
          'Strategic research axes',
          'Activities',
          'Partners',
          'Members',
        ],
        slide1: {
          alt: 'View of CITADEL',
          line1: 'At CITADEL:',
          line2: 'We build AI talents and capabilities',
          line3: 'for Burkina Faso and Africa.',
        },
        slide2: {
          title: 'Mission',
          desc: 'Our ambition is to complement existing initiatives by further developing technical skills in algorithmic architectures, learning processes and concrete applications, in an interdisciplinary center of excellence capable of supporting the challenges of AI development.',
          missions: [
            {
              title: '01.RESEARCH',
              desc: 'Implement all theories and techniques to make machines capable of simulating human intelligence.',
            },
            {
              title: '02.INNOVATION',
              desc: 'Amplify African AI talent.',
            },
            {
              title: '03.DEVELOPMENT',
              desc: 'Use artificial intelligence as a lever for development.',
            },
          ],
        },
        slide3: {
          alt: 'Strategic research axes',
        },
        slide4: {
          title: 'Activities',
          alt: 'CITADEL projects',
          activities: [
            {
              title: 'ANALYZE',
              desc: 'the state of the art of fundamental AI research, with a local African perspective.',
            },
            {
              title: 'TRAIN',
              desc: 'considering the least represented social groups, particularly gender issues, to boost the local AI industry.',
            },
            {
              title: 'COORDINATE',
              desc: 'holistically on the implementation and deployment of AI models in concrete contextualized applications.',
            },
            {
              title: 'DEMONSTRATE',
              desc: 'systematically the risks of AI to inform public authorities and civil society about the shortcomings of local regulations.',
            },
          ],
        },
        slide5: {
          title: 'Partners',
          morePartners: 'See more partners',
          morePartnersAriaLabel: 'See more partners',
        },
        slide6: {
          title: 'Members',
          members: [
            { line1: 'Dr. Tégawendé F. BISSYANDE', line2: 'Principal Researcher' },
            { line1: 'Dr. Aminata ZERBO/SABANE', line2: 'Deputy Principal Researcher' },
            { line1: 'Teg-Wende Idriss TINTO', line2: 'Head of Technology Transfer' },
            { line1: 'Dr. Serge A. Sawadogo', line2: 'Leader/Co-lead' },
            { line1: 'Pr. François Zougmoré', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Tizane Daho', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Inoussa Traoré', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Tiaté Noufè', line2: 'Leader/Co-lead' },
            { line1: 'Dr. Yacouba N. Nacambo', line2: 'Leader/Co-lead' },
          ],
        },
      },
    },
    map: {
      ariaLabel: 'Data concentration by region',
      mapAriaLabel: 'Map of Burkina Faso — regional data visualization',
      selectorLabel: 'REGION SELECTOR',
      allRegions: 'All regions',
      svgAriaLabel: 'Map of Burkina Faso regions',
      regionDefaultLabel: 'Region',
      zoomControls: 'Map zoom controls',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      dataTitle: '[Data Concentration]',
      dataSubtitle: 'Mixed score by region: file coverage + volume of valid observations.',
      score: 'score',
      observations: 'valid observations',
      indicators: 'indicators',
      files: 'files',
    },
  },
}
