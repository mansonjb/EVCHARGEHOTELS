#!/usr/bin/env node
/**
 * Récepteur local pour les données Open Charge Map.
 *
 * L'API OCM est injoignable depuis le shell de cette machine (Cloudflare ne
 * répond qu'au navigateur). Ce petit serveur reçoit donc le JSON récupéré
 * depuis l'onglet du navigateur et l'écrit dans data/raw/ocm-<slug>.json.
 *
 *   node scripts/ocm-receiver.mjs        (port 3099)
 */
import { createServer } from "node:http";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = 3099;
const OUT = path.join(process.cwd(), "data", "raw");

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.end();

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const slug = url.searchParams.get("slug");
  if (req.method !== "POST" || !slug) {
    res.statusCode = 400;
    return res.end("slug manquant");
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");
  await writeFile(path.join(OUT, `ocm-raw-${slug}.json`), body);
  console.log(`[recv] ${slug}: ${(body.length / 1024).toFixed(0)} Ko`);
  res.end("ok");
}).listen(PORT, () => console.log(`récepteur OCM sur http://localhost:${PORT}`));
