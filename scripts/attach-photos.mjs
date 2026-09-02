/**
 * Colle une photo sur les hôtels de la carte nationale, quand nous en avons
 * une vraie.
 *
 * La seule source d'images honnête aujourd'hui est le relevé Booking des
 * quinze villes ouvertes : on rapproche les deux jeux par distance et par
 * nom, jamais par chaîne. Un Novotel n'hérite pas de la photo d'un autre
 * Novotel : ailleurs, la carte affichera sa vignette de repli.
 */
import fs from "node:fs";

const nat = JSON.parse(fs.readFileSync(new URL("../data/france-hotels.json", import.meta.url), "utf8"));
const booked = JSON.parse(fs.readFileSync(new URL("../data/hotels.json", import.meta.url), "utf8"));

const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const STOP = new Set(["hotel", "hôtel", "the", "de", "du", "des", "la", "le", "les", "et", "spa", "by", "and"]);
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

function distance(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

let hit = 0;
for (const h of nat.hotels) {
  const nt = tokens(h.name);
  let best = null;
  for (const b of booked) {
    if (!b.image) continue;
    const d = distance(h, b);
    if (d > 600) continue;
    const bt = tokens(b.name);
    let shared = 0;
    for (const w of nt) if (bt.has(w)) shared += 1;
    // Un mot distinctif commun, ou une adresse quasi identique : sinon on
    // laisse vide plutôt que de coller la photo du voisin.
    const ok = shared >= 1 || d <= 60;
    if (!ok) continue;
    const score = shared * 1000 - d;
    if (!best || score > best.score) best = { score, b, d, shared };
  }
  if (best) {
    h.photo = best.b.image;
    h.photoFrom = { slug: best.b.slug, city: best.b.citySlug, distance: Math.round(best.d), shared: best.shared };
    hit += 1;
  } else {
    delete h.photo;
    delete h.photoFrom;
  }
}

fs.writeFileSync(new URL("../data/france-hotels.json", import.meta.url), JSON.stringify(nat, null, 2));

// Le GeoJSON de la carte porte la même vignette.
const geoPath = new URL("../public/france-hotels.geojson", import.meta.url);
const geo = JSON.parse(fs.readFileSync(geoPath, "utf8"));
const bySlug = new Map(nat.hotels.map((h) => [h.slug, h]));
for (const f of geo.features) {
  const h = bySlug.get(f.properties.s);
  if (h?.photo) f.properties.im = h.photo;
  else delete f.properties.im;
}
fs.writeFileSync(geoPath, JSON.stringify(geo));

console.log(`photos rapprochées : ${hit} / ${nat.hotels.length} hôtels`);
