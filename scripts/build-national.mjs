#!/usr/bin/env node
/**
 * Dataset national : tous les hôtels français dont la base IRVE déclare une
 * borne, publiables sans passer par un scrape Booking.
 *
 * Le lien de réservation est une recherche Booking construite sur le nom et la
 * commune. Le script Stay22 « let me allez », déjà chargé sur le site, le
 * convertit en lien monétisé au clic. On n'a donc pas besoin d'une URL d'hôtel
 * Booking pour publier une fiche : c'est ce qui permet de passer de cinq
 * villes à toute la France.
 *
 *   node scripts/build-national.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const IN = path.join(ROOT, "data", "irve-hotel-stations.json");
const OUT = path.join(ROOT, "data", "france-hotels.json");

const OPERATORS =
  /\b(e-totem|etotem|electra|engie vianeo|vianeo|izivia|freshmile|tesla|allego|totalenergies|bump|driveco|last mile solutions|mobilize|power dot|powerdot|zephyre|alize|sodetrel|revéo|reveo|modulo|waat|atlante|ionity|fastned|virta|shell recharge|lidl|carrefour energies)\b/gi;

const HOTEL_HINT =
  /(hotel|hôtel|hostellerie|auberge|ibis|novotel|mercure|campanile|kyriad|b&b|premiere classe|première classe|best western|hilton|marriott|pullman|sofitel|mgallery|adagio|okko|moxy|holiday inn|radisson|mama shelter|citotel|brit|originals|greet|logis|relais|domaine|chateau|château|resort|thalasso|appart|residhome|zenitude|all suites|van der valk|kosy|comfort|quality)/i;

/**
 * Retrouve le nom d'hôtel dans un nom de station.
 * Les opérateurs écrivent « Electra Bron - Novotel », « e-Totem - Campanile
 * Beaune », « ENGIE Vianeo - B&B HOTEL TOURS NORD 1 ». On isole le segment qui
 * porte l'indice hôtelier, puis on retire l'opérateur et la commune.
 */
function cleanName(raw, city) {
  let s = String(raw || "").replace(/\s+/g, " ").trim();

  const parts = s.split(/\s*[-–—|]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const withHint = parts.filter((p) => HOTEL_HINT.test(p));
    if (withHint.length) s = withHint.sort((a, b) => b.length - a.length)[0];
    else s = parts[parts.length - 1];
  }

  s = s.replace(OPERATORS, " ");
  s = s.replace(/\b(borne|bornes|recharge|charging|station|irve|parking|pdc)\b/gi, " ");
  if (city) {
    // « Novotel Bron » reste, mais « Bron Novotel » perd le doublon de commune
    // seulement s'il est en tête.
    const c = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`^\\s*${c}\\s+`, "i"), " ");
  }
  s = s.replace(/[\s,;:]{2,}/g, " ").replace(/^[\s,;:-]+|[\s,;:-]+$/g, "").trim();
  return s;
}

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

function bookingSearch(name, city) {
  const q = [name, city].filter(Boolean).join(" ");
  const p = new URLSearchParams({ ss: q, group_adults: "2", no_rooms: "1" });
  return `https://www.booking.com/searchresults.html?${p}`;
}

/** Département déduit du code postal quand le code INSEE manque. */
function deptFromPostcode(pc) {
  if (!pc || pc.length !== 5) return null;
  if (pc.startsWith("97") || pc.startsWith("98")) return pc.slice(0, 3);
  if (pc.startsWith("20")) return null; // Corse : 2A/2B, on ne devine pas
  return pc.slice(0, 2);
}

async function main() {
  const { stations } = JSON.parse(await readFile(IN, "utf8"));

  // Référentiel INSEE : code département -> nom, pour les fiches sans commune.
  const communesFile = path.join(ROOT, "data", "raw", "_communes.json");
  const deptNames = new Map();
  try {
    for (const c of JSON.parse(await readFile(communesFile, "utf8"))) {
      if (c.departement) deptNames.set(c.departement.code, c.departement.nom);
    }
  } catch {
    /* le référentiel est optionnel */
  }

  const seen = new Map();
  for (const s of stations) {
    const name = cleanName(s.name, s.city);
    if (!name || name.length < 3) continue;
    if (!s.city || s.city.toLowerCase() === "france") continue;

    const slug = `${slugify(name)}-${slugify(s.city)}`;
    const prev = seen.get(slug);
    // Un hôtel peut avoir plusieurs stations : on garde la plus puissante et
    // on additionne les points de charge.
    if (prev) {
      prev.points = (prev.points ?? 0) + (s.points ?? 0) || prev.points;
      if ((s.kw ?? 0) > (prev.kw ?? 0)) {
        prev.kw = s.kw;
        prev.sockets = s.sockets;
      }
      prev.stations += 1;
      continue;
    }

    seen.set(slug, {
      slug,
      name,
      stationName: s.name,
      operator: s.operator,
      city: s.city,
      dept: s.dept ?? deptNames.get(deptFromPostcode(s.postcode)) ?? null,
      deptCode: s.deptCode ?? deptFromPostcode(s.postcode),
      postcode: s.postcode,
      street: s.street,
      lat: s.lat,
      lng: s.lng,
      kw: s.kw,
      sockets: s.sockets,
      points: s.points,
      free: s.free,
      hours: s.hours,
      reservation: s.reservation,
      updated: s.updated,
      stations: 1,
      bookingUrl: bookingSearch(name, s.city),
    });
  }

  const hotels = [...seen.values()].sort((a, b) => (b.kw ?? 0) - (a.kw ?? 0));

  // Regroupement par département, pour les pages de longue traîne.
  const depts = new Map();
  for (const h of hotels) {
    if (!h.deptCode) continue;
    const d = depts.get(h.deptCode) ?? { code: h.deptCode, name: h.dept, count: 0, bestKw: 0, cities: new Set() };
    d.count += 1;
    d.bestKw = Math.max(d.bestKw, h.kw ?? 0);
    d.cities.add(h.city);
    depts.set(h.deptCode, d);
  }

  await writeFile(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "Base nationale IRVE, data.gouv.fr, licence ouverte",
        hotels,
        departments: [...depts.values()]
          .map((d) => ({ ...d, cities: d.cities.size }))
          .sort((a, b) => b.count - a.count),
      },
      null,
      2,
    ),
  );

  // GeoJSON servi tel quel à la carte : plus léger qu'un import dans le bundle.
  const geo = {
    type: "FeatureCollection",
    features: hotels.map((h) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [h.lng, h.lat] },
      properties: {
        s: h.slug,
        n: h.name,
        c: h.city,
        d: h.deptCode,
        k: h.kw,
        p: h.points,
        so: h.sockets.join(", "),
        u: h.bookingUrl,
      },
    })),
  };
  await writeFile(path.join(ROOT, "public", "france-hotels.geojson"), JSON.stringify(geo));

  const withKw = hotels.filter((h) => h.kw).length;
  console.log(`${hotels.length} hôtels publiables (${withKw} avec puissance)`);
  console.log(`${depts.size} départements couverts`);
  console.log("exemples :");
  for (const h of hotels.slice(0, 5)) {
    console.log(`  ${h.name.slice(0, 40).padEnd(42)} ${h.city.padEnd(18)} ${h.kw} kW  ${h.sockets.join(",")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
