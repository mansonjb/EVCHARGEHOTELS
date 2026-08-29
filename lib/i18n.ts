/** Copie verbatim du canvas Claude Design (PlugStays v3.dc.html). */

export type Lang = "fr" | "en";
export const LANGS: Lang[] = ["fr", "en"];

export const STR = {
  fr: {
    search: "Chercher",
    allChargers: "Toutes les bornes",
    guaranteedChip: "Place garantie",
    filters: "Filtres",
    mapShow: "Afficher la carte",
    mapHide: "Masquer la carte",
    mapMobile: "Voir sur la carte",
    listH1: "Hôtels où recharger",
    listH1b: "la nuit",
    verifiedNote: "vérifiés sur place, 06/2026",
    showChargers: "Bornes publiques",
    noCharger: "pas de borne sur site",
    proofTitle: "CE QUE NOUS AVONS VÉRIFIÉ SUR PLACE",
    stamp: "vérifié 06/2026",
    lPower: "PUISSANCE",
    lConn: "CONNECTEUR",
    lPoints: "BORNES",
    lAccess: "ACCÈS",
    guaranteed: "garanti",
    cableNote: "câble non fourni",
    accessNote: "place attribuée au check-in",
    nightHint: "le calcul de nuit",
    perNight: "la nuit, charge incluse",
    arrive: "arrivée",
    depart: "départ",
    plugRow: "borne",
    book: "Réserver",
    bookNote:
      "Annulation gratuite jusqu’à 18 h la veille. La place de charge est bloquée avec la chambre.",
    morePhotos: "+ 9 photos",
    mapTitle: "CARTE · EMPLACEMENT À BRANCHER",
    publicChargers: "bornes publiques",
  },
  en: {
    search: "Search",
    allChargers: "All chargers",
    guaranteedChip: "Guaranteed bay",
    filters: "Filters",
    mapShow: "Show map",
    mapHide: "Hide map",
    mapMobile: "See on map",
    listH1: "Hotels that charge",
    listH1b: "overnight",
    verifiedNote: "checked on site, 06/2026",
    showChargers: "Public chargers",
    noCharger: "no charger on site",
    proofTitle: "WHAT WE CHECKED ON SITE",
    stamp: "verified 06/2026",
    lPower: "POWER",
    lConn: "CONNECTOR",
    lPoints: "POINTS",
    lAccess: "ACCESS",
    guaranteed: "guaranteed",
    cableNote: "cable not provided",
    accessNote: "bay assigned at check-in",
    nightHint: "the overnight maths",
    perNight: "per night, charging included",
    arrive: "arrive",
    depart: "depart",
    plugRow: "charger",
    book: "Book",
    bookNote:
      "Free cancellation until 6pm the day before. The charging bay is held with the room.",
    morePhotos: "+ 9 photos",
    mapTitle: "MAP · WHERE YOU PLUG IN",
    publicChargers: "public chargers",
  },
} as const;

