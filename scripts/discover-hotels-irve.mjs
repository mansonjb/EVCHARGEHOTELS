#!/usr/bin/env node
/**
 * Pipeline inversé : on part des bornes, pas des hôtels.
 *
 * La base nationale IRVE contient des milliers de stations dont le nom
 * identifie un hôtel. On les isole, on les dédoublonne par station, et on
 * obtient directement la liste des hôtels français équipés, avec puissance,
 * prises, nombre de points et adresse. C'est l'inverse du parcours habituel,
 * qui part d'une liste d'hôtels et cherche leurs bornes.
 *
 *   node scripts/discover-hotels-irve.mjs
 *   node scripts/discover-hotels-irve.mjs --min-kw 11 --top 40
 *
 * Écrit data/irve-hotel-stations.json (le dataset) et affiche le classement
 * des communes, qui sert à choisir les prochaines villes à ouvrir.
 */
import { createReadStream, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";

const ROOT = process.cwd();
const CSV = path.join(ROOT, "data", "raw", "_irve.csv");
const OUT = path.join(ROOT, "data", "irve-hotel-stations.json");

const argv = process.argv.slice(2);
const MIN_KW = Number(argv.includes("--min-kw") ? argv[argv.indexOf("--min-kw") + 1] : 0);
const TOP = Number(argv.includes("--top") ? argv[argv.indexOf("--top") + 1] : 30);

/** Marques et mots qui désignent un hébergement. */
const HOTEL_HINTS = [
  "hotel", "hôtel", "hostellerie", "auberge", "ibis", "novotel", "mercure", "campanile",
  "kyriad", "b&b hotel", "premiere classe", "première classe", "best western", "hilton",
  "marriott", "pullman", "sofitel", "mgallery", "adagio", "okko", "moxy", "holiday inn",
  "radisson", "mama shelter", "citotel", "brit hotel", "the originals", "greet ", "ace hotel",
  "logis de", "relais du", "relais de", "domaine de", "château de", "chateau de", "resort",
  "thalasso", "golf hotel", "appart city", "aparthotel", "appart'hotel", "residhome",
  "zenitude", "all suites", "sure hotel", "comfort hotel", "quality hotel", "kosy",
];

/**
 * Faux amis très fréquents en France : l'hôtel de ville est une mairie, pas un
 * hébergement. Sans ce filtre, le dataset est inexploitable.
 */
const NOT_HOTEL = [
  "hotel de ville", "hôtel de ville", "hotel-de-ville", "hôtel-de-ville",
  "hotel de police", "hôtel de police", "hotel du departement", "hôtel du département",
  "hotel de region", "hôtel de région", "hotel dieu", "hôtel dieu", "hotel-dieu",
  "hotel des ventes", "hôtel des ventes", "hotel des impots", "hôtel des impôts",
  "hotel d agglomeration", "hotel d'agglomération", "hotel de la communaute",
  "mairie", "prefecture", "préfecture", "hopital", "hôpital", "medipole",
];

function splitCsv(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const isTrue = (v) => String(v).toLowerCase() === "true" || v === "1";

function kw(v) {
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1000 ? Math.round(n / 1000) : Math.round(n * 10) / 10;
}

function parseXY(v) {
  const m = String(v).match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}

/** "[103 Rte du Téléphérique][74410][Morzine]" ou "12 rue X, 86000 Poitiers" */
function parseAddress(raw) {
  const s = String(raw || "");
  const bracket = s.match(/\[([^\]]*)\]\s*\[(\d{5})\]\s*\[([^\]]*)\]/);
  if (bracket) return { street: bracket[1].trim(), postcode: bracket[2], city: bracket[3].trim() };
  const m = s.match(/^(.*?),?\s*(\d{5})\s+(.+)$/);
  if (m) return { street: m[1].trim().replace(/,$/, ""), postcode: m[2], city: m[3].trim() };
  return { street: s.trim(), postcode: null, city: null };
}

