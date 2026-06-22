import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './FAQPage.css'

// Données FAQ organisées par sections
const FAQ_SECTIONS = [
  {
    id: 'general',
    title: 'Questions Générales',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
    questions: [
      {
        q: 'Qu\'est-ce que le Portail de données CITADEL Data Platform ?',
        a: `Le Portail CITADEL data.citadel.bf est une plateforme numérique de visualisation et d'analyse de données multisectorielles au Burkina Faso. 
        Il centralise des données harmonisées sur la population, l'éducation, la santé, l'économie et la sécurité, 
        permettant aux décideurs, chercheurs et organisations de prendre des décisions éclairées basées sur des données fiables et à jour.`
      },
      {
        q: 'Qui peut utiliser cette plateforme ?',
        a: `La plateforme est accessible à plusieurs profils d'utilisateurs :
        • Chercheurs et universitaires pour l'analyse et la recherche
        • Décideurs publics pour le pilotage des politiques
        • Organisations internationales et ONG pour la planification de projets
        • Journalistes et médias pour des reportages factuels
        • Citoyens intéressés par les données publiques
        
        Certaines fonctionnalités avancées (contribution de données, téléchargement en masse) nécessitent une inscription et une adhésion à une organisation partenaire.`
      },
      {
        q: 'Les données sont-elles gratuites ?',
        a: `Oui, la consultation et la visualisation des données sont entièrement gratuites. Le téléchargement des données ouvertes est également gratuit. 
        Pour contribuer des données ou accéder à des jeux de données spécifiques sous licence restrictive, une adhésion organisationnelle peut être requise.`
      },
      {
        q: 'Quelle est la fréquence de mise à jour des données ?',
        a: `La fréquence de mise à jour varie selon les domaines, les sources, et les jeux de données disponibles.
        Pour le moment, c'est l'equipe de CITADEL qui gère les mises à jour.
        Nous nous efforçons de maintenir les données aussi fraîches que possible, avec des mises à jour régulières selon les disponibilités des sources. 
        Pour les prochaines du site, il sera permis aux contributeurs de gérer eux-mêmes les mises à jour de leurs données.`
      },
      {
        q: 'Comment puis-je citer les données dans mes travaux ?',
        a: `Chaque jeu de données dispose d'une référence bibliographique recommandée disponible sur sa page de détail. 
        Format général : CITADEL Data Platform (2026). [Titre du jeu de données]. Burkina Faso. https://citadel.bf/donnees/[dataset-id]
        
        Pensez également à citer les sources originales des données mentionnées dans les métadonnées.`
      }
    ]
  },
  {
    id: 'navigation',
    title: 'Navigation sur le Portail',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
      </svg>
    ),
    questions: [
      {
        q: 'Comment explorer les visualisations disponibles ?',
        a: `Accédez à la page Visualisations via le menu principal. Vous y trouverez :
        • Une barre latérale avec les 5 domaines thématiques (Population, Éducation, Santé, Économie, Sécurité)
        • Un système de filtres pour affiner par région administrative, période temporelle et indicateurs
        • Un cockpit de KPIs en haut pour voir les métriques clés du domaine sélectionné
        • Une grille de visualisations interactives (cartes, graphiques, tableaux de bord)
        
        Cliquez sur une visualisation pour l'agrandir et interagir avec elle en mode plein écran.`
      },
      {
        q: 'Comment utiliser les filtres globaux ?',
        a: `Les filtres globaux en haut de la page Visualisations permettent de :
        • Sélectionner une ou plusieurs régions administratives
        • Définir une plage temporelle (année de début/fin)
        • Choisir des indicateurs spécifiques
        
        Les visualisations se mettent à jour automatiquement selon vos sélections. 
        Vous pouvez réinitialiser tous les filtres avec le bouton "Réinitialiser".`
      },
      {
        q: 'Comment télécharger un jeu de données ?',
        a: `Pour télécharger un jeu de données :
        1. Allez dans la page Données (menu principal)
        2. Recherchez ou filtrez le dataset souhaité
        3. Cliquez sur la carte du dataset pour accéder à sa page de détail
        4. Vérifiez la licence (Open Data, Licence Restrictive, etc.)
        5. Cliquez sur le bouton "Télécharger" et choisissez le format (CSV, JSON, Excel)
        
        Pour certains datasets sous licence restrictive, une connexion et une adhésion organisationnelle sont nécessaires.`
      },
      {
        q: 'Que signifient les badges sur les jeux de données ?',
        a: `Les badges indiquent des caractéristiques importantes :
        • "Open Data" : données librement accessibles et réutilisables
        • "Vérifié" : données validées par l'équipe CITADEL
        • "Temps réel" : mises à jour en continu
        • "Contributeur vérifié" : source certifiée et de confiance
        • "Nouveau" : publié dans les 30 derniers jours
        • "Mise à jour récente" : actualisé dans les 7 derniers jours`
      },
      {
        q: 'Comment fonctionnent les abonnements aux organisations ?',
        a: `Les abonnements permettent de :
        • Recevoir des notifications sur les nouvelles données d'une organisation
        • Suivre les mises à jour des datasets publiés
        • Participer aux communautés thématiques
        
        Pour vous abonner, visitez la page d'une Organisation et cliquez sur "S'abonner". 
        Vous devez être connecté pour utiliser cette fonctionnalité.`
      }
    ]
  },
  {
    id: 'data-management',
    title: 'Gestion des Données',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
      </svg>
    ),
    questions: [
      {
        q: 'D\'où proviennent les données de la plateforme ?',
        a: `Les données proviennent de multiples sources fiables :
        • Ministères et institutions gouvernementales (INSD, Ministères sectoriels)
        • Organisations internationales (UNICEF, OMS, PAM, UNHCR, OCHA)
        • ONG et organisations de la société civile
        • Projets de recherche universitaires (Université Joseph KI-ZERBO)
        • Plateformes ouvertes (HDX, ACLED, ReliefWeb)
        
        Chaque dataset indique clairement sa source et sa méthodologie de collecte.`
      },
      {
        q: 'Comment les données sont-elles harmonisées ?',
        a: `Le processus d'harmonisation se déroule en plusieurs étapes :
        1. Collecte et ingestion des données brutes
        2. Nettoyage et validation (détection d'anomalies, doublons, valeurs aberrantes)
        3. Normalisation des schémas (colonnes, types, unités)
        4. Géocodage et standardisation géographique (codes PCODE)
        5. Enrichissement avec métadonnées
        6. Fusion selon le domaine thématique
        7. Validation qualité finale
        
        Les notebooks Jupyter dans le dépôt GitHub documentent chaque transformation appliquée.`
      },
      {
        q: 'Quels formats de données sont supportés ?',
        a: `La plateforme supporte les formats suivants :
        
        En visualisation :
        • CSV, JSON, Excel (XLSX)
        • GeoJSON pour les données géospatiales
        
        En téléchargement :
        • CSV (le plus universel)
        • JSON (pour intégration API)
        • Excel (XLSX) pour utilisateurs bureautiques
        
        Pour la contribution, les formats acceptés sont CSV et Excel principalement.`
      },
      {
        q: 'Comment sont créées les visualisations ?',
        a: `Les visualisations sont générées via un processus automatisé :
        1. Les données harmonisées sont stockées dans /data/viz/
        2. Un manifeste JSON définit les types de visualisations pertinentes
        3. La bibliothèque Plotly.js génère dynamiquement les graphiques
        4. Les cartes utilisent Leaflet et des fonds de carte OpenStreetMap
        5. Les filtres et interactions sont gérés côté client (React)
        
        Les configurations de visualisations sont versionnées et auditables.`
      },
      {
        q: 'Quelle est la qualité des données ?',
        a: `La qualité est évaluée selon plusieurs dimensions :
        • Complétude : pourcentage de valeurs non-nulles
        • Exactitude : validation par contrôles de cohérence
        • Temporalité : fraîcheur et fréquence de mise à jour
        • Traçabilité : métadonnées sur la source et les transformations
        
        Un score de qualité (0-100) est calculé et affiché pour chaque dataset. 
        Les datasets avec score < 70 sont marqués "Attention qualité".`
      }
    ]
  },
  {
    id: 'contributions',
    title: 'Contributions et Partenariats',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    questions: [
      {
        q: 'Comment devenir contributeur de données ?',
        a: `Pour contribuer des données au portail :
        1. Créez un compte utilisateur sur la plateforme
        2. Adhérez à une organisation partenaire existante ou créez une nouvelle organisation
        3. Attendez la validation par l'équipe CITADEL (72h maximum)
        4. Accédez à l'espace Contribution
        5. Soumettez vos datasets avec métadonnées complètes
        
        Les données sont examinées avant publication pour garantir qualité et conformité.`
      },
      {
        q: 'Quels sont les critères pour devenir organisation partenaire ?',
        a: `Pour devenir organisation partenaire :
        • Être une structure légalement enregistrée (ONG, ministère, université, projet)
        • Disposer de données d'intérêt public dans au moins un des 5 domaines
        • S'engager à respecter les standards de qualité de CITADEL
        • Accepter les licences de partage (Open Data recommandé)
        • Désigner un point focal technique
        
        Les partenaires ont accès à un espace dédié pour gérer leurs publications.`
      },
      {
        q: 'Quelles sont les obligations d\'un contributeur ?',
        a: `En tant que contributeur, vous devez :
        • Fournir des métadonnées complètes et exactes
        • Respecter les droits de propriété intellectuelle
        • Mettre à jour les données selon la fréquence annoncée
        • Répondre aux demandes de clarification sous 5 jours ouvrables
        • Signaler tout problème de qualité identifié a posteriori
        • Ne pas publier de données sensibles ou personnelles non anonymisées
        
        Le non-respect peut entraîner la suspension temporaire du compte.`
      },
      {
        q: 'Puis-je restreindre l\'accès à mes données ?',
        a: `Oui, trois types de licences sont possibles :
        • Open Data : accès libre et gratuit à tous (recommandé)
        • Licence Restrictive : accès sur demande et validation
        • Usage Interne : réservé aux membres de votre organisation
        
        Cependant, CITADEL encourage fortement l'Open Data pour maximiser l'impact social des données.`
      },
      {
        q: 'Comment signaler une erreur dans les données ?',
        a: `Si vous identifiez une erreur :
        1. Utilisez le bouton "Signaler un problème" sur la page du dataset
        2. Décrivez précisément l'anomalie (localisation, valeur attendue vs observée)
        3. Fournissez une référence ou source alternative si possible
        
        Vous pouvez aussi contacter directement l'organisation contributrice via la page Contact. 
        Toutes les corrections sont tracées et versionnées.`
      },
      {
        q: 'La plateforme propose-t-elle une API ?',
        a: `Une API REST est en développement et sera bientôt disponible. Elle permettra :
        • L'accès programmatique aux datasets
        • La récupération des métadonnées au format JSON
        • L'intégration dans des applications tierces
        • Des webhooks pour notifications de mises à jour
        
        Des informations sur l'API et la documentation seront publiées sur le portail dès sa mise en service.`
      }
    ]
  },
  {
    id: 'technical',
    title: 'Questions Techniques',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
      </svg>
    ),
    questions: [
      {
        q: 'Quels navigateurs sont supportés ?',
        a: `Le portail est optimisé pour :
        • Chrome / Chromium (version 90+)
        • Firefox (version 88+)
        • Safari (version 14+)
        • Edge (version 90+)
        
        Pour une expérience optimale, utilisez un navigateur récent avec JavaScript activé.`
      },
      {
        q: 'Le site est-il accessible hors ligne ?',
        a: `Le portail nécessite une connexion Internet pour fonctionner. Cependant :
        • Les datasets téléchargés peuvent être utilisés hors ligne
        • Les visualisations sont exportables en image (PNG) pour utilisation locale
        • Une version offline est à l'étude pour zones à faible connectivité`
      },
      {
        q: 'Comment exporter une visualisation ?',
        a: `Pour exporter une visualisation :
        1. Ouvrez-la en mode plein écran
        2. Survolez le graphique et faites clique droit puis enregistrer sous pour choisir l'emplacement 
        3. Choisissez le dossier sur votre ordinateur pour sauvegarder l'image
        4. Le fichier se télécharge automatiquement
        
        Vous pouvez aussi copier l'URL de la visualisation pour la partager directement.`
      },
      {
        q: 'Mes données personnelles sont-elles protégées ?',
        a: `Oui, la plateforme respecte strictement les standards de protection des données :
        • Authentification sécurisée via Supabase
        • Chiffrement HTTPS pour toutes les communications
        • Pas de revente ni partage de données personnelles
        • Conformité aux principes du RGPD (bien que non applicable au Burkina Faso)
        • Droit d'accès, rectification et suppression de vos données
        
        Consultez notre Politique de Confidentialité pour plus de détails.`
      },
      {
        q: 'Le code source est-il ouvert ?',
        a: `Oui, CITADEL est un projet open source. Le code est disponible sur GitHub :
        • Frontend (React + Vite) : github.com/citadel-bf/data-platform
        • Scripts d'harmonisation (Python) : dans le dépôt principal
        • Une documentation technique complète sera fournie pour les développeurs souhaitant contribuer.
        
        Les contributions communautaires sont les bienvenues !`
      }
    ]
  }
]

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button className="faq-item__question" onClick={onToggle} type="button">
        <span className="faq-item__question-text">{question}</span>
        <svg
          className="faq-item__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="faq-item__answer">
          <div className="faq-item__answer-content">
            {answer.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FAQSection({ section }) {
  const [openItems, setOpenItems] = useState({})

  function toggleItem(index) {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <section className="faq-section" id={section.id}>
      <div className="faq-section__header">
        <div className="faq-section__icon">{section.icon}</div>
        <h2 className="faq-section__title">{section.title}</h2>
      </div>
      <div className="faq-section__items">
        {section.questions.map((item, idx) => (
          <FAQItem
            key={idx}
            question={item.q}
            answer={item.a}
            isOpen={!!openItems[idx]}
            onToggle={() => toggleItem(idx)}
          />
        ))}
      </div>
    </section>
  )
}

export default function FAQPage() {
  return (
    <div className="faq-page">
      {/* En-tête */}
      <header className="faq-page__header">
        <div className="container faq-page__header-inner">


          <h1 className="faq-page__title">Foire Aux Questions</h1>
          <p className="faq-page__subtitle">
            Trouvez rapidement des réponses aux questions les plus fréquentes concernant 
            le Portail CITADEL data.citadel.bf : utilisation, données, contributions et aspects techniques.
          </p>
        </div>
      </header>

      {/* Navigation rapide */}
      <aside className="faq-page__toc">
        <div className="container">
          <nav className="faq-toc">
            <h2 className="faq-toc__title">Navigation rapide</h2>
            <ul className="faq-toc__list">
              {FAQ_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="faq-toc__link">
                    <span className="faq-toc__icon">{section.icon}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="faq-page__content">
        <div className="container">
          {FAQ_SECTIONS.map((section) => (
            <FAQSection key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Call-to-action */}
      <section className="faq-page__cta">
        <div className="container">
          <div className="faq-cta">
            <div className="faq-cta__icon">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <h2 className="faq-cta__title">Vous n'avez pas trouvé de réponse ?</h2>
            <p className="faq-cta__text">
              Notre équipe est à votre disposition pour répondre à toutes vos questions spécifiques.
            </p>
            <NavLink to="/contact" className="faq-cta__button">
              Nous contacter
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  )
}
