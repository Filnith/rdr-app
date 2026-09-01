// Données de réduction des risques.
// Sources générales de référence (à consulter pour aller plus loin) :
// TripSit, Drugs and Me, PsychonautWiki, Fêtez Clairs (AIDES), ASUD, Techno+.
// Ces informations sont indicatives et ne remplacent pas un avis médical.

const SUBSTANCES = [
  {
    id: 'alcool',
    name: 'Alcool',
    category: 'Dépresseur',
    color: '#38bdf8',
    icon: '<path d="M4 4h16l-8 9-8-9z"/><path d="M12 13v7"/><path d="M8 20h8"/>',
    illustration: 'alcool.jpg',
    dureeEffets: '1 à 3h par verre (variable selon corpulence, sexe, tolérance)',
    minIntervalMin: 60,
    criticalDoseTotal: 5,
    conseilRedose: 'Pas plus d\'un verre standard par heure. Boire de l\'eau entre les verres, manger avant.',
    effets: 'Désinhibition, euphorie, relâchement musculaire. À doses élevées : troubles de l\'équilibre, vomissements, coma éthylique.',
    signesDanger: 'Perte de connaissance, respiration lente ou irrégulière, vomissements en position allongée sur le dos, peau froide et pâle/bleutée.',
    conduite: 'Mettre en Position Latérale de Sécurité si la personne est inconsciente mais respire. Ne jamais laisser seule une personne très alcoolisée. Appeler le 15 en cas de doute.'
  },
  {
    id: 'mdma',
    name: 'MDMA / Ecstasy',
    category: 'Stimulant empathogène',
    color: '#f472b6',
    icon: '<circle cx="12" cy="12" r="7"/><path d="M12 8.5v7M8.5 12h7" stroke-width="1.4"/>',
    illustration: 'mdma.jpg',
    visual: 'mdma-visual.jpg',
    dureeEffets: '3 à 6h (montée 30-60 min)',
    minIntervalMin: 240,
    criticalDoseTotal: 1.5,
    conseilRedose: 'Une reprise ("booster") est déconseillée. Si vous en prenez quand même : attendez au moins 2h, ne prenez pas plus de la moitié de votre dose initiale, et une seule reprise maximum.',
    effets: 'Empathie, euphorie, hausse de l\'énergie et de la température corporelle, mâchoires serrées.',
    signesDanger: 'Hyperthermie (peau brûlante, ne transpire plus), confusion, convulsions, hyponatrémie (trop d\'eau bue sans sel).',
    conduite: 'Faire des pauses au calme et au frais, boire environ un verre d\'eau par heure (pas plus), éviter l\'alcool. En cas d\'hyperthermie ou de convulsions : appeler immédiatement le 15.'
  },
  {
    id: 'cocaine',
    name: 'Cocaïne',
    category: 'Stimulant',
    color: '#e2e8f0',
    icon: '<path d="M7 3h10l1.2 4.5L17 20H7L5.8 7.5z"/><path d="M9 3v3.5M15 3v3.5"/>',
    illustration: 'cocaine.jpg',
    dureeEffets: '20 à 40 min (montée rapide, descente rapide)',
    minIntervalMin: 45,
    criticalDoseTotal: 4,
    conseilRedose: 'La descente rapide pousse souvent à reprendre trop vite : c\'est ce qui cause le plus de risques cardiovasculaires. Espacer au maximum et fixer une limite de quantité totale avant de commencer.',
    effets: 'Euphorie, stimulation, hausse du rythme cardiaque et de la tension artérielle.',
    signesDanger: 'Douleur thoracique, palpitations, essoufflement, confusion, convulsions.',
    conduite: 'Éviter tout effort physique intense. En cas de douleur thoracique ou de palpitations fortes : appeler le 15 sans attendre.'
  },
  {
    id: 'speed',
    name: 'Amphétamines / Speed',
    category: 'Stimulant',
    color: '#facc15',
    icon: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
    illustration: 'speed.jpg',
    dureeEffets: '4 à 6h',
    minIntervalMin: 180,
    criticalDoseTotal: 3,
    conseilRedose: 'Espacer largement les prises, s\'hydrater, prévoir des phases de repos réel après la descente (dette de sommeil).',
    effets: 'Stimulation, énergie, perte d\'appétit, hausse du rythme cardiaque.',
    signesDanger: 'Hyperthermie, tachycardie sévère, anxiété/paranoïa marquée, convulsions.',
    conduite: 'Faire des pauses au frais, s\'hydrater raisonnablement. En cas de signes sévères : appeler le 15.'
  },
  {
    id: 'lsd',
    name: 'LSD',
    category: 'Psychédélique',
    color: '#a78bfa',
    icon: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01" stroke-width="2.6"/>',
    illustration: 'lsd.jpg',
    dureeEffets: '8 à 12h',
    minIntervalMin: 720,
    criticalDoseTotal: 1.5,
    conseilRedose: 'Ne pas reprendre pendant le même trip : la durée des effets est longue et la dose déjà active. Attendre plusieurs jours/semaines avant toute nouvelle prise.',
    effets: 'Hallucinations, altération de la perception du temps et de l\'espace, forte composante émotionnelle.',
    signesDanger: 'Panique intense ("bad trip"), désorientation dangereuse (risque d\'accident), état confusionnel prolongé.',
    conduite: 'Rester dans un environnement sûr et familier, avec une personne de confiance non consommatrice si possible ("trip sitter"). Parler calmement à la personne en cas de bad trip, éviter de la laisser seule ou dans un lieu à risque (route, hauteur, eau).'
  },
  {
    id: 'ketamine',
    name: 'Kétamine',
    category: 'Dissociatif',
    color: '#2dd4bf',
    icon: '<path d="M10 2h4"/><path d="M11 2v6L6.5 16.5A3 3 0 0 0 9.2 21h5.6a3 3 0 0 0 2.7-4.5L13 8V2"/><path d="M8.5 14h7"/>',
    illustration: 'ketamine.jpg',
    dureeEffets: '45 min à 1h30',
    minIntervalMin: 60,
    criticalDoseTotal: 3,
    conseilRedose: 'Effet dissociatif qui altère fortement la coordination : attendre la fin complète des effets avant toute reprise, et jamais debout ou en mouvement.',
    effets: 'Dissociation, sensation de détachement du corps ("trou K" à forte dose), analgésie.',
    signesDanger: 'Incapacité à bouger/parler, vomissements avec risque d\'étouffement (surtout allongé sur le dos), confusion prolongée.',
    conduite: 'Toujours consommer assis ou allongé, dans un lieu sûr, avec quelqu\'un de sobre à proximité. Position Latérale de Sécurité en cas de vomissements ou perte de conscience.'
  },
  {
    id: 'ghb',
    name: 'GHB / GBL',
    category: 'Dépresseur',
    color: '#fb7185',
    icon: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    illustration: 'ghb.jpg',
    dureeEffets: '1h30 à 3h',
    minIntervalMin: 240,
    criticalDoseTotal: 1.5,
    conseilRedose: 'Marge très étroite entre dose recherchée et dose dangereuse : ne jamais redoser "parce que ça ne fait pas encore d\'effet" (l\'effet est retardé). Attendre au minimum plusieurs heures, mesurer précisément les quantités.',
    effets: 'Désinhibition, euphorie, relaxation musculaire.',
    signesDanger: 'Endormissement brutal, perte de connaissance, arrêt respiratoire — particulièrement en association avec l\'alcool.',
    conduite: 'Ne jamais laisser une personne seule après une prise. Position Latérale de Sécurité si inconscience. Appeler le 15 immédiatement en cas de perte de connaissance.'
  },
  {
    id: 'benzo',
    name: 'Benzodiazépines',
    category: 'Dépresseur',
    color: '#818cf8',
    icon: '<rect x="3" y="8.5" width="18" height="7" rx="3.5"/><path d="M12 8.5v7"/>',
    illustration: 'benzo.jpg',
    dureeEffets: '4 à 12h selon la molécule',
    minIntervalMin: 480,
    criticalDoseTotal: 1.5,
    conseilRedose: 'Fort risque d\'accumulation et de dépendance : ne pas redoser sans avis médical, ne jamais associer à l\'alcool ou à d\'autres dépresseurs.',
    effets: 'Anxiolyse, sédation, relâchement musculaire, amnésie possible.',
    signesDanger: 'Somnolence extrême, confusion, dépression respiratoire.',
    conduite: 'Surveiller la respiration, Position Latérale de Sécurité en cas de somnolence extrême. Appeler le 15 en cas de doute.'
  },
  {
    id: 'cannabis',
    name: 'Cannabis',
    category: 'Autre',
    color: '#4ade80',
    icon: '<path d="M12 21c-4.5-3-7.5-7-7.5-11a7.5 7.5 0 0 1 15 0c0 4-3 8-7.5 11z"/><path d="M12 21V6.5"/>',
    illustration: 'cannabis.jpg',
    dureeEffets: '2 à 4h fumé/vapoté ; jusqu\'à 6-8h en comestible (effet retardé 30 min à 2h)',
    minIntervalMin: 30,
    criticalDoseTotal: 3,
    conseilRedose: 'En comestible, attendre au moins 2h avant d\'envisager une reprise : l\'effet est très retardé et souvent sous-estimé au départ.',
    effets: 'Détente, altération sensorielle, augmentation de l\'appétit.',
    signesDanger: 'Anxiété/panique aiguë, tachycardie, vomissements en comestible à forte dose.',
    conduite: 'Rassurer et installer au calme en cas d\'anxiété aiguë ("mauvais trip"). Rarement une urgence vitale seule, mais consulter en cas de vomissements incoercibles ou de malaise cardiaque.'
  }
];

