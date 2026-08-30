#!/usr/bin/env node
/**
 * Signale les URL nouvelles ou modifiées à IndexNow (Bing, Yandex, Seznam).
 *
 *   INDEXNOW_KEY=xxxx node scripts/ping-indexnow.mjs
 *   node scripts/ping-indexnow.mjs --only /fr/bordeaux
 *
 * La clé doit aussi être servie à la racine : public/<key>.txt contenant la clé.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const KEY = process.env.INDEXNOW_KEY;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://plugstays.com";
if (!KEY) {
  console.error("INDEXNOW_KEY manquante");
  process.exit(1);
}

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

const root = process.cwd();
const cities = JSON.parse(await readFile(path.join(root, "data", "cities.json"), "utf8"));
const hotels = JSON.parse(await readFile(path.join(root, "data", "hotels.json"), "utf8"));

const urls = only
  ? [`${BASE}${only}`]
  : ["fr", "en"].flatMap((l) => [
      `${BASE}/${l}`,
      `${BASE}/${l}/methode`,
      `${BASE}/${l}/route/amsterdam-bordeaux`,
      ...cities.map((c) => `${BASE}/${l}/${c.slug}`),
      ...hotels.map((h) => `${BASE}/${l}/${h.citySlug}/${h.slug}`),
    ]);

const host = new URL(BASE).host;
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${BASE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow ${res.status} ${res.statusText} pour ${urls.length} URL`);