export const HOME = {
  fr: {
    nav: { home: "Accueil", list: "Résultats", hotel: "Fiche hôtel" },
    eyebrow: "INFOS DE CHARGE DÉTAILLÉES ET DATÉES",
    h1a: "Dormir quelque part",
    h1b: "où la voiture recharge",
    lede:
      "PlugStays rassemble les informations de charge des hôtels au même endroit : puissance annoncée, type de connecteur, nombre de points, conditions d’accès à la place. Chaque fiche porte la date de sa dernière mise à jour, pour que vous sachiez ce que vous lisez.",
    searchNote: "Ville et dates, puis les fiches détaillées.",
    statsNote: "Prototype : le catalogue et les données sont en cours de constitution.",
    stats: [
      { n: "kW", l: "la puissance annoncée et ce qu’elle donne sur une nuit" },
      { n: "Type", l: "le connecteur, et si le câble est fourni ou à apporter" },
      { n: "Accès", l: "place attribuée, en libre-service, ou partagée" },
    ],
    stepsH: "Les types de borne, et ce qu’ils donnent sur une nuit",
    stepsNote: "Nuit de référence : treize heures branché, batterie 77 kWh.",
    steps: [
      {
        n: "2,3 kW",
        h: "Prise domestique",
        p: "Une prise renforcée sur le parking, sans borne. Une trentaine de kilomètres récupérés sur la nuit : du dépannage, pas une étape de trajet.",
      },
      {
        n: "7,4 kW",
        h: "Type 2 monophasé",
        p: "Le cas le plus courant en hôtel. Une batterie presque pleine au matin, à condition de brancher en arrivant et non après le dîner.",
      },
      {
        n: "11 – 22 kW",
        h: "Type 2 triphasé",
        p: "Batterie pleine en cinq à sept heures, le reste de la nuit sert de marge. Attention : beaucoup de voitures plafonnent à 11 kW en courant alternatif.",
      },
      {
        n: "50 kW +",
        h: "CCS courant continu",
        p: "Rare en hôtel et presque toujours facturé au kWh. Intéressant pour une arrivée tardive suivie d’un départ tôt le matin.",
      },
    ],
    checksH: "Ce que chaque fiche indique",
    checksP:
      "Six points suffisent à savoir si la nuit fera le travail. Quand un point n’est pas renseigné, la fiche le laisse vide plutôt que de le deviner.",
    checks: [
      {
        k: "PUISSANCE",
        h: "Ce qui est annoncé",
        p: "Monophasé ou triphasé, et le calcul de ce que cette puissance donne sur une nuit de treize heures.",
      },
      {
        k: "CONNECTEUR",
        h: "Type 2, CCS, ou prise",
        p: "Le type déclaré, et si le câble vient de l’hôtel ou de vous. Une prise domestique est signalée comme telle.",
      },
      {
        k: "ACCÈS",
        h: "Place garantie ou non",
        p: "Attribuée avec la chambre, en libre-service, ou partagée avec les résidents. La différence se voit à vingt-deux heures.",
      },
      {
        k: "GABARIT",
        h: "Si la voiture passe",
        p: "Hauteur sous plafond et longueur de place, quand l’hôtel les a renseignées.",
      },
      {
        k: "NUIT",
        h: "Portail et éclairage",
        p: "Heure de fermeture et éclairage de la place, pour savoir dans quoi on branche à la nuit.",
      },
      {
        k: "ALENTOURS",
        h: "Bornes publiques",
        p: "Les bornes à moins de dix minutes à pied, avec leur puissance, en solution de repli.",
      },
    ],
    mathK: "LE CALCUL DE NUIT",
    mathH: "Une nuit à 22 kW vaut mieux qu’un arrêt de trente minutes",
    mathP:
      "Une arrivée à dix-neuf heures et un départ à huit heures laissent treize heures de branchement. À cette puissance, la voiture ne charge pas vite : elle charge longtemps, ce qui revient au même le matin, sans temps mort dans la journée.",
    mathNote:
      "Calcul indicatif : batterie 77 kWh, consommation 18 kWh/100 km, charge limitée par l’acceptation AC du véhicule. Votre voiture peut donner un résultat différent.",
    math: [
      { l: "Temps sur place", v: "13 h" },
      { l: "Puissance annoncée", v: "22 kW" },
      { l: "Énergie récupérée", v: "≈ 62 kWh" },
      { l: "Autonomie au matin", v: "≈ 340 km" },
    ],
    citiesH: "Villes en cours d’ouverture",
    citiesNote: "Prototype : Bordeaux est la seule ville renseignée pour l’instant.",
    cities: [
      { name: "Bordeaux", n: "5 fiches", tag: "ouvert" },
      { name: "Nantes", n: "à renseigner", tag: "en cours" },
      { name: "Toulouse", n: "à renseigner", tag: "en cours" },
      { name: "Marseille", n: "à renseigner", tag: "en cours" },
      { name: "Saint-Sébastien", n: "à renseigner", tag: "à venir" },
      { name: "Anvers", n: "à renseigner", tag: "à venir" },
    ],
    faqH: "Questions que l’on nous pose",
    faq: [
      {
        q: "La place de charge est-elle réservée avec la chambre ?",
        a: "Seulement si la fiche porte la mention « place garantie » : dans ce cas l’hôtel s’est engagé à l’attribuer au check-in. Sinon, la fiche donne le nombre de points et laisse le risque d’attente visible.",
      },
      {
        q: "Les informations sont-elles vérifiées par vos équipes ?",
        a: "Non. Elles viennent de l’hôtel, des bases de bornes publiques et des retours de voyageurs. Chaque champ porte sa source et sa date, et une information contredite passe en « à reconfirmer ».",
      },
      {
        q: "Que faire si la borne est en panne à l’arrivée ?",
        a: "La fiche liste les bornes publiques à proximité et leur puissance. Signalez la panne depuis votre réservation : la fiche est mise à jour et l’hôtel recontacté.",
      },
      {
        q: "La recharge est-elle incluse dans le prix ?",
        a: "Cela dépend de l’hôtel. Quand la charge est facturée, le tarif annoncé figure sur la fiche ; quand l’hôtel ne l’a pas communiqué, la fiche reste vide.",
      },
    ],
    ctaH: "Trouvez une étape où la nuit fait le travail",
    ctaP: "Bordeaux, 12 – 13 juin : 5 fiches détaillées.",
    ctaBtn: "Voir les hôtels",
  },
  en: {
    nav: { home: "Home", list: "Results", hotel: "Hotel page" },
    eyebrow: "CHARGING DETAILS, DATED AND SOURCED",
    h1a: "Sleep somewhere",
    h1b: "the car charges too",
    lede:
      "PlugStays gathers hotel charging details in one place: stated power, connector type, number of points, how the bay is allocated. Every page carries the date of its last update, so you know what you are reading.",
    searchNote: "City and dates, then the detailed pages.",
    statsNote: "Prototype: the catalogue and the data are still being built.",
    stats: [
      { n: "kW", l: "the stated power and what it gives over a night" },
      { n: "Type", l: "the connector, and whether the cable is provided" },
      { n: "Access", l: "bay assigned, first come, or shared" },
    ],
    stepsH: "Charger types, and what each gives over a night",
    stepsNote: "Reference night: thirteen hours plugged in, 77 kWh battery.",
    steps: [
      {
        n: "2.3 kW",
        h: "Domestic socket",
        p: "A reinforced socket in the car park, no charger unit. Around twenty miles back overnight: a fallback, not a planned stop.",
      },
      {
        n: "7.4 kW",
        h: "Single-phase Type 2",
        p: "The most common case in hotels. Near-full battery by morning, provided you plug in on arrival rather than after dinner.",
      },
      {
        n: "11 – 22 kW",
        h: "Three-phase Type 2",
        p: "Full battery in five to seven hours, the rest of the night is margin. Note that many cars cap at 11 kW on AC.",
      },
      {
        n: "50 kW +",
        h: "CCS direct current",
        p: "Rare at hotels and almost always billed per kWh. Worth it for a late arrival followed by an early start.",
      },
    ],
    checksH: "What every page states",
    checksP:
      "Six points are enough to know whether the night will do the work. Where a point is unknown, the page leaves it blank rather than guessing.",
    checks: [
      {
        k: "POWER",
        h: "What is stated",
        p: "Single or three-phase, and the arithmetic of what that power gives over a thirteen-hour night.",
      },
      {
        k: "CONNECTOR",
        h: "Type 2, CCS, or a socket",
        p: "The declared type, and whether the cable comes from the hotel or from you. A domestic socket is flagged as one.",
      },
      {
        k: "ACCESS",
        h: "Guaranteed bay or not",
        p: "Held with the room, first come, or shared with residents. The difference shows up at ten at night.",
      },
      {
        k: "CLEARANCE",
        h: "Whether the car fits",
        p: "Ceiling height and bay length, where the hotel has provided them.",
      },
      {
        k: "NIGHT",
        h: "Gate and lighting",
        p: "Closing time and lighting over the bay, so you know what you are plugging into after dark.",
      },
      {
        k: "AROUND",
        h: "Public chargers",
        p: "Chargers within a ten-minute walk, with their power, as a fallback.",
      },
    ],
    mathK: "THE OVERNIGHT MATHS",
    mathH: "A night at 22 kW beats a thirty-minute stop",
    mathP:
      "Arriving at seven and leaving at eight leaves thirteen hours plugged in. At that power the car does not charge fast: it charges long, which comes to the same thing by morning, with no dead time during the day.",
    mathNote:
      "Indicative figures: 77 kWh battery, 18 kWh/100 km, charging capped by the car AC acceptance rate. Your car may give a different result.",
    math: [
      { l: "Time on site", v: "13 h" },
      { l: "Stated power", v: "22 kW" },
      { l: "Energy recovered", v: "≈ 62 kWh" },
      { l: "Range by morning", v: "≈ 340 km" },
    ],
    citiesH: "Cities being opened",
    citiesNote: "Prototype: Bordeaux is the only city with data so far.",
    cities: [
      { name: "Bordeaux", n: "5 pages", tag: "open" },
      { name: "Nantes", n: "to be filled", tag: "in progress" },
      { name: "Toulouse", n: "to be filled", tag: "in progress" },
      { name: "Marseille", n: "to be filled", tag: "in progress" },
      { name: "San Sebastián", n: "to be filled", tag: "planned" },
      { name: "Antwerp", n: "to be filled", tag: "planned" },
    ],
    faqH: "Questions we get",
    faq: [
      {
        q: "Is the charging bay booked with the room?",
        a: 'Only where the page says "guaranteed bay": there the hotel has committed to assigning it at check-in. Otherwise the page gives the number of points and leaves the risk of waiting visible.',
      },
      {
        q: "Do your teams verify the information?",
        a: 'No. It comes from the hotel, from public charger datasets and from guest reports. Each field carries its source and date, and contradicted information moves to "to reconfirm".',
      },
      {
        q: "What if the charger is down on arrival?",
        a: "The page lists nearby public chargers and their power. Report the fault from your booking: the page is updated and the hotel contacted.",
      },
      {
        q: "Is charging included in the price?",
        a: "It depends on the hotel. Where charging is billed, the stated price appears on the page; where the hotel has not told us, the field stays empty.",
      },
    ],
    ctaH: "Find a stop where the night does the work",
    ctaP: "Bordeaux, 12 – 13 June: 5 detailed pages.",
    ctaBtn: "See the hotels",
  },
} as const;
