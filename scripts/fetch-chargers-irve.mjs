#!/usr/bin/env node
/**
 * Bornes françaises : base nationale consolidée IRVE (data.gouv.fr / Etalab).
 *
 * C'est LA source fiable pour la France, et elle donne exactement ce qui
 * manquait : puissance nominale en kW, nombre de points de charge, types de
 * prises (T2, CCS, CHAdeMO, EF), horaires, conditions d'accès, opérateur.
 * Fichier consolidé mis à jour quotidiennement, licence ouverte, sans clé API.
 *
 *   node scripts/fetch-chargers-irve.mjs           toutes les villes FR
 *   node scripts/fetch-chargers-irve.mjs --only poitiers
 *   node scripts/fetch-chargers-irve.mjs --force   retélécharge le CSV
 *
 * Écrit data/raw/irve-<slug>.json, fusionné par build-dataset.mjs.
 */
import { createReadStream } from "node:fs";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const CSV = path.join(RAW, "_irve.csv");
const SOURCE =
  "https://www.data.gouv.fr/api/1/datasets/r/eb76d20a-8501-400e-b336-d85724de5435";

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const force = argv.includes("--force");

/** Découpe une ligne CSV en tenant compte des guillemets. */
function splitCsv(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const isTrue = (v) => String(v).toLowerCase() === "true" || v === "1";

/** "22" -> 22 ; "22000" (watts) -> 22 ; "22.0" -> 22 */
function kw(v) {
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1000 ? Math.round(n / 1000) : Math.round(n * 10) / 10;
}

function parseXY(v) {
  const m = String(v).match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (!m) return null;
  return { lng: Number(m[1]), lat: Number(m[2]) };
}

function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function download() {
  if (existsSync(CSV) && !force) {
    const s = await stat(CSV);
    console.log(`[irve] CSV déjà là (${(s.size / 1e6).toFixed(0)} Mo), --force pour refaire`);
    return;
  }
  console.log("[irve] téléchargement du fichier consolidé (~160 Mo)...");
  const res = await fetch(SOURCE, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await mkdir(RAW, { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(CSV));
  const s = await stat(CSV);
  console.log(`[irve] ${(s.size / 1e6).toFixed(0)} Mo écrits`);
}

async function main() {
  const { destinations } = JSON.parse(
    await readFile(path.join(ROOT, "data", "destinations.json"), "utf8"),
  );
  const targets = (only ? destinations.filter((d) => d.slug === only) : destinations).filter(
    (d) => d.countryCode === "fr",
  );
  if (!targets.length) {
    console.log("[irve] aucune destination française à traiter");
    return;
  }

  await download();

  const buckets = new Map(targets.map((d) => [d.slug, new Map()]));
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
    const xy = parseXY(f[idx.coordonneesXY]);
    if (!xy) continue;

    for (const d of targets) {
      if (Math.abs(xy.lat - d.lat) > 0.15 || Math.abs(xy.lng - d.lng) > 0.2) continue;
      if (haversine(d, xy) > d.radiusM) continue;

      // Le fichier a une ligne par point de charge : on regroupe par station.
      const key = f[idx.id_station_itinerance] || f[idx.id_station_local] || `${xy.lat},${xy.lng}`;
      const bucket = buckets.get(d.slug);
      const power = kw(f[idx.puissance_nominale]);
      const prev = bucket.get(key);

      const sockets = new Set(prev?.sockets ?? []);
      if (isTrue(f[idx.prise_type_2])) sockets.add("type2");
      if (isTrue(f[idx.prise_type_combo_ccs])) sockets.add("ccs2");
      if (isTrue(f[idx.prise_type_chademo])) sockets.add("chademo");
      if (isTrue(f[idx.prise_type_ef])) sockets.add("typee");

      const horaires = f[idx.horaires] || "";
      const acces = f[idx.condition_d_acces] || "";
      const gratuit = String(f[idx.gratuit] ?? "").toLowerCase() === "true";

      bucket.set(key, {
        osmId: `irve/${key}`,
        source: "irve",
        lat: xy.lat,
        lng: xy.lng,
        name: f[idx.nom_station] || f[idx.nom_enseigne] || null,
        operator: f[idx.nom_operateur] || f[idx.nom_enseigne] || null,
        network: f[idx.nom_enseigne] || null,
        maxKw: Math.max(prev?.maxKw ?? 0, power ?? 0) || null,
        dc: (Math.max(prev?.maxKw ?? 0, power ?? 0) || 0) >= 43,
        sockets: [...sockets],
        points: Number(f[idx.nbre_pdc]) || prev?.points || null,
        fee: gratuit ? "free" : "paid",
        access: /accès réservé|réservé/i.test(acces) ? "customers" : "yes",
        open247: /24\/7/.test(horaires),
        reservation: null,
        amperage: null,
        voltage: null,
        authNone: null,
        address: f[idx.adresse_station] || null,
        implantation: f[idx.implantation_station] || null,
        tarification: f[idx.tarification] || null,
        reservationTag: f[idx.reservation] || null,
        updated: f[idx.date_maj] || null,
      });
    }
  }

  for (const d of targets) {
    const list = [...buckets.get(d.slug).values()];
    const withKw = list.filter((c) => c.maxKw).length;
    await writeFile(
      path.join(RAW, `irve-${d.slug}.json`),
      JSON.stringify({ destination: d.slug, fetchedAt: new Date().toISOString(), chargers: list }, null, 2),
    );
    console.log(`[irve] ${d.name}: ${list.length} stations (${withKw} avec puissance)`);
  }
  console.log(`[irve] ${rows} lignes lues`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
