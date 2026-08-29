import type { Lang } from "@/lib/i18n";

export interface Hotel {
  slug: string;
  name: string;
  area: string;
  city: string;
  kw: string;
  kwNum: number;
  dc: boolean;
  conn: string;
  phase: { fr: string; en: string };
  cableProvided: boolean;
  ver: string;
  warn: boolean;
  guar: boolean;
  points: number;
  rooms: number;
  nearby: number;
  stars: string;
  score: string;
  price: string;
  priceNum: number;
  photo: { fr: string; en: string };
  mx: string;
  my: string;
  /** Éditorial de la fiche. */
  envie: { fr: string; en: string };
  why: { fr: string; en: string };
  dinner: { fr: string; en: string };
  around: { fr: string; en: string };
  night: { fr: string; en: string };
  nightTitle: { fr: string; en: string };
  socStart: number;
  socTimes: { from: string; to: string };
}

/** Prototype : données de démonstration, alignées sur le canvas de design. */
export const HOTELS: Hotel[] = [
  {
    slug: "domaine-de-lugaigne",
    name: "Domaine de Lugaigne",
    area: "Mérignac",
    city: "Bordeaux",
    kw: "DC 50",
    kwNum: 50,
    dc: true,
    conn: "CCS2",
    phase: { fr: "courant continu", en: "direct current" },
    cableProvided: true,
    ver: "✓ 06/26",
    warn: false,
    guar: true,
    points: 2,
    rooms: 12,
    nearby: 12,
    stars: "★★★★★",
    score: "9,4 (58)",
    price: "214 €",
    priceNum: 214,
    photo: { fr: "orangerie, fin de journée", en: "orangery, late afternoon" },
    mx: "61%",
    my: "34%",
    envie: {
      fr: "Une orangerie du dix-neuvième au bout d’un parc, douze chambres, et le calme d’une campagne posée à dix minutes de l’aéroport. On arrive tard, on branche devant l’orangerie, on repart tôt sans y penser.",
      en: "A nineteenth-century orangery at the end of a park, twelve rooms, and the quiet of open country ten minutes from the airport. Arrive late, plug in by the orangery, leave early without thinking about it.",
    },
    why: {
      fr: "C’est la seule adresse de l’agglomération avec du courant continu sur son propre parking. Pour une arrivée à vingt-trois heures suivie d’un départ à sept, c’est la seule qui garantit un plein sans dépendre de la durée de la nuit.",
      en: "It is the only address in the area with direct current on its own car park. For an eleven o’clock arrival followed by a seven o’clock start, it is the only one that guarantees a full battery without depending on how long the night is.",
    },
    dinner: {
      fr: "Table du domaine ouverte tous les soirs sauf le dimanche, produits du Médoc, service jusqu’à vingt-deux heures.",
      en: "Estate table open every evening except Sunday, Médoc produce, service until ten.",
    },
    around: {
      fr: "La rocade à six minutes, l’aéroport à dix, le centre de Bordeaux à vingt en tram depuis Quatre-Chemins.",
      en: "The ring road six minutes away, the airport ten, central Bordeaux twenty by tram from Quatre-Chemins.",
    },
    night: {
      fr: "Limité par l’acceptation de charge du véhicule, pas par la borne. Batterie de référence 77 kWh, consommation 18 kWh/100 km.",
      en: "Limited by the car acceptance rate, not by the charger. Reference battery 77 kWh, consumption 18 kWh/100 km.",
    },
    nightTitle: {
      fr: "45 min sur place × 50 kW = environ 200 km récupérés",
      en: "45 min on site × 50 kW = about 200 km recovered",
    },
    socStart: 18,
    socTimes: { from: "18 % · 22 h 50", to: "100 % · 23 h 55" },
  },
  {
    slug: "hotel-sainte-croix",
    name: "Hôtel Sainte-Croix",
    area: "Chartrons",
    city: "Bordeaux",
    kw: "22 kW",
    kwNum: 22,
    dc: false,
    conn: "Type 2",
    phase: { fr: "AC triphasé", en: "three-phase AC" },
    cableProvided: false,
    ver: "✓ 06/26",
    warn: false,
    guar: true,
    points: 2,
    rooms: 24,
    nearby: 16,
    stars: "★★★★",
    score: "9,1 (64)",
    price: "168 €",
    priceNum: 168,
    photo: { fr: "cour intérieure, 20 h", en: "inner courtyard, 8pm" },
    mx: "38%",
    my: "52%",
    envie: {
      fr: "Une maison de négociant du dix-huitième, six chambres sur une cour pavée, et le meilleur dîner des Chartrons au rez-de-chaussée. On arrive à la nuit, on branche dans la cour, on ne ressort plus.",
      en: "An eighteenth-century merchant house, six rooms around a paved courtyard, and the best dinner in Chartrons on the ground floor. You arrive after dark, plug in the courtyard, and stay put.",
    },
    why: {
      fr: "Bordeaux se traverse mal et se dort bien. À six heures d’Amsterdam et trois de l’Espagne, l’arrêt tombe juste, et les Chartrons sont le seul quartier où l’on peut se garer, dîner et marcher le long du fleuve sans reprendre la voiture. L’hôtel ferme sa porte cochère à minuit : la voiture charge derrière, à l’abri.",
      en: "Bordeaux is bad to drive through and good to sleep in. Six hours from Amsterdam and three from Spain, the stop falls right, and Chartrons is the one district where you can park, dine and walk the river without touching the car again. The carriage door shuts at midnight: the car charges behind it, sheltered.",
    },
    dinner: {
      fr: "Table de l’hôtel ouverte du mardi au samedi, une seule ardoise, produits du marché des Capucins. Réservez en arrivant, douze couverts seulement.",
      en: "Hotel table open Tuesday to Saturday, one blackboard menu, produce from the Capucins market. Book on arrival, twelve covers only.",
    },
    around: {
      fr: "Les quais à deux rues, le marché à sept minutes, le tram B pour le centre. La sortie sur la rocade est à quatre minutes, sans traverser la ville.",
      en: "The quays two streets away, the market seven minutes, tram B to the centre. The ring road is four minutes out, without crossing town.",
    },
    night: {
      fr: "Limité par l’acceptation de charge du véhicule, pas par la borne. Batterie de référence 77 kWh, consommation 18 kWh/100 km.",
      en: "Limited by the car acceptance rate, not by the charger. Reference battery 77 kWh, consumption 18 kWh/100 km.",
    },
    nightTitle: {
      fr: "13 h sur place × 22 kW = environ 340 km récupérés",
      en: "13 h on site × 22 kW = about 340 km recovered",
    },
    socStart: 22,
    socTimes: { from: "22 % · 19 h 40", to: "100 % · 08 h 10" },
  },
  {
    slug: "maison-fondaudege",
    name: "Maison Fondaudège",
    area: "Fondaudège",
    city: "Bordeaux",
    kw: "11 kW",
    kwNum: 11,
    dc: false,
    conn: "Type 2",
    phase: { fr: "AC triphasé", en: "three-phase AC" },
    cableProvided: true,
    ver: "✓ 05/26",
    warn: false,
    guar: false,
    points: 1,
    rooms: 5,
    nearby: 9,
    stars: "★★★★",
    score: "9,3 (31)",
    price: "196 €",
    priceNum: 196,
    photo: { fr: "salon, feu allumé", en: "sitting room, fire lit" },
    mx: "52%",
    my: "68%",
    envie: {
      fr: "Cinq chambres dans un hôtel particulier, un salon avec cheminée et un jardin clos que l’on ne soupçonne pas depuis la rue. La plus belle adresse de la sélection, et la seule borne est unique.",
      en: "Five rooms in a private mansion, a sitting room with a fireplace and a walled garden you would never guess from the street. The finest address in the selection, and the single charger is exactly that: single.",
    },
    why: {
      fr: "On y vient pour la maison, pas pour la borne. Une seule place, non attribuée : à réserver en appelant, ou à jouer en arrivant avant dix-huit heures. Neuf bornes publiques à moins de dix minutes à pied servent de repli.",
      en: "You come for the house, not for the charger. One bay, not allocated: call ahead, or take your chances by arriving before six. Nine public chargers within a ten-minute walk act as a fallback.",
    },
    dinner: {
      fr: "Pas de table sur place. Les Chartrons et le triangle d’or sont à un quart d’heure à pied.",
      en: "No table on site. Chartrons and the golden triangle are a fifteen-minute walk away.",
    },
    around: {
      fr: "Jardin public à trois rues, tram C à cinq minutes, quartier calme le soir.",
      en: "Public gardens three streets away, tram C five minutes, quiet at night.",
    },
    night: {
      fr: "Limité par l’acceptation de charge du véhicule, pas par la borne. Batterie de référence 77 kWh, consommation 18 kWh/100 km.",
      en: "Limited by the car acceptance rate, not by the charger. Reference battery 77 kWh, consumption 18 kWh/100 km.",
    },
    nightTitle: {
      fr: "13 h sur place × 11 kW = environ 300 km récupérés",
      en: "13 h on site × 11 kW = about 300 km recovered",
    },
    socStart: 26,
    socTimes: { from: "26 % · 19 h 10", to: "100 % · 07 h 40" },
  },
  {
    slug: "villa-bacalan",
    name: "Villa Bacalan",
    area: "Bacalan",
    city: "Bordeaux",
    kw: "22 kW",
    kwNum: 22,
    dc: false,
    conn: "Type 2",
    phase: { fr: "AC triphasé", en: "three-phase AC" },
    cableProvided: false,
    ver: "03/25",
    warn: true,
    guar: false,
    points: 2,
    rooms: 26,
    nearby: 7,
    stars: "★★★",
    score: "8,6 (77)",
    price: "178 €",
    priceNum: 178,
    photo: { fr: "terrasse sur les bassins", en: "terrace over the basins" },
    mx: "30%",
    my: "78%",
    envie: {
      fr: "Une villa des années trente face aux bassins à flot, terrasse au premier étage et vue sur les grues. Le quartier a changé plus vite que la fiche : les deux bornes datent de mars 2025 et n’ont pas été reconfirmées.",
      en: "A nineteen-thirties villa facing the wet docks, first-floor terrace and a view of the cranes. The district has changed faster than the page: the two chargers date from March 2025 and have not been reconfirmed.",
    },
    why: {
      fr: "L’adresse vaut le détour pour la vue et pour la Cité du Vin à pied. Sur la charge, considérez la fiche comme une piste et non comme une garantie : appelez avant de compter dessus.",
      en: "Worth it for the view and for walking to the Cité du Vin. On charging, treat this page as a lead rather than a guarantee: call before relying on it.",
    },
    dinner: {
      fr: "Bistrot du port à deux cents mètres, cuisine jusqu’à vingt-deux heures trente.",
      en: "Harbour bistro two hundred metres away, kitchen until half past ten.",
    },
    around: {
      fr: "Cité du Vin à huit minutes à pied, sept bornes publiques autour des bassins.",
      en: "Cité du Vin an eight-minute walk, seven public chargers around the docks.",
    },
    night: {
      fr: "Information non reconfirmée depuis mars 2025. Le calcul reste indicatif tant que l’hôtel n’a pas répondu.",
      en: "Not reconfirmed since March 2025. The figures stay indicative until the hotel replies.",
    },
    nightTitle: {
      fr: "13 h sur place × 22 kW = environ 340 km récupérés",
      en: "13 h on site × 22 kW = about 340 km recovered",
    },
    socStart: 30,
    socTimes: { from: "30 % · 19 h 30", to: "100 % · 08 h 00" },
  },
  {
    slug: "le-palus",
    name: "Le Palus",
    area: "Saint-Michel",
    city: "Bordeaux",
    kw: "7,4 kW",
    kwNum: 7.4,
    dc: false,
    conn: "Type 2",
    phase: { fr: "AC monophasé", en: "single-phase AC" },
    cableProvided: false,
    ver: "✓ 02/26",
    warn: false,
    guar: false,
    points: 1,
    rooms: 18,
    nearby: 21,
    stars: "★★★",
    score: "8,4 (112)",
    price: "132 €",
    priceNum: 132,
    photo: { fr: "chambre sur rue, matin", en: "street-side room, morning" },
    mx: "70%",
    my: "60%",
    envie: {
      fr: "Petit hôtel de quartier derrière la flèche Saint-Michel, chambres simples et tenues, le meilleur rapport qualité-prix de la ville pour une nuit de passage.",
      en: "A small neighbourhood hotel behind the Saint-Michel spire, simple well-kept rooms, the best value in town for a one-night stop.",
    },
    why: {
      fr: "Une borne de 7,4 kW pour dix-huit chambres : c’est peu, mais sur une nuit complète cela suffit à la plupart des voitures. Vingt et une bornes publiques à moins de dix minutes, le quartier est le mieux équipé de Bordeaux.",
      en: "One 7.4 kW charger for eighteen rooms: not much, but over a full night it is enough for most cars. Twenty-one public chargers within ten minutes make this the best-served district in Bordeaux.",
    },
    dinner: {
      fr: "Marché des Capucins à trois minutes, tables ouvertes tard tout autour de la place.",
      en: "Capucins market three minutes away, tables open late all around the square.",
    },
    around: {
      fr: "Gare Saint-Jean à dix minutes à pied, hypercentre à quinze.",
      en: "Saint-Jean station a ten-minute walk, city centre fifteen.",
    },
    night: {
      fr: "Limité par la puissance de la borne. Batterie de référence 77 kWh, consommation 18 kWh/100 km.",
      en: "Limited by the charger itself. Reference battery 77 kWh, consumption 18 kWh/100 km.",
    },
    nightTitle: {
      fr: "13 h sur place × 7,4 kW = environ 250 km récupérés",
      en: "13 h on site × 7.4 kW = about 250 km recovered",
    },
    socStart: 34,
    socTimes: { from: "34 % · 19 h 20", to: "96 % · 08 h 20" },
  },
];

export const NO_CHARGER = { name: "Hôtel des Quinconces", price: "148 €" };

export const hotelBySlug = (slug: string) => HOTELS.find((h) => h.slug === slug);

export function localized<T>(v: { fr: T; en: T }, lang: Lang): T {
  return v[lang];
}
