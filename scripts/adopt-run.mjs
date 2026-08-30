#!/usr/bin/env node
/** Récupère le dataset d'un run Apify déjà lancé : node scripts/adopt-run.mjs <runId> <slug> */
import { writeFile } from "node:fs/promises";
import path from "node:path";

const [runId, slug] = process.argv.slice(2);
const TOKEN = process.env.APIFY_TOKEN;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let status = "RUNNING";
let datasetId = null;
while (["READY", "RUNNING"].includes(status)) {
  const cur = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`).then((r) => r.json());
  status = cur.data.status;
  datasetId = cur.data.defaultDatasetId;
  if (["READY", "RUNNING"].includes(status)) {
    process.stdout.write(".");
    await sleep(15000);
  }
}
if (status !== "SUCCEEDED") {
  console.error(`\nrun ${status}`);
  process.exit(1);
}
const items = await fetch(
  `https://api.apify.com/v2/datasets/${datasetId}/items?token=${TOKEN}&clean=true`,
).then((r) => r.json());
await writeFile(
  path.join(process.cwd(), "data", "raw", `hotels-${slug}.json`),
  JSON.stringify({ destination: slug, fetchedAt: new Date().toISOString(), items }, null, 2),
);
const ev = items.filter((h) => JSON.stringify(h.facilities || []).toLowerCase().includes("electric vehicle charging")).length;
console.log(`\n[adopt] ${slug}: ${items.length} hôtels, ${ev} avec recharge déclarée`);
