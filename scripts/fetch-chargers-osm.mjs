#!/usr/bin/env node
/**
 * Bornes de recharge réelles depuis OpenStreetMap (Overpass API).
 *
 * OSM est la seule source gratuite qui donne la donnée physique dont le site a
 * besoin : puissance de sortie, types de prises, nombre de points, tarif,
 * accès, horaires, opérateur. Booking ne donne qu'un booléen.
 *
 * Licence : ODbL. On affiche des résultats produits (pas de dump), et la
 * mention « données de bornes © contributeurs OpenStreetMap » doit rester
 * visible sur les pages qui les utilisent.
 *
 *   node scripts/fetch-chargers-osm.mjs               toutes les destinations
 *   node scripts/fetch-chargers-osm.mjs --only tours  une seule
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "raw");
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

/** "50 kW" | "22000 W" | "22" -> 22 (kW, number) */
export function parseKw(raw) {
  if (!raw) return null;
  const first = String(raw).split(";")[0].trim();
  const m = first.match(/([\d.,]+)\s*(kw|w)?/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "kw").toLowerCase();
  return unit === "w" ? Math.round((n / 1000) * 10) / 10 : n;
}

const SOCKETS = [
  ["socket:type2", "type2"],
  ["socket:type2_cable", "type2"],
  ["socket:type2_combo", "ccs2"],
  ["socket:chademo", "chademo"],
  ["socket:typee", "typee"],
  ["socket:schuko", "schuko"],
  ["socket:tesla_supercharger", "tesla"],
  ["socket:tesla_destination", "tesla"],
];

function normalise(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;

  const sockets = [];
  for (const [tag, kind] of SOCKETS) {
    if (t[tag] && t[tag] !== "no" && !sockets.includes(kind)) sockets.push(kind);
  }

  // Puissance : la plus haute annoncée, en regardant aussi les prises.
  const powers = [
    parseKw(t["charging_station:output"]),
    parseKw(t["socket:type2:output"]),
    parseKw(t["socket:type2_cable:output"]),
    parseKw(t["socket:type2_combo:output"]),
    parseKw(t["socket:chademo:output"]),
    parseKw(t["maxpower"]),
  ].filter((n) => typeof n === "number");
  const maxKw = powers.length ? Math.max(...powers) : null;

  // Ampérage / tension quand ils sont renseignés (rare mais précieux).
  const amperage = t["socket:type2:amperage"] || t.amperage || null;
  const voltage = t["socket:type2:voltage"] || t.voltage || null;

  const capacity = Number(t.capacity);

  return {
    osmId: `${el.type}/${el.id}`,
    lat,
    lng,
    name: t.name || t.operator || t.network || null,
    operator: t.operator || null,
    network: t.network || null,
    maxKw,
    dc: maxKw != null && maxKw >= 43,
    sockets,
    points: Number.isFinite(capacity) ? capacity : null,
    fee: t.fee === "yes" ? "paid" : t.fee === "no" ? "free" : null,
    access: t.access || null,
    open247: t.opening_hours === "24/7",
    reservation: t.reservation || null,
    amperage: amperage ? String(amperage) : null,
    voltage: voltage ? String(voltage) : null,
    authNone: t["authentication:none"] === "yes",
    startDate: t.start_date || null,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query, attempt = 0) {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "PlugStays/0.1 (hotel EV charging guide; contact manson.jeanbaptiste@gmail.com)",
        },
        body: new URLSearchParams({ data: query }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.warn(`  ! ${url} -> ${err.message}`);
    }
  }
  if (attempt < 4) {
    const wait = 15000 * (attempt + 1);
    console.warn(`  … Overpass saturé, nouvelle tentative dans ${wait / 1000} s`);
    await sleep(wait);
    return overpass(query, attempt + 1);
  }
  throw lastErr;
}

async function main() {
  const { destinations } = JSON.parse(
    await readFile(path.join(ROOT, "data", "destinations.json"), "utf8"),
  );
  const targets = only ? destinations.filter((d) => d.slug === only) : destinations;
  await mkdir(OUT_DIR, { recursive: true });

  for (const d of targets) {
    const q = `[out:json][timeout:90];
(
  node["amenity"="charging_station"](around:${d.radiusM},${d.lat},${d.lng});
  way["amenity"="charging_station"](around:${d.radiusM},${d.lat},${d.lng});
);
out center tags;`;

    const outFile = path.join(OUT_DIR, `chargers-${d.slug}.json`);
    if (!argv.includes("--force") && existsSync(outFile)) {
      console.log(`[osm] ${d.name} ... déjà présent (--force pour refaire)`);
      continue;
    }
    process.stdout.write(`[osm] ${d.name} ... `);
    const json = await overpass(q);
    const list = (json.elements || []).map(normalise).filter(Boolean);
    const withPower = list.filter((c) => c.maxKw != null).length;
    await writeFile(
      outFile,
      JSON.stringify({ destination: d.slug, fetchedAt: new Date().toISOString(), chargers: list }, null, 2),
    );
    console.log(`${list.length} bornes (${withPower} avec puissance annoncée)`);
    await sleep(12000); // courtoisie Overpass, le service publique limite fort
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
