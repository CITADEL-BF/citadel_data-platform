# Suivi global du projet data.citadel.bf

Ce fichier sert de reference unique pour suivre toutes les etapes du projet, de S1 a S10.

## 1) Vue d ensemble

| Etape | Periode cible | Statut | Avancement | Livrable attendu | Preuve actuelle |
|---|---|---|---:|---|---|
| Cadrage initial + lecture cahier de charges | S1 | Termine | 100% | Note de cadrage | rapport_S1_final.docx |
| Benchmark plateformes de reference | S1-S2 | Termine | 100% | Synthese benchmark | rapport_S1_final.docx |
| Identification et collecte des donnees V1 | S1-S2 | Termine | 100% | Donnees classees par module | data_raw/ |
| Inventaire des jeux de donnees | S2 | Termine | 100% | Inventaire consolide | modules_v1_sources_donnees.xlsx |
| Harmonisation des statuts inventaire | S2-S3 | Termine | 100% | Statuts unifies | modules_v1_sources_donnees.xlsx |
| Analyse technique des donnees (qualite/coherence) | S3 | Termine | 100% | Rapport hebdomadaire explicatif S3 + cartographie jeux manquants/partiels | data_raw/analysis_global/rapport_et_fichiers/livrable_rapport_S3.docx |
| Preparation des jeux ready dashboard | S3-S4+ | En cours (partiel) | 96% | JSON/GeoJSON/CSV produits pour les 5 modules (data/viz/) — 31 CSV telechargeables (un par visualisation), 18 JSON graphiques, 9 GeoJSON thematiques, 9 boundaries administratives, manifeste avec filtres ADM2/ADM3 | data/viz/ ; scripts/convertir_donnees_visualisation.py |
| Maquettes UI/UX + architecture technique | S4 | En cours | 75% | Maquettes + doc architecture | data_raw/analysis_global/rapport_et_fichiers/maquette_V1.pdf ; data_raw/analysis_global/rapport_et_fichiers/DESIGN.md ; docs/architecture_technique.md |
| Home + navigation | S5 | Termine | 100% | Page d'accueil complete (6 sections) + navigation inter-modules (ModuleLayout + 5 pages placeholders + routing SPA) + page Contact complete + footer licence CC BY 4.0 | src/pages/ ; src/app/App.jsx ; src/components/Header/Header.jsx ; src/components/Footer/Footer.jsx |
| Module Securite + Population/PDI | S6 | En cours | 90% | Module Securite fonctionnel + Module Population & PDI fonctionnel : carte Leaflet choroplèthe (PDI + population), courbe PDI 2016-2024, pyramide demographique, comparaison inter-regionale, section vulnerabilite des menages (economie/alimentaire/sante), filtres periode (mensuel/annuel/avances), carte CTA FASO ARZEKA | src/pages/modules/Population/PopulationPage.jsx ; src/pages/modules/Population/PopulationPage.css ; public/data/viz/ |
| Module Education | S7 | A demarrer | 0% | Module fonctionnel | A produire |
| Modules Economie + Sante | S8 | A demarrer | 0% | 2 modules fonctionnels (partiel accepte) | A produire |
| Stabilisation (perf/accessibilite/tests) | S9 | A demarrer | 0% | Audit + corrections | A produire |
| Documentation + demo finale + backlog V2 | S10 | A demarrer | 0% | Dossier final complet | A produire |

## 2) Suivi hebdomadaire detaille