async function main() {
  // Référentiel INSEE : les adresses IRVE sont hétérogènes, le code commune ne
  // l'est pas. Fichier récupéré via geo.api.gouv.fr.
  const communesFile = path.join(ROOT, "data", "raw", "_communes.json");
  const communes = new Map();
  if (existsSync(communesFile)) {
    for (const c of JSON.parse(await readFile(communesFile, "utf8"))) {
      communes.set(c.code, { name: c.nom, dept: c.departement?.nom ?? null, deptCode: c.departement?.code ?? null });
    }
  }

  const stations = new Map();
  let header = null;
  let idx = {};
  let rows = 0;

  const rl = createInterface({ input: createReadStream(CSV), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!header) {
      header = splitCsv(line);
      idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
      continue;
    }
    if (!line.trim()) continue;
    rows++;
    const f = splitCsv(line);

    const label = norm(`${f[idx.nom_station] || ""} ${f[idx.nom_enseigne] || ""}`);
    if (NOT_HOTEL.some((bad) => label.includes(norm(bad)))) continue;
    const hint = HOTEL_HINTS.find((h) => label.includes(norm(h)));
    const implantation = f[idx.implantation_station] || "";
    const clientele = /client/i.test(implantation);
    if (!hint && !clientele) continue;

    const xy = parseXY(f[idx.coordonneesXY]);
    if (!xy) continue;

    const key = f[idx.id_station_itinerance] || f[idx.id_station_local] || `${xy.lat},${xy.lng}`;
    const power = kw(f[idx.puissance_nominale]);
    const prev = stations.get(key);
    const sockets = new Set(prev?.sockets ?? []);
    if (isTrue(f[idx.prise_type_2])) sockets.add("Type 2");
    if (isTrue(f[idx.prise_type_combo_ccs])) sockets.add("CCS2");
    if (isTrue(f[idx.prise_type_chademo])) sockets.add("CHAdeMO");
    if (isTrue(f[idx.prise_type_ef])) sockets.add("Prise E");

    const addr = parseAddress(f[idx.adresse_station]);

    stations.set(key, {
      id: key,
      name: f[idx.nom_station] || f[idx.nom_enseigne] || null,
      operator: f[idx.nom_operateur] || null,
      brand: f[idx.nom_enseigne] || null,
      lat: xy.lat,
      lng: xy.lng,
      street: addr.street,
      postcode: addr.postcode,
      city: communes.get((f[idx.code_insee_commune] || "").trim())?.name || addr.city,
      dept: communes.get((f[idx.code_insee_commune] || "").trim())?.dept || null,
      deptCode: communes.get((f[idx.code_insee_commune] || "").trim())?.deptCode || null,
      insee: f[idx.code_insee_commune] || null,
      kw: Math.max(prev?.kw ?? 0, power ?? 0) || null,
      sockets: [...sockets],
      points: Number(f[idx.nbre_pdc]) || prev?.points || null,
      free: String(f[idx.gratuit] ?? "").toLowerCase() === "true",
      pricing: f[idx.tarification] || null,
      access: f[idx.condition_acces] || f[idx.condition_d_acces] || null,
      hours: f[idx.horaires] || null,
      implantation,
      reservation: String(f[idx.reservation] ?? "").toLowerCase() === "true",
      updated: f[idx.date_maj] || null,
      signal: hint ? (clientele ? "nom+clientèle" : "nom") : "clientèle",
      hint: hint || null,
    });
  }

  let list = [...stations.values()];
  const clienteleOnly = list.filter((s) => s.signal === "clientèle").length;
  // Le seul critère « parking réservé à la clientèle » ramène surtout des
  // parkings de supermarchés : on ne garde que les stations dont le NOM
  // désigne un hébergement.
  list = list.filter((s) => s.signal !== "clientèle");
  if (MIN_KW) list = list.filter((s) => (s.kw ?? 0) >= MIN_KW);

  // Un même hôtel peut avoir plusieurs stations : on regroupe par nom + commune.
  const byHotel = new Map();
  for (const s of list) {
    const k = `${norm(s.name)}|${s.postcode || s.city || ""}`;
    const cur = byHotel.get(k);
    if (!cur || (s.kw ?? 0) > (cur.kw ?? 0)) byHotel.set(k, s);
  }
  const hotels = [...byHotel.values()];

  const byCity = new Map();
  for (const s of hotels) {
    const c = (s.city || "inconnue").trim();
    byCity.set(c, (byCity.get(c) || 0) + 1);
  }

  await writeFile(
    OUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), source: "Base nationale IRVE, data.gouv.fr", stations: hotels },
      null,
      2,
    ),
  );

  const withKw = hotels.filter((s) => s.kw).length;
  const fast = hotels.filter((s) => (s.kw ?? 0) >= 50).length;
  const free = hotels.filter((s) => s.free).length;
  console.log(`${rows} lignes lues`);
  console.log(`${clienteleOnly} stations écartées : « réservé à la clientèle » sans nom d'hébergement`);
  console.log(`${list.length} stations hôtelières, ${hotels.length} hôtels distincts`);
  console.log(`  avec puissance : ${withKw} (${Math.round((withKw / hotels.length) * 100)} %)`);
  console.log(`  dont 50 kW ou plus : ${fast} · recharge gratuite annoncée : ${free}`);
  const byDept = new Map();
  for (const s of hotels) {
    const d = s.dept || "inconnu";
    byDept.set(d, (byDept.get(d) || 0) + 1);
  }
  console.log(`\nTop 10 départements :`);
  for (const [d, n] of [...byDept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${String(n).padStart(3)}  ${d}`);
  }

  console.log(`\nTop ${TOP} communes :`);
  for (const [c, n] of [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP)) {
    console.log(`  ${String(n).padStart(3)}  ${c}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
