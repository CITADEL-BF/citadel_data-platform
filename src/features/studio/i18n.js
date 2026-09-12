/**
 * Dictionnaire local a la fonctionnalite "Visualiser vos donnees".
 * Meme approche que les autres composants du projet : objet { fr, en } +
 * hook `useLanguage()`.
 */

import { useLanguage } from '../../contexts/LanguageContext'

const TEXT = {
  fr: {
    pageTitle: 'Visualiser vos données',
    pageIntro:
      'Chargez un fichier CSV, vérifiez les colonnes, puis construisez vos graphiques. Vos données restent sur votre appareil : rien n\'est envoyé sur un serveur.',
    steps: {
      import: 'Importer',
      describe: 'Vérifier',
      visualize: 'Visualiser',
      export: 'Exporter',
    },
    import: {
      dropTitle: 'Déposez un fichier CSV ici',
      dropHint: 'ou',
      browse: 'Parcourir…',
      pasteLabel: 'Coller des données (CSV, séparées par des virgules, points-virgules ou tabulations)',
      pasteButton: 'Utiliser ce texte',
      sampleButton: 'Charger un exemple',
      parsing: 'Lecture du fichier…',
      errorPrefix: 'Impossible de lire le fichier : ',
      emptyError: 'Aucune donnée exploitable trouvée.',
      privacyNote: 'Traitement 100 % local — aucune donnée conservée ni transmise.',
      openProject: 'Ou rouvrir un projet déjà exporté (.json)',
    },
    describe: {
      title: 'Vérifier les colonnes',
      headerToggle: 'La première ligne contient les noms de colonnes',
      rowsCount: (n) => `${n.toLocaleString('fr-FR')} ligne${n > 1 ? 's' : ''}`,
      colsCount: (n) => `${n} colonne${n > 1 ? 's' : ''}`,
      typeColumn: 'Type',
      detected: 'détecté',
      problemsTitle: 'Points à vérifier',
      noProblems: 'Aucune anomalie détectée sur les types.',
      nonConforming: (name, count, examples) =>
        `« ${name} » : ${count} valeur${count > 1 ? 's' : ''} non conforme${count > 1 ? 's' : ''} au type` +
        (examples.length ? ` (ex. ${examples.map((e) => `« ${e} »`).join(', ')})` : ''),
      previewNote: (shown, total) =>
        total > shown
          ? `Aperçu des ${shown.toLocaleString('fr-FR')} premières lignes sur ${total.toLocaleString('fr-FR')}.`
          : `Aperçu de l'ensemble des ${total.toLocaleString('fr-FR')} lignes.`,
      back: 'Changer de fichier',
      next: 'Continuer',
    },
    visualize: {
      viewLabel: 'Type de graphique',
      axisX: 'Axe horizontal (X)',
      axisY: 'Valeur (Y)',
      series: 'Série (couleur)',
      noSeries: 'Aucune',
      aggregation: 'Agrégation',
      back: 'Retour',
      next: 'Continuer',
      mapLoading: 'Chargement des frontières régionales…',
      mapError: 'Impossible de charger les frontières régionales.',
    },
    filters: {
      title: 'Filtres',
      add: '+ Ajouter un filtre',
      empty: 'Aucun filtre : toutes les lignes sont incluses.',
      remove: 'Retirer le filtre',
      min: 'Min',
      max: 'Max',
      all: 'Tout',
      none: 'Rien',
      inactive: 'inactif',
    },
    refine: {
      title: 'Personnaliser',
      chartTitle: 'Titre du graphique',
      note: 'Note / sous-titre',
      sourceName: 'Source (nom)',
      sourceUrl: 'Source (URL)',
      byline: 'Mention',
      decimals: 'Décimales',
      auto: 'Auto',
      thousands: 'Séparateur de milliers',
      legend: 'Afficher la légende',
      palette: 'Palette',
      palettes: { default: 'Défaut', vives: 'Vives', sobre: 'Sobre' },
      annotations: 'Lignes de référence',
      addAnnotation: '+ Ajouter',
      annotationsHint: 'Trace une ligne horizontale (seuil, moyenne, objectif…).',
      atValue: 'À la valeur',
      annotationLabel: 'Étiquette',
      remove: 'Retirer',
    },
    export: {
      resolution: 'Résolution',
      downloadPng: 'Télécharger le PNG',
      downloadJson: 'Télécharger le projet (JSON)',
      donePng: 'Image téléchargée.',
      doneJson: 'Projet téléchargé.',
      note: 'Généré dans votre navigateur — aucun envoi réseau.',
      back: 'Retour',
    },
  },
  en: {
    pageTitle: 'Visualize your data',
    pageIntro:
      'Load a CSV file, check the columns, then build your charts. Your data stays on your device: nothing is sent to a server.',
    steps: {
      import: 'Import',
      describe: 'Check',
      visualize: 'Visualize',
      export: 'Export',
    },
    import: {
      dropTitle: 'Drop a CSV file here',
      dropHint: 'or',
      browse: 'Browse…',
      pasteLabel: 'Paste data (CSV, separated by commas, semicolons or tabs)',
      pasteButton: 'Use this text',
      sampleButton: 'Load a sample',
      parsing: 'Reading file…',
      errorPrefix: 'Could not read the file: ',
      emptyError: 'No usable data found.',
      privacyNote: '100% local processing — no data stored or transmitted.',
      openProject: 'Or reopen an already exported project (.json)',
    },
    describe: {
      title: 'Check the columns',
      headerToggle: 'The first row contains column names',
      rowsCount: (n) => `${n.toLocaleString('en-US')} row${n > 1 ? 's' : ''}`,
      colsCount: (n) => `${n} column${n > 1 ? 's' : ''}`,
      typeColumn: 'Type',
      detected: 'detected',
      problemsTitle: 'Things to check',
      noProblems: 'No type anomalies detected.',
      nonConforming: (name, count, examples) =>
        `"${name}": ${count} value${count > 1 ? 's' : ''} not matching the type` +
        (examples.length ? ` (e.g. ${examples.map((e) => `"${e}"`).join(', ')})` : ''),
      previewNote: (shown, total) =>
        total > shown
          ? `Preview of the first ${shown.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} rows.`
          : `Preview of all ${total.toLocaleString('en-US')} rows.`,
      back: 'Change file',
      next: 'Continue',
    },
    visualize: {
      viewLabel: 'Chart type',
      axisX: 'Horizontal axis (X)',
      axisY: 'Value (Y)',
      series: 'Series (color)',
      noSeries: 'None',
      aggregation: 'Aggregation',
      back: 'Back',
      next: 'Continue',
      mapLoading: 'Loading regional boundaries…',
      mapError: 'Could not load regional boundaries.',
    },
    filters: {
      title: 'Filters',
      add: '+ Add a filter',
      empty: 'No filter: all rows are included.',
      remove: 'Remove filter',
      min: 'Min',
      max: 'Max',
      all: 'All',
      none: 'None',
      inactive: 'inactive',
    },
    refine: {
      title: 'Customize',
      chartTitle: 'Chart title',
      note: 'Note / subtitle',
      sourceName: 'Source (name)',
      sourceUrl: 'Source (URL)',
      byline: 'Byline',
      decimals: 'Decimals',
      auto: 'Auto',
      thousands: 'Thousands separator',
      legend: 'Show legend',
      palette: 'Palette',
      palettes: { default: 'Default', vives: 'Bright', sobre: 'Muted' },
      annotations: 'Reference lines',
      addAnnotation: '+ Add',
      annotationsHint: 'Draws a horizontal line (threshold, average, target…).',
      atValue: 'At value',
      annotationLabel: 'Label',
      remove: 'Remove',
    },
    export: {
      resolution: 'Resolution',
      downloadPng: 'Download PNG',
      downloadJson: 'Download project (JSON)',
      donePng: 'Image downloaded.',
      doneJson: 'Project downloaded.',
      note: 'Generated in your browser — nothing sent over the network.',
      back: 'Back',
    },
  },
}

export function useStudioText() {
  const { language } = useLanguage()
  return TEXT[language] || TEXT.fr
}

export { TEXT as STUDIO_TEXT }