| Semaine | Objectif principal | Taches cle | Statut | Avancement | Commentaire |
|---|---|---|---|---:|---|
| S1 | Cadrage + benchmark | Analyse CDC, benchmark, definition du perimetre V1 | Termine | 100% | Base methodologique validee |
| S2 | Collecte + structuration donnees | Recuperation sources, classement par module, inventaire | Termine | 100% | Donnees V1 centralisees |
| S3 | Analyse donnees | Controle qualite, coherence periodes, harmonisation geo | Termine | 100% | Analyse relancee, 5 domaines, 0 KO |
| S4 | Data ready + conception | Jeux normalises, maquettes, architecture | En cours | 96% | Maquette disponible, charte V1 derivee et architecture technique documentee; depot Git local initialise; JSON/GeoJSON/CSV dashboard V1 produits pour les 5 modules; extension du decoupage administratif ADM2/ADM3 et manifeste frontend enrichi; 31 CSV telechargeables ; population et vulnerabilite menages couverts |
| S5 | Socle front | Home + navigation + pages modules + page Contact | Termine | 100% | Page d'accueil finalisee (6 sections) ; navigation inter-modules complete (routing React Router, 5 pages modules, Header NavLink) ; page Contact complete (formulaire valide, infos, liens) ; footer licence CC BY 4.0 ; build stable 84 modules |
| S6 | Modules 1 et 2 | Securite + Population/PDI | En cours | 90% | Module Securite finalise (S6 initial) + Module Population & PDI completement developpe : carte Leaflet choroplèthe interactive (PDI / population totale, toggle couche, clic region pour filtrer), courbe evolution PDI IDMC 2016-2024, pyramide demographique bilatérale INSD 2019, comparaison inter-régionale barres, section vulnerabilite des menages (3 indicateurs : economie/alimentaire/sante, graphiques ECharts + carte), filtres periode (mensuel/annuel/avances), carte CTA FASO ARZEKA (lien my.fasoarzeka.bf), 4 fichiers JSON viz generes, GeoJSON choroplèthe PDI enrichi, build stable |
| S7 | Module 3 | Education | Planifie | 0% |  |
| S8 | Modules 4 et 5 | Economie + Sante | Planifie | 0% | Mode partiel possible |
| S9 | Stabilisation | Tests, perf, accessibilite, corrections | Planifie | 0% |  |
| S10 | Cloture | Docs, demo, rapport final, passation | Planifie | 0% |  |

## 3) Livrables produits

