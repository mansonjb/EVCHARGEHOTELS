#!/usr/bin/env node
/**
 * Enrichissement des bornes via Open Charge Map (optionnel mais recommandé).
 *
 * OSM donne la géographie, OCM donne souvent la fiche technique complète :
 * puissance par connecteur, AMPÉRAGE, tension, nombre de points, type d'usage
 * (« Private - for staff, visitors or customers », signal très utile pour
 * savoir si la borne appartient à l'hôtel) et statut opérationnel.
 *
 * Prérequis : une clé API gratuite sur https://openchargemap.org/site/develop
 * puis dans .env.local :   OCM_API_KEY=xxxxxxxx
 *
 *   node --env-file=.env.local scripts/fetch-chargers-ocm.mjs
 *   node --env-file=.env.local scripts/fetch-chargers-ocm.mjs --only tours
 *
 * Licence : données Open Charge Map, attribution obligatoire et visible.
 * Le script écrit data/raw/ocm-<slug>.json ; build-dataset.mjs les fusionne
 * avec les bornes OSM quand le fichier existe.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "raw");
const KEY = process.env.OCM_API_KEY;

if (!KEY) {
  console.error(
    "OCM_API_KEY manquante. Clé gratuite sur https://openchargemap.org/site/develop puis OCM_API_KEY=... dans .env.local",
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const force = argv.includes("--force");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX = Number(process.env.OCM_MAX || 100);
const TIMEOUT_MS = Number(process.env.OCM_TIMEOUT_MS || 180000);

const SOCKET_MAP = [
  [/type 2|mennekes/i, "type2"],
  [/ccs|combo/i, "ccs2"],
  [/chademo/i, "chademo"],
  [/type e|type f|schuko|domestic/i, "schuko"],
  [/tesla/i, "tesla"],
];

function socketKind(title = "") {
  for (const [re, kind] of SOCKET_MAP) if (re.test(title)) return kind;
  return null;
}

function normalise(poi) {
  const a = poi.AddressInfo || {};
  const conns = poi.Connections || [];
  const powers = conns.map((c) => c.PowerKW).filter((n) => typeof n === "number" && n > 0);
  const amps = conns.map((c) => c.Amps).filter(Boolean);
  const volts = conns.map((c) => c.Voltage).filter(Boolean);
  const sockets = [
    ...new Set(conns.map((c) => socketKind((c.ConnectionType || {}).Title)).filter(Boolean)),
  ];
  const points = conns.reduce((n, c) => n + (c.Quantity || 1), 0);
  const usage = (poi.UsageType || {}).Title || null;

  return {
    osmId: `ocm/${poi.ID}`,
    source: "ocm",
    lat: a.Latitude,
    lng: a.Longitude,
    name: a.Title || null,
    operator: (poi.OperatorInfo || {}).Title || null,
    network: (poi.OperatorInfo || {}).Title || null,
    maxKw: powers.length ? Math.max(...powers) : null,
    dc: conns.some((c) => ((c.CurrentType || {}).Title || "").includes("DC")),
    sockets,
    points: points || null,
    fee: poi.UsageCost ? "paid" : null,
    // « Private - for staff, visitors or customers » = très probablement la borne du lieu.
    access: usage && /customer|visitor|staff|private/i.test(usage) ? "customers" : "yes",
    usage,
    open247: (poi.AddressInfo || {}).AccessComments?.includes("24") || null,
    reservation: null,
    amperage: amps.length ? String(Math.max(...amps)) : null,
    voltage: volts.length ? String(Math.max(...volts)) : null,
    authNone: null,
    status: (poi.StatusType || {}).Title || null,
    operational: (poi.StatusType || {}).IsOperational ?? null,
  };
}

async function main() {
  const { destinations } = JSON.parse(
    await readFile(path.join(ROOT, "data", "destinations.json"), "utf8"),
  );
  const targets = only ? destinations.filter((d) => d.slug === only) : destinations;
  await mkdir(OUT_DIR, { recursive: true });

  for (const d of targets) {
    const outFile = path.join(OUT_DIR, `ocm-${d.slug}.json`);
    if (!force && existsSync(outFile)) {
      console.log(`[ocm] ${d.name} ... déjà présent`);
      continue;
    }
    const url =
      `https://api.openchargemap.io/v3/poi?output=json&latitude=${d.lat}&longitude=${d.lng}` +
      `&distance=${(d.radiusM / 1000).toFixed(1)}&distanceunit=KM&maxresults=${MAX}&compact=false&verbose=false`;

    process.stdout.write(`[ocm] ${d.name} ... `);
    // L'origine OCM répond parfois en plus d'une minute, et Cloudflare renvoie
    // un 524 quand elle ne répond pas du tout : temporisation longue et reprises.
    let pois = null;
    for (let attempt = 0; attempt < 4 && !pois; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { "X-API-Key": KEY, "User-Agent": "PlugStays/0.1 (+contact manson.jeanbaptiste@gmail.com)" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        pois = await res.json();
      } catch (err) {
        process.stdout.write(`[${err.message}] `);
        if (attempt < 3) await sleep(20000 * (attempt + 1));
      }
    }
    if (!pois) {
      console.log("abandon, API injoignable");
      continue;
    }
    const list = pois.map(normalise).filter((c) => c.lat != null && c.lng != null);
    await writeFile(
      outFile,
      JSON.stringify({ destination: d.slug, fetchedAt: new Date().toISOString(), chargers: list }, null, 2),
    );
    const withKw = list.filter((c) => c.maxKw != null).length;
    const withAmp = list.filter((c) => c.amperage).length;
    console.log(`${list.length} bornes (${withKw} avec puissance, ${withAmp} avec ampérage)`);
    await sleep(2000);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
