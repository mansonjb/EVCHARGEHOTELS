/**
 * Moteur d'appariement borne <-> hôtel.
 *
 * Aucune source ne dit « cette borne appartient à cet hôtel ». On le déduit
 * par recoupement, et on garde le détail du raisonnement : le score et ses
 * raisons sont affichés sur la fiche, pour que le lecteur puisse juger.
 *
 * Barème (inspiré du protocole convenu) :
 *   +50 adresse identique (numéro + voie)
 *   +40 le nom de la station cite l'hôtel ou sa marque
 *   +30 / +25 / +15 / +8  selon la distance (20, 40, 80, 120 m)
 *   +20 implantation « parking privé réservé à la clientèle »
 *   +10 même code postal
 *   +10 accès réservé aux clients (OSM access=customers, OCM usage privé)
 *   +15 l'hôtel déclare une borne sur Booking
 *
 *   >= 70  borne de l'hôtel
 *   50-69  probable, signalée comme à confirmer
 *   < 50   borne publique du voisinage
 */

export const ON_SITE_SCORE = 70;
export const MAYBE_SCORE = 50;

/** Marques hôtelières : un jeton de marque partagé vaut une preuve de nom. */
const BRANDS = [
  "ibis", "novotel", "mercure", "campanile", "kyriad", "premiere classe", "premiere-classe",
  "best western", "hilton", "marriott", "pullman", "sofitel", "mgallery", "adagio", "okko",
  "moxy", "holiday inn", "radisson", "mama shelter", "citotel", "brit hotel", "the originals",
  "greet", "b&b hotel", "bb hotel", "logis", "kimpton", "crowne plaza", "hampton", "mövenpick",
  "movenpick", "nh hotel", "van der valk", "postillion", "leonardo", "corendon", "premier inn",
];

/** Mots qui ne distinguent rien : ville, catégorie, points cardinaux. */
const STOP = new Set([
  "hotel", "hôtel", "hotels", "appart", "aparthotel", "residence", "résidence", "auberge",
  "maison", "logis", "villa", "domaine", "chateau", "château", "boutique", "studio", "suites",
  "suite", "lodge", "inn", "spa", "resort", "centre", "center", "city", "ville", "gare",
  "aeroport", "aéroport", "airport", "nord", "sud", "east", "ouest", "west", "north", "south",
  "parking", "public", "place", "avenue", "boulevard", "rue", "saint", "sainte", "grand",
  "grande", "petit", "petite", "styles", "budget", "express", "plaza", "palace", "hostel",
]);

export function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(s, extraStop = new Set()) {
  return norm(s)
    .split(" ")
    .filter((w) => w.length > 4 && !STOP.has(w) && !extraStop.has(w));
}

function streetKey(address) {
  const n = norm(address);
  const num = n.match(/\b(\d{1,4})\b/);
  const street = n
    .replace(/\b\d{4,5}\b/g, " ")
    .replace(/\b(rue|avenue|av|boulevard|bd|route|rte|chemin|impasse|allee|quai|place|cours|faubourg)\b/g, " ")
    .split(" ")
    .filter((w) => w.length > 4 && !STOP.has(w));
  return { num: num ? num[1] : null, street };
}

function postcode(address) {
  const m = norm(address).match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

/**
 * @returns {{score:number, reasons:string[], method:string}}
 */
export function matchScore({ hotelName, hotelAddress, cityName, declared }, charger, distance) {
  let score = 0;
  const reasons = [];
  const methods = [];

  // Distance
  // Sous quinze mètres, la borne est sur l'emprise du bâtiment : c'est en soi
  // un indice fort, indépendamment du nom et de l'adresse.
  if (distance <= 15) { score += 45; reasons.push(`borne à ${distance} m de l'entrée`); }
  else if (distance <= 25) { score += 35; reasons.push(`borne à ${distance} m`); }
  else if (distance <= 40) { score += 25; reasons.push(`borne à ${distance} m`); }
  else if (distance <= 80) { score += 15; reasons.push(`borne à ${distance} m`); }
  else if (distance <= 120) { score += 8; reasons.push(`borne à ${distance} m`); }
  if (distance <= 40) methods.push("distance");

  // Nom : mot distinctif de l'hôtel, ou marque partagée
  const cityStop = new Set(norm(cityName).split(" "));
  const label = norm(`${charger.name || ""} ${charger.operator || ""} ${charger.network || ""}`);
  const hotelWords = words(hotelName, cityStop);
  const hotelNorm = norm(hotelName);
  const brand = BRANDS.find((b) => hotelNorm.includes(norm(b)) && label.includes(norm(b)));
  if (brand) {
    score += 40;
    reasons.push(`la borne porte la marque « ${brand} »`);
    methods.push("marque");
  } else if (hotelWords.some((w) => label.includes(w))) {
    score += 40;
    reasons.push("la borne porte le nom de l'hôtel");
    methods.push("nom");
  }

  // Adresse
  if (hotelAddress && charger.address) {
    const a = streetKey(hotelAddress);
    const b = streetKey(charger.address);
    const sameStreet = a.street.length && b.street.length && a.street.some((w) => b.street.includes(w));
    if (sameStreet && a.num && b.num && a.num === b.num) {
      score += 50;
      reasons.push("même numéro et même voie");
      methods.push("adresse");
    } else if (sameStreet) {
      score += 25;
      reasons.push("même voie");
      methods.push("voie");
    }
    const pa = postcode(hotelAddress);
    const pb = postcode(charger.address);
    if (pa && pb && pa === pb) { score += 10; reasons.push("même code postal"); }
  }

  // Implantation officielle
  if (/client/i.test(charger.implantation || "")) {
    score += 20;
    reasons.push("parking privé réservé à la clientèle");
    methods.push("implantation");
  }

  // Accès réservé (OSM / OCM)
  if (charger.access === "customers" || charger.access === "private") {
    score += 10;
    reasons.push("accès réservé aux clients");
  }

  // Déclaration de l'hôtel
  if (declared) {
    score += 15;
    reasons.push("recharge déclarée par l'hôtel sur Booking");
    methods.push("booking");
  }

  return { score, reasons, method: methods.join("+") || "proximité" };
}