| Livrable | Statut | Emplacement |
|---|---|---|
| Calendrier de suivi | Disponible | calendrier.xlsx |
| Rapport S1 final | Disponible | rapport_S1_final.docx |
| Rapport de travail (MD) | Disponible | rapport_S1_final.md |
| Inventaire donnees V1 | Disponible | modules_v1_sources_donnees.xlsx |
| Donnees classees par module (brut) | Disponible | data_raw/ |
| Structure cleaning/preparation | Disponible | data/ |
| Script analyse technique donnees | Disponible | scripts/analyse_technique_donnees.py |
| Rapports d'analyse par domaine | Disponible | data_raw/*/analysis/ |
| Rapport global d'analyse | Disponible | data_raw/analysis_global/rapport_global.csv |
| Synthese globale JSON | Disponible | data_raw/analysis_global/synthese_globale.json |
| Livrable S3 (rapport hebdomadaire explicatif) | Disponible | data_raw/analysis_global/rapport_et_fichiers/livrable_rapport_S3.docx |
| Maquette UI/UX V1 | Disponible | data_raw/analysis_global/rapport_et_fichiers/maquette_V1.pdf |
| Charte graphique V1 derivee de la maquette | Disponible | data_raw/analysis_global/rapport_et_fichiers/DESIGN.md |
| Architecture technique documentee V1 | Disponible | docs/architecture_technique.md |
| Script conversion donnees viz (JSON/GeoJSON/CSV) | Disponible | scripts/convertir_donnees_visualisation.py |
| Donnees dashboard V1 (JSON + GeoJSON + CSV) | Disponible | data/viz/ |
| Manifeste index frontend | Disponible | data/viz/manifeste.json |
| CSV telechargeables par visualisation (31 fichiers) | Disponible | data/viz/csv/ |
| Reference tabulaire boundaries admin (XLSX) | Disponible | data/viz/csv/bfa_admin_boundaries.xlsx |
| Couches GeoJSON ADM2 thematiques (provinces) | Disponible | data/viz/geojson/securite_carte_incidents_provinces.geojson ; data/viz/geojson/economie_carte_prix_provinces.geojson |
| Couche GeoJSON ADM3 thematique (communes) | Disponible | data/viz/geojson/population_carte_pdi_communes.geojson |
| Visualisations population vulnerabilite menages | Disponible | data/viz/json/population/courbe_vulnerabilite_menages.json ; data/viz/json/population/kpi_vulnerabilite_menages.json ; data/viz/json/population/comparaison_regionale_vulnerabilite.json ; data/viz/geojson/population_carte_vulnerabilite_menages.geojson |
| Socle frontend React+Vite | Disponible | src/ ; package.json ; vite.config.js |
| Page d'accueil V1 (6 sections) | Disponible | src/pages/Home/ |
| HeroSection (titre, barre recherche, pills, phrase couverture) | Disponible | src/pages/Home/sections/HeroSection.jsx/.css |
| CitadelSection (carousel 6 slides) | Disponible | src/pages/Home/sections/CitadelSection.jsx/.css |
| ModulesSection ([DOMAINES CLES], 5 cartes domaines) | Disponible | src/pages/Home/sections/ModulesSection.jsx/.css |
| StatusBanner (bandeau defilant noir, 4 indicateurs) | Disponible | src/pages/Home/sections/StatusBanner.jsx/.css |
| MapSection (carte SVG GeoJSON BF, barres par region) | Disponible | src/pages/Home/sections/MapSection.jsx/.css |
| MethodologySection ([Sources & Methodologie], 4 cartes processus) | Disponible | src/pages/Home/sections/MethodologySection.jsx/.css |
| Script agregation regions V2 (deduplication + ponderation + indice 0-100) | Disponible | scripts/calculer_totaux_regions.py |
| JSON regions pour MapSection | Disponible | public/data/home/regions.json |
| ModuleLayout commun (breadcrumb + onglets + header themate) | Disponible | src/pages/modules/ModuleLayout.jsx/.css |
| Page Securite fonctionnelle (filtres, KPI, carte Leaflet interactive, courbe ECharts, tableau) | Disponible | src/pages/modules/Securite/SecuritePage.jsx ; src/pages/modules/Securite/SecuritePage.css |
| Bibliotheques de visualisation installees (ECharts, Leaflet, D3) | Disponible | package.json — echarts, echarts-for-react, leaflet, react-leaflet@4, d3 |
| Module Population & PDI fonctionnel (Leaflet choroplèthe, courbe PDI, pyramide demographique, comparaison regionale, section vulnerabilite menages, filtres periode, CTA FASO ARZEKA) | Disponible | src/pages/modules/Population/PopulationPage.jsx ; src/pages/modules/Population/PopulationPage.css |
| JSON viz population produits (kpi.json reconstruit IDMC, courbe_pdi.json 2016-2024, pyramide_demographique.json, comparaison_regionale.json, kpi_vulnerabilite_menages.json, courbe_vulnerabilite_menages.json, comparaison_regionale_vulnerabilite.json) | Disponible | public/data/viz/json/population/ |
| GeoJSON choroplèthe population (PDI + population totale par region, 13 regions) | Disponible | public/data/viz/geojson/population_carte_pdi.geojson |
| Donnees viz vulnerabilite menages publiques (4 CSV + JSON) | Disponible | public/data/viz/json/population/ ; data/viz/json/population/ |
| Page placeholder Education | Disponible | src/pages/modules/Education/EducationPage.jsx |
| Page placeholder Economie & Emploi | Disponible | src/pages/modules/Economie/EconomiePage.jsx |
| Page placeholder Sante | Disponible | src/pages/modules/Sante/SantePage.jsx |
| Routing SPA complet (5 modules + contact + 404) | Disponible | src/app/App.jsx |
| Header mis a jour (NavLink SPA + lien Contact) | Disponible | src/components/Header/Header.jsx |
| Page Contact complete (formulaire valide + infos + SLA) | Disponible | src/pages/Contact/ContactPage.jsx/.css |
| Footer licence CC BY 4.0 (notice + lien officiel) | Disponible | src/components/Footer/Footer.jsx/.css |

## 4) Risques actifs et mitigation

| Risque | Impact | Probabilite | Action de mitigation | Responsable | Statut |
|---|---|---|---|---|---|
| Heterogeneite des formats | Moyen | Elevee | Standardiser schemas + noms colonnes | Data | Ouvert |
| Incoherences geographiques | Eleve | Moyenne | Table de correspondance regions/provinces/communes | Data | Ouvert |
| Donnees partiellement exploitables | Moyen | Moyenne | Marquer indisponible ou a confirmer + plan de remplacement | Data | Ouvert |
| Retard integration modules | Eleve | Moyenne | Prioriser jeux ready dashboard des modules critiques | Data/Front | Ouvert |

## 5) Decisions de pilotage