// Matrice d'interactions simplifiée. Niveaux : 'danger' (rouge), 'risque' (orange), 'prudence' (jaune).
// Clé = paire d'ids triée alphabétiquement, séparée par '|'.
const INTERACTIONS = {
  'alcool|benzo': { level: 'danger', message: 'Association dangereuse : dépression respiratoire cumulée, risque de perte de conscience et d\'arrêt respiratoire.' },
  'alcool|ghb': { level: 'danger', message: 'Association dangereuse : très fort risque de perte de conscience et d\'arrêt respiratoire.' },
  'benzo|ghb': { level: 'danger', message: 'Association dangereuse : effets dépresseurs cumulés, risque d\'arrêt respiratoire.' },
  'alcool|cocaine': { level: 'risque', message: 'Risque élevé : formation de cocaéthylène, très toxique pour le cœur.' },
  'alcool|ketamine': { level: 'risque', message: 'Risque élevé : cumul de dépresseurs, forte hausse du risque de vomissement avec étouffement et de perte de conscience.' },
  'cocaine|speed': { level: 'risque', message: 'Risque élevé : cumul de stimulants, forte charge cardiovasculaire.' },
  'ketamine|ghb': { level: 'danger', message: 'Association dangereuse : cumul de dépresseurs/dissociatifs, fort risque de perte de conscience.' },
  'benzo|ketamine': { level: 'risque', message: 'Risque élevé : sédation et perte de coordination fortement accrues.' },
  'alcool|mdma': { level: 'prudence', message: 'Prudence : l\'alcool masque les signaux d\'alerte du corps et accentue la déshydratation.' },
  'cannabis|mdma': { level: 'prudence', message: 'Prudence : peut augmenter l\'anxiété et la tachycardie chez certaines personnes.' },
  'cannabis|lsd': { level: 'prudence', message: 'Prudence : peut amplifier l\'intensité et l\'anxiété de l\'expérience.' },
  'mdma|speed': { level: 'risque', message: 'Risque élevé : cumul de stimulants, forte hausse de la température corporelle et du rythme cardiaque.' }
};

