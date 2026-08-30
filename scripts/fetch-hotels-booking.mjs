#!/usr/bin/env node
/**
 * Hôtels réels depuis Booking, via l'acteur Apify voyager/booking-scraper.
 *
 * Ce que Booking donne : nom, URL, coordonnées, note, étoiles, prix, photos,
 * description, et surtout la LISTE DES ÉQUIPEMENTS, dans laquelle figure
 * « Electric vehicle charging station » quand l'hôtel l'a déclarée.
 * Ce que Booking ne donne pas : la puissance, le connecteur, le nombre de
 * points. Cette partie vient d'OpenStreetMap (scripts/fetch-chargers-osm.mjs).
 *
 *   APIFY_TOKEN=... node scripts/fetch-hotels-booking.mjs
 *   node scripts/fetch-hotels-booking.mjs --only tours --max 40
 *   EV_FILTER_ID=... node scripts/fetch-hotels-booking.mjs   (filtre Booking)
 *
 * Écrit data/raw/hotels-<slug>.json. Ne réécrit pas un fichier existant sans
 * --force : un run coûte des crédits Apify.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "raw");
const ACTOR = "voyager~booking-scraper";

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const force = argv.includes("--force");
const MAX = Number(argv.includes("--max") ? argv[argv.indexOf("--max") + 1] : 40);
const CHECK_IN = process.env.CHECK_IN || "2026-09-19";
const CHECK_OUT = process.env.CHECK_OUT || "2026-09-20";
const EV_FILTER_ID = process.env.EV_FILTER_ID || null;

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error("APIFY_TOKEN manquant (mettez-le dans .env.local et lancez avec --env-file=.env.local)");
  process.exit(1);
}

function searchUrl(d) {
  const p = new URLSearchParams({
    ss: d.bookingSearch,
    checkin: CHECK_IN,
    checkout: CHECK_OUT,
    group_adults: "2",
    no_rooms: "1",
    nflt: `hotelfacility=${EV_FILTER_ID}`,
  });
  return `https://www.booking.com/searchresults.en-gb.html?${p}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run asynchrone puis polling : l'endpoint run-sync coupe à 300 s, or un
 * scrape de 60 hôtels avec équipements dépasse largement.
 */
async function runActor(input) {
  const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => r.json());

  const run = start.data;
  if (!run?.id) throw new Error(JSON.stringify(start).slice(0, 400));

  let status = run.status;
  let datasetId = run.defaultDatasetId;
  const started = Date.now();
  while (["READY", "RUNNING"].includes(status)) {
    await sleep(15000);
    const cur = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${TOKEN}`).then((r) => r.json());
    status = cur.data.status;
    datasetId = cur.data.defaultDatasetId;
    process.stdout.write(".");
    if (Date.now() - started > 30 * 60 * 1000) throw new Error("run trop long, abandon");
  }
  if (status !== "SUCCEEDED") throw new Error(`run ${status}`);

  const items = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${TOKEN}&clean=true`,
  ).then((r) => r.json());
  if (!Array.isArray(items)) throw new Error(JSON.stringify(items).slice(0, 400));
  return items;
}

async function main() {
  const { destinations } = JSON.parse(
    await readFile(path.join(ROOT, "data", "destinations.json"), "utf8"),
  );
  const targets = only ? destinations.filter((d) => d.slug === only) : destinations;
  await mkdir(OUT_DIR, { recursive: true });

  for (const d of targets) {
    const outFile = path.join(OUT_DIR, `hotels-${d.slug}.json`);
    if (!force && existsSync(outFile)) {
      console.log(`[booking] ${d.name} ... déjà présent (--force pour refaire)`);
      continue;
    }

    const input = EV_FILTER_ID
      ? { startUrls: [{ url: searchUrl(d) }], maxItems: MAX }
      : {
          search: d.bookingSearch,
          maxItems: MAX,
          checkIn: CHECK_IN,
          checkOut: CHECK_OUT,
          adults: 2,
          rooms: 1,
          propertyType: "Hotels",
          sortBy: "bayesian_review_score",
        };

    process.stdout.write(`[booking] ${d.name} ... `);
    const items = await runActor({
      ...input,
      extractAdditionalHotelData: true,
      currency: "EUR",
      language: "en-gb",
    });

    const ev = items.filter((h) =>
      JSON.stringify(h.facilities || []).toLowerCase().includes("electric vehicle charging"),
    ).length;
    await writeFile(
      outFile,
      JSON.stringify({ destination: d.slug, fetchedAt: new Date().toISOString(), items }, null, 2),
    );
    console.log(`${items.length} hôtels, dont ${ev} avec recharge déclarée`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
