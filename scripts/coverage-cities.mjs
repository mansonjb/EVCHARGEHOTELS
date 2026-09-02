/**
 * Quelles villes méritent une page ?
 *
 * Croise les hôtels équipés de la base IRVE avec la population des communes
 * (geo.api.gouv.fr) pour dire, chiffres en main, combien de pages ville le
 * gisement porte réellement, et à partir de quel seuil elles cessent d'avoir
 * assez de matière.
 */
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(new URL("../data/france-hotels.json", import.meta.url), "utf8"));
const hotels = data.hotels;

const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const res = await fetch("https://geo.api.gouv.fr/communes?fields=nom,code,population,centre,departement&format=json", {
  headers: { "User-Agent": "PlugStays/1.0 (analyse de couverture)" },
});
const communes = await res.json();
console.log("communes reçues :", communes.length);

const byName = new Map();
for (const c of communes) {
  const k = norm(c.nom);
  const prev = byName.get(k);
  if (!prev || (c.population ?? 0) > (prev.population ?? 0)) byName.set(k, c);
}

// Regroupement des hôtels par commune.
const cities = new Map();
for (const h of hotels) {
  const k = norm(h.city);
  if (!k) continue;
  const e = cities.get(k) ?? { key: k, name: h.city, hotels: [], kw: 0 };
  e.hotels.push(h);
  e.kw = Math.max(e.kw, h.kw ?? 0);
  cities.set(k, e);
}

let matched = 0;
for (const e of cities.values()) {
  const c = byName.get(e.key);
  if (c) {
    matched += 1;
    e.population = c.population ?? 0;
    e.dept = c.departement?.code ?? null;
    e.lat = c.centre?.coordinates?.[1] ?? null;
    e.lng = c.centre?.coordinates?.[0] ?? null;
  } else {
    e.population = null;
  }
}

const list = [...cities.values()];
console.log("communes distinctes avec au moins un hôtel équipé :", list.length, "| population trouvée pour", matched);

const bucket = (min) => list.filter((e) => e.hotels.length >= min).length;
console.log("\nCombien de communes par nombre d'hôtels équipés :");
for (const n of [1, 2, 3, 5, 8, 12, 20]) console.log(`  >= ${n} hôtel(s) : ${bucket(n)} communes`);

const pop = (min) => communes.filter((c) => (c.population ?? 0) >= min).length;
console.log("\nCombien de communes françaises par population :");
for (const n of [100000, 50000, 25000, 10000, 5000]) console.log(`  >= ${n} hab. : ${pop(n)} communes`);

console.log("\nCroisement population x hôtels équipés :");
for (const p of [100000, 50000, 25000, 10000, 0]) {
  for (const n of [1, 3, 5]) {
    const k = list.filter((e) => (e.population ?? 0) >= p && e.hotels.length >= n).length;
    const h = list
      .filter((e) => (e.population ?? 0) >= p && e.hotels.length >= n)
      .reduce((s, e) => s + e.hotels.length, 0);
    console.log(`  pop >= ${p} et >= ${n} hôtels : ${k} villes, ${h} hôtels couverts`);
  }
}

// Les communes sans population trouvée : utile pour juger le bruit.
const unmatched = list.filter((e) => e.population === null);
console.log("\ncommunes non appariées :", unmatched.length, unmatched.slice(0, 12).map((e) => e.name).join(", "));

// Top 40 des villes hors des 15 déjà ouvertes.
const open = new Set(
  JSON.parse(fs.readFileSync(new URL("../data/cities.json", import.meta.url), "utf8")).map((c) => norm(c.name)),
);
const next = list
  .filter((e) => !open.has(e.key))
  .sort((a, b) => b.hotels.length - a.hotels.length || (b.population ?? 0) - (a.population ?? 0))
  .slice(0, 40);
console.log("\nProchaines villes par volume d'hôtels équipés :");
for (const e of next)
  console.log(
    `  ${e.name.padEnd(28)} ${String(e.hotels.length).padStart(3)} hôtels  ${String(e.population ?? "?").padStart(8)} hab.  max ${e.kw} kW`,
  );

fs.writeFileSync(
  new URL("../data/raw/city-coverage.json", import.meta.url),
  JSON.stringify(
    list
      .map((e) => ({ key: e.key, name: e.name, dept: e.dept ?? null, population: e.population, hotels: e.hotels.length, bestKw: e.kw, lat: e.lat ?? null, lng: e.lng ?? null }))
      .sort((a, b) => b.hotels - a.hotels),
    null,
    2,
  ),
);
console.log("\nécrit data/raw/city-coverage.json");