// Options de quantité proposées en un tap, par substance — aucune saisie clavier requise.
const QUANTITY_PRESETS = {
  alcool: ['1 verre', '2 verres', '3 verres', '4 verres', '5+ verres'],
  mdma: ['1/4', '1/2', '3/4', '1 entier', '2 entiers'],
  cocaine: ['1 trait', '2 traits', '3 traits', '~0,25 g', '~0,5 g', '~1 g'],
  speed: ['petite dose', 'dose moyenne', 'grosse dose', '~0,25 g', '~0,5 g'],
  lsd: ['1/2 buvard', '1 buvard', '2 buvards'],
  ketamine: ['1 rail', '2 rails', '~0,1 g', '~0,25 g', '~0,5 g'],
  ghb: ['0,5 ml', '1 ml', '1,5 ml', '2 ml'],
  benzo: ['1/4 comprimé', '1/2 comprimé', '1 comprimé', '2 comprimés'],
  cannabis: ['quelques bouffées', '1 joint', 'comestible — petite part', 'comestible — part entière']
};

// Options rapides pour le moment de la prise (en minutes écoulées), aucune saisie clavier requise.
const TIME_PRESETS = [
  { label: 'Maintenant', offsetMin: 0 },
  { label: 'Il y a 15 min', offsetMin: 15 },
  { label: 'Il y a 30 min', offsetMin: 30 },
  { label: 'Il y a 1h', offsetMin: 60 },
  { label: 'Il y a 2h', offsetMin: 120 }
];

function getSubstance(id) {
  return SUBSTANCES.find(s => s.id === id) || null;
}

function checkInteraction(idA, idB) {
  if (idA === idB) return null;
  const key = [idA, idB].sort().join('|');
  return INTERACTIONS[key] || null;
}

// Génère un badge SVG coloré pour une substance. size: 'sm' | 'md' | 'lg'.
function substanceIconBadge(sub, size) {
  size = size || 'md';
  return '<span class="sub-icon sub-icon-' + size + '" style="background:' + sub.color + '22;color:' + sub.color + '">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + sub.icon + '</svg>' +
    '</span>';
}