- Les semaines S1 et S2 sont validees comme phase de collecte et benchmark.
- Le demarrage de l analyse technique des donnees est positionne en S3.
- Les statuts inventaire non disponibles sont unifies sous "Indisponible ou a confirmer".
- Le calendrier de reference est harmonise avec l avancement reel.

## 6) Journal de progression (a mettre a jour chaque semaine)

### Entree de suivi - Semaine 3
- Date de mise a jour: 2026-04-08
- Travail realise: purge des anciens rapports d'analyse; relance complete du script scripts/analyse_technique_donnees.py; verification des sorties globales et par domaine.
- Resultats obtenus: 5 domaines analyses; rapports techniques regeneres dans data_raw/*/analysis et data_raw/analysis_global; 0 KO apres suppression du fichier Excel illisible.
- Bloquants: aucun bloquant technique sur l'analyse globale.
- Actions prevues semaine suivante: preparation des jeux ready dashboard (nettoyage metier, nomenclature geographique, formats date) et priorisation des datasets V1.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 3 (mise a jour livrable)
- Date de mise a jour: 2026-04-10
- Travail realise: production du livrable hebdomadaire explicatif S3; verification de la pertinence des visualisations V1; cartographie des jeux de donnees manquants ou partiels (et non des cellules manquantes); consolidation des sources recensees.
- Resultats obtenus: livrable officiel depose dans data_raw/analysis_global/rapport_et_fichiers/livrable_rapport_S3.docx; statuts clarifies pour les blocs critiques (PDI retours, villages reconquis, resultats scolaires, ecoles ouvertes/fermees, zones a acces limite).
- Bloquants: persistance de jeux non confirms ou indisponibles sur certains blocs metiers prioritaires.
- Actions prevues semaine suivante: lancer les demandes de donnees ciblees aupres des structures proprietaires de donnees et integrer les jeux recuperes dans les pipelines de preparation.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4
- Date de mise a jour: 2026-04-10
- Travail realise: creation d'une nouvelle structure data/ dediee au cleaning et a la preparation; renommage des donnees brutes vers data_raw/; ajout des sous-dossiers metiers manquants (Population, Economie, Securite); adaptation des scripts pour lire les sources depuis data_raw/.
- Resultats obtenus: separation claire brut vs preparation (data_raw vs data); pipelines d'analyse et de mise a jour du suivi operationnels sur data_raw; coherence de l'arborescence de travail pour la phase S4.
- Bloquants: aucun bloquant technique a ce stade.
- Actions prevues semaine suivante: demarrer le nettoyage par domaine dans data/ (normalisation colonnes, traitement des valeurs manquantes, dedoublonnage, controles de coherence) et produire les premiers jeux prets dashboard.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4 (revision module Securite + cloture partielle preparation donnees)
- Date de mise a jour: 2026-04-28
- Travail realise: reprise complete de l'analyse et de la preparation du module Securite / sous-domaine Incidents securitaires. Exclusion de conflict_data_bfa.csv (biais potentiel identifie). Integration des nouveaux jeux de donnees : 3 fichiers HRP ACLED Burkina Faso (ciblage civils, violence politique, manifestations — granularite region/province, mensuel, 1997-2026) et 6 fichiers annuels/mensuels mis a jour au 03 avril 2026. Réécriture complete du notebook securite_preparation_harmonisation.ipynb.
- Resultats obtenus: 10 exports CSV regeneres dans data/Securite/Incidents_securitaires/ (dont incidents_hrp_region_province_mensuel_bfa_clean.csv — 46 980 lignes avec Admin1/Admin2, series_annuelles_bfa_harmonisees.csv — 5 indicateurs fusionnes, violence_politique_mensuelle_bfa_clean.csv). Fichier incidents_geolocalises_bfa_clean.csv (issu de conflict_data_bfa) supprime. Controle qualite et suivi mis a jour.
- Bloquants: des donnees manquantes subsistent sur plusieurs blocs metiers (PDI retours, resultats scolaires geolocalises, ecoles ouvertes/fermees, zones a acces limite) — elles seront integrees au fil de leur disponibilite aupres des sources officielles (SP/CONASUR, MENAPLN, partenaires securite). L'analyse n'est donc pas figee : chaque apport de donnees fera l'objet d'une reprise du pipeline de preparation du module concerne.
- Principe retenu: la phase de preparation des donnees est consideree comme evolutive et non bloquante pour la suite du projet. Le dashboard V1 sera developpe avec les jeux disponibles a date ; les blocs partiels seront mis a jour des que les sources sont obtenues.
- Actions prevues: avancer sur le socle frontend S5 en parallele des demandes de donnees en attente.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4 (transformation donnees dashboard V1)
- Date de mise a jour: 2026-05-01
- Travail realise: creation du script scripts/convertir_donnees_visualisation.py; transformation des jeux CSV nettoyes de tous les modules (Securite, Population, Education, Economie, Sante) en JSON (graphiques ECharts), GeoJSON (cartes Leaflet) et CSV (telechargement). Telechargement et mise en cache des boundaries geographiques Burkina Faso ADM1 (regions) et ADM2 (provinces) depuis geoBoundaries (open data). Normalisation unifiee des noms de regions couvrant les 4 variantes identifiees dans les sources. Production du manifeste d'index pour le frontend.
- Resultats obtenus: 18 fichiers produits dans data/viz/ (4 GeoJSON thematiques + 2 boundaries + 11 JSON graphiques + 5 CSV telechargement + 1 manifeste). Jointures regionales : 12/13 regions matchees pour Securite/Economie/Education/Sante; 8/13 pour PDI (normal, les 5 regions restantes n'ont pas de PDI documentes dans les sources GCORR). Emploi/chomage genere (taux par milieu, 3 series temporelles).
- Bloquants: aucun bloquant technique. Donnees PDI partielles (8/13 regions) conforme aux sources disponibles.
- Principe confirme: preparation des donnees evolutive et non bloquante — data/viz/ sera mis a jour au fil des nouveaux jeux disponibles via re-execution du script.
- Actions prevues: demarrer le socle frontend S5 en se basant sur manifeste.json et les fichiers data/viz/.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 6 (module Population & PDI — version complete)
- Date de mise a jour: 2026-05-08
- Travail realise:
  - Developpement complet de PopulationPage.jsx et PopulationPage.css en remplacement du placeholder S6.
  - Carte Leaflet choroplèthe (PDI par region + population totale), toggle couche PDI/population, clic sur region pour filtrer l'ensemble des graphiques, tooltip enrichi (PDI + population).
  - Courbe evolution PDI IDMC 2016-2024 : reconstruction de courbe_pdi.json depuis IDMC_Internal_Displacement_Conflict-Violence_Disasters_nettoye.csv (donnees stock conflits, 2016-2024, valeurs reelles remplacant les IDs concatenes incorrects produits precedemment).
  - Pyramide demographique bilatérale (Hommes / Femmes, 17 tranches d'age INSD 2019, ECharts barres horizontales empilees, axe miroir).
  - Comparaison inter-regionale : barres horizontales triees par valeur, filtrable par region selectionnee.
  - Generation de kpi.json : population totale 22,7 M (INSD 2023), taux de croissance 2,9%, PDI 2,063 M (IDMC 2024), 8 regions avec PDI documentes.
  - Generation du GeoJSON choroplèthe population_carte_pdi.geojson enrichi avec nb_pdi et population par region (jointure normalisee sur 13 regions).
  - Filtres avances : filtre periode (mensuel / annuel) et filtre region communs a toutes les visualisations de la page.
  - Section Vulnérabilite des menages : 3 indicateurs (economie, alimentaire, sante), graphiques ECharts branches sur courbe_vulnerabilite_menages.json et comparaison_regionale_vulnerabilite.json, carte regionale de vulnerabilite.
  - Carte CTA FASO ARZEKA : composant cliquable dirigeant vers https://my.fasoarzeka.bf/ (ouverture nouvel onglet, rel noopener noreferrer).
  - Copie de tous les fichiers viz population dans public/data/viz/ pour exposition Vite.
  - Build verifie : 0 erreur de compilation, build stable.
- Resultats obtenus: module Population & PDI entierement fonctionnel, couvrant les 5 objectifs identifies (carte PDI, courbe evolution, pyramide, comparaison regionale, filtres) + 2 fonctionnalites supplementaires (section vulnerabilite, CTA FASO ARZEKA). S6 estime a 90% (reste : intégration EDucation S7).
- Bloquants: donnees PDI par region couvrent 8/13 regions (normal — 5 regions sans deplacement documente dans GCORR mai 2025). Section vulnerabilite basee sur dernieres annees INSD disponibles.
- Actions prevues semaine suivante: demarrer le module Education (S7) — visualisations taux de scolarisation, ecoles, resultats scolaires.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 5 (extension population : vulnerabilite des menages)
- Date de mise a jour: 2026-05-08
- Travail realise: extension du module population dans scripts/convertir_donnees_visualisation.py pour integrer le sous-domaine vulnerabilite des menages, non couvert dans les premiers exports. Exploitation des jeux nettoyes de pauvrete et conditions de vie pour produire des sorties prêtes dashboard au meme format que les autres blocs population.
- Resultats obtenus: 4 nouvelles sorties visualisation pour la population — courbe nationale des indices de pauvrete, KPI vulnerabilite des menages, comparaison regionale des indicateurs de pauvrete et carte regionale GeoJSON de la vulnerabilite des menages. 4 CSV de telechargement associes ajoutes dans data/viz/csv/. Le module population couvre desormais PDI, demographie et vulnerabilite des menages.
- Bloquants: aucun bloquant technique. Les visualisations reposent sur les dernieres annees disponibles des sources INSD harmonisees.
- Actions prevues: brancher ces nouvelles ressources population dans le frontend du module S6 et definir les cartes/graphes prioritaires pour l'ecran population.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4 (export CSV complets pour telechargement)
- Date de mise a jour: 2026-04-28
- Travail realise: enrichissement du script convertir_donnees_visualisation.py pour produire un fichier CSV telechargeable par visualisation et non plus un seul CSV par module. Chaque graphique, carte et KPI dispose desormais de son propre CSV source.
- Resultats obtenus: 24 fichiers CSV dans data/viz/csv/ — Securite (4) : incidents HRP mensuel, series annuelles, par region×type, total par region ; Population (5) : PDI detail, PDI annuel, PDI par region, demographie regionale, pyramide des ages ; Education (5) : indicateurs, ecoles, ecoles par region, KPI acces numerique, comparaison geographique ; Economie (3) : prix alimentaires, prix par region, emploi/chomage ; Sante (5) : indicateurs global, couverture sanitaire, KPI epidemiologie, infrastructures, centres par region. Manifeste mis a jour avec la liste complete.
- Bloquants: aucun.
- Actions prevues: demarrer le socle frontend S5 (package.json, Vite, React, structure src/) en se basant sur manifeste.json et les fichiers data/viz/.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4 (architecture et conception)
- Date de mise a jour: 2026-04-22
- Travail realise: verification du recalage calendrier avec les livrables hebdomadaires; prise en compte de la maquette V1 deja produite; derivation d'une charte graphique V1 depuis la maquette dans DESIGN.md; redaction de l'architecture technique documentee dans docs/architecture_technique.md; initialisation d'un depot Git local en attente du depot GitHub organisationnel; analyse visuelle des 14 captures PNG de maquettes dans le dossier maquettes/; production de la synthese d'analyse dans docs/synthese_maquettes_V1.md.
- Resultats obtenus: socle de conception S4 clarifie; stack V1 retenue (React + TypeScript + Vite + ECharts + Leaflet); structure cible du depot documentee; exigences non fonctionnelles du CDC integrees aux choix techniques; depot local initialise avec git; liste des composants React V1 identifiee (17 composants); layout ModuleLayout commun aux 5 modules thematiques formalise; tokens couleurs par domaine ajoutes a DESIGN.md.
- Bloquants: depot GitHub de l'organisation non encore cree; charte officielle CITADEL non encore transmise.
- Actions prevues semaine suivante: initialiser le socle frontend local (package.json, vite.config.ts, tsconfig.json, src/), ajouter les fichiers de base du depot public (README, LICENSE, .gitignore), puis developper la home et la navigation selon la maquette.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 5 (navigation inter-modules + page Contact + footer)
- Date de mise a jour: 2026-05-06
- Travail realise:
  - ModuleLayout.jsx/.css : layout commun a tous les modules thematiques ; breadcrumb (Accueil / Modules / {domaine}), sous-navigation onglets 5 modules avec couleur active via --tab-color, en-tete gradient colore par module (--module-accent), zone contenu enfants.
  - 5 pages modules placeholders crees (Securite, Population, Education, Economie, Sante) avec couleurs thematiques, icones SVG, tag sprint prevu et description des donnees disponibles.
  - Routing React Router etendu dans App.jsx : 5 routes /modules/*, route /contact, catch-all 404.
  - Header.jsx corrige : remplacement de tous les <a href> du mega-menu et menu mobile par <NavLink to> (navigation SPA sans rechargement de page). Lien Contact ajoute dans la nav desktop et mobile.
  - HeroSection.jsx : pills de navigation converties en NavLink (import NavLink ajoute, prop href renommee to).
  - Page Contact complete (src/pages/Contact/) : formulaire React controle avec validation temps reel (nom, email, organisation, sujet select 7 options, message avec compteur caracteres) ; etat succes avec reset ; colonne informations sticky (email, adresse, disponibilite, liens utiles, badge SLA 2 jours) ; responsive mobile/tablette.
  - Footer : notice de licence CC BY 4.0 ajoutee (texte legal complet + lien https://creativecommons.org/licenses/by/4.0/deed.fr) ; badge Licence CC BY 4.0 converti en lien avec icone.
  - Build valide tout au long : 84 modules transformes, 0 erreur, ~2s.
- Resultats obtenus: navigation inter-modules entierement operationnelle ; page Contact accessible depuis le header et la route /contact ; footer conforme aux exigences de la licence CC BY 4.0 ; S5 completement termine.
- Bloquants: aucun bloquant technique.
- Actions prevues semaine suivante: demarrer le contenu reel des modules Securite et Population/PDI (S6) — visualisations ECharts branchees sur data/viz/.
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 5 (page d'accueil V1)
- Date de mise a jour: 2026-05-06
- Travail realise:
  - Initialisation du socle frontend React + Vite (JSX, sans TypeScript) dans src/ ; configuration vite.config.js, index.html, tokens CSS globaux.
  - Developpement complet de la page d'accueil en 6 sections : HeroSection, CitadelSection, ModulesSection, StatusBanner, MapSection, MethodologySection.
  - HeroSection : titre hero, phrase de couverture ("Plus de 1 000 datasets, plus de 15 agences"), barre de recherche, pills d'acces rapide aux 5 modules, blobs animees.
  - CitadelSection : carousel 6 slides (Presentation, Objectifs, Mission, Activites, Partenaires, Membres) avec titres et grilles ajustes.
  - ModulesSection : titre [DOMAINES CLES] couleur primaire, 5 cartes domaines avec couleurs thematiques.
  - StatusBanner : bandeau defilant horizontal infini (marquee CSS), fond noir, contraste texte/icones renforce, indicateur API mis a "Non disponible".
  - MapSection : carte SVG reelle du Burkina Faso generee depuis bfa_regions_boundaries.geojson (projection personnalisee, pas de Leaflet), barres de concentration par region, couleurs par code region, titre [Concentration des Donnees].
  - MethodologySection : renommee [Sources & Methodologie], fond gris clair, filigrane fiole SVG, 4 cartes (Extraction, Nettoyage, Sources principales, Licences CC BY 4.0).
  - Uniformisation des tailles de titres sur toutes les sections : clamp(1.75rem, 3.5vw, 2.5rem) avec font-display et letter-spacing coherent.
  - Script calculer_totaux_regions.py v2 : deduplication stricte par (source_fichier, indicateur, annee, region), ponderation plafonnee par source (max 200 entrees par fichier), indice normalise 0-100 exporte dans regions.json.
  - Build stable tout au long des developpements (npm run build OK, 75+ modules, ~2-3s).
- Resultats obtenus: page d'accueil complete et buildee ; regions.json regenere avec scores equilibres (78%-100% selon region) ; MapSection branchee sur les vraies donnees geographiques et d'agregation.
- Bloquants: aucun bloquant technique. Navigation inter-modules et pages modules non encore developpees.
- Actions prevues semaine suivante: developper la structure de navigation (header/nav, routing React) et demarrer les modules Securite et Population/PDI (S6).
- Responsable validation: Stagiaire Data / Encadrant

### Entree de suivi - Semaine 4 (mise a jour decoupage administratif et sorties cartographiques)
- Date de mise a jour: 2026-04-29
- Travail realise: adaptation du script scripts/convertir_donnees_visualisation.py au nouveau decoupage administratif ajoute dans data/viz/geojson (ADM0, ADM1, ADM2, ADM3, capitals, lines, points). Priorisation automatique des fichiers admin locaux, fallback geoBoundaries conserve. Ajout des sorties thematiques ADM2 (provinces) pour Securite et Economie. Ajout de la sortie ADM3 (communes) pour Population. Synchronisation de la reference bfa_admin_boundaries.xlsx vers data/viz/csv pour telechargement.
- Resultats obtenus: nouvelles couches produites et integrees au manifeste: securite_carte_incidents_provinces.geojson, economie_carte_prix_provinces.geojson, population_carte_pdi_communes.geojson. Nouveaux CSV: securite_incidents_par_province_total.csv, economie_prix_par_province.csv, population_pdi_par_commune.csv. Manifeste frontend enrichi avec geojson_adm2 et geojson_adm3 pour filtrage explicite des niveaux administratifs.
- Bloquants: couche communale education non publiee a ce stade (pas de donnees communes exploitables dans le fichier education_ecoles_harmonise.csv apres filtrage).
- Actions prevues: demarrage du socle frontend S5 avec branchement des filtres de niveau administratif sur manifeste.json (global, adm2, adm3) et affichage conditionnel des legendes/cartes.
- Responsable validation: Stagiaire Data / Encadrant

## 7) Methodes et moyens utilises (phase analyse S3)

### Methodes appliquees
- Approche modulaire par domaine: securite, population/PDI, education, economie/emploi, sante.
- Audit de disponibilite metier: distinction systematique entre jeux disponibles, partiels et indisponibles/a confirmer.
- Harmonisation des donnees: normalisation des schemas de colonnes, unification des variables temporelles et geographiques, nettoyage des valeurs.
- Verification d'adequation visuelle: controle jeu par jeu contre les visualisations attendues du cahier de charge V1 (carte, courbe, KPI, comparaisons).
- Priorisation des lacunes: classement des manques selon l'impact direct sur les visualisations et la decision de pilotage.

### Moyens techniques mobilises
- Environnement Python (.venv) avec pandas pour profiling, nettoyage, consolidation et controles qualite.
- Notebooks de preparation/harmonisation dans scripts/ pour transformations metier par module.
- Scripts de suivi et d'analyse (scripts/analyse_technique_donnees.py, scripts/maj_suivi_projet.py).
- Arborescence de travail separee: data_raw/ (brut + analyses) et data/ (jeux prepares).
- Sorties de pilotage: rapports markdown/docx, tableaux de suivi et cartographie des jeux manquants/partiels.

### Moyens organisationnels
- Inventaire central des sources (modules_v1_sources_donnees.xlsx) utilise comme referentiel de suivi.
- Suivi hebdomadaire dans ce cahier pour tracer travaux, resultats, blocages et actions.
- Validation conjointe Stagiaire Data / Encadrant sur les points de decision.

## 8) Regles de mise a jour

- Mettre a jour ce fichier au minimum 1 fois par semaine.
- Modifier en priorite les sections 1, 2 et 6.
- Ne pas supprimer l historique: ajouter une nouvelle entree hebdomadaire.
- Conserver les preuves (fichiers) pour chaque etape cloturee.

## 9) Sauvegarde automatique du suivi

Le script scripts/maj_suivi_projet.py met a jour automatiquement une section de synthese dans ce fichier a partir des resultats d'analyse presents dans data_raw/analysis_global/rapport_global.csv.

Commande:
- /home/malcolmv/Documents/citadel_data-platform/.venv/bin/python scripts/maj_suivi_projet.py

La section ci-dessous est geree automatiquement. Ne pas modifier manuellement son contenu.

<!-- AUTO_SUMMARY_START -->
Mise a jour automatique: 2026-04-29 15:39 UTC

- Domaines analyses: 5
- Fichiers recenses: 126
- Fichiers analyzables: 126
- Analyses OK: 126
- Analyses KO: 0

Detail par domaine:
- economie_emploi: total=17, analyzables=17, OK=17, KO=0
- education: total=23, analyzables=23, OK=23, KO=0
- population: total=68, analyzables=68, OK=68, KO=0
- sante: total=13, analyzables=13, OK=13, KO=0
- securite_stabilite: total=5, analyzables=5, OK=5, KO=0
<!-- AUTO_SUMMARY_END -->
