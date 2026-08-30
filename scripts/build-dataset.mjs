#!/usr/bin/env node
/**
 * Jointure Booking × OpenStreetMap -> data/hotels.json + data/cities.json
 *
 * Booking dit SI l'hôtel déclare une borne. OSM dit CE QUE C'EST : puissance,
 * prises, nombre de points, tarif, 24/7, parfois ampérage et tension.
 * Un hôtel n'est retenu que si au moins une des deux sources le confirme, et
 * la fiche indique toujours laquelle.
 *
 *   node scripts/build-dataset.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { matchScore, ON_SITE_SCORE, MAYBE_SCORE } from "../lib/match.mjs";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");

const ON_SITE_M = 120;   // au-delà, ce n'est plus « sur le parking »
const AT_BUILDING_M = 40; // à cette distance, la borne est sur la parcelle
const DOORSTEP_M = 120;   // borne publique devant l'hôtel, sans lien établi
const NEARBY_M = 700;    // ~8 minutes à pied
const EV_LABEL = "electric vehicle charging";

function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function facilityNames(h) {
  const out = [];
  for (const grp of h.facilities || []) {
    for (const f of grp.facilities || []) if (f?.name) out.push(f.name);
  }
  return out;
}

/** Quelques équipements qui font qu'on a envie d'y dormir. */
const NICE = [
  ["Restaurant", { fr: "restaurant sur place", en: "restaurant on site" }],
  ["Bar", { fr: "bar", en: "bar" }],
  ["Spa and wellness centre", { fr: "spa", en: "spa" }],
  ["Fitness centre", { fr: "salle de sport", en: "gym" }],
  ["Outdoor swimming pool", { fr: "piscine extérieure", en: "outdoor pool" }],
  ["Indoor swimming pool", { fr: "piscine intérieure", en: "indoor pool" }],
  ["Garden", { fr: "jardin", en: "garden" }],
  ["Terrace", { fr: "terrasse", en: "terrace" }],
  ["Private parking", { fr: "parking privé", en: "private parking" }],
  ["Free WiFi", { fr: "wifi gratuit", en: "free WiFi" }],
  ["Family rooms", { fr: "chambres familiales", en: "family rooms" }],
  ["Airport shuttle", { fr: "navette aéroport", en: "airport shuttle" }],
  ["Pets allowed", { fr: "animaux acceptés", en: "pets allowed" }],
  ["Non-smoking rooms", { fr: "chambres non-fumeurs", en: "non-smoking rooms" }],
];

const SOCKET_LABEL = {
  type2: "Type 2",
  ccs2: "CCS2",
  chademo: "CHAdeMO",
  typee: "Prise E",
  schuko: "Schuko",
  tesla: "Tesla",
};

function kwLabel(kw) {
  if (kw == null) return null;
  return `${String(kw).replace(".", ",")} kW`;
}

/**
 * Aux Pays-Bas une borne à 80 m d'un hôtel est presque toujours une borne de
 * rue, pas celle de l'hôtel. On ne parle donc de borne « sur place » que si un
 * indice la rattache à l'établissement : l'hôtel l'a déclarée sur Booking, ou
 * l'accès OSM est réservé aux clients, ou le nom de la borne cite l'hôtel.
 */
function buildCharging(hotel, chargers, declared, hotelName, cityName, hotelAddress) {
  const near = chargers
    .map((c) => ({ ...c, distance: haversine(hotel, c) }))
    .filter((c) => c.distance <= NEARBY_M)
    .sort((a, b) => a.distance - b.distance);

  // Chaque borne proche est notée : la fiche affiche ensuite le score et ses
  // raisons, plutôt qu'un « sur place » assené sans justification.
  const scored = near
    .filter((c) => c.distance <= ON_SITE_M)
    .map((c) => ({ ...c, ...matchScore({ hotelName, hotelAddress, cityName, declared }, c, c.distance) }))
    .sort((a, b) => b.score - a.score || (b.maxKw ?? 0) - (a.maxKw ?? 0));

  const linked = scored.filter((c) => c.score >= ON_SITE_SCORE);
  const maybe = scored.filter((c) => c.score >= MAYBE_SCORE && c.score < ON_SITE_SCORE);
  // On garde d'abord une borne dont la puissance est connue (IRVE et OCM la
  // donnent presque toujours, OSM rarement), puis la plus puissante.
  const rank = (c) => (c.maxKw ? 0 : 1) * 10 + (c.source === "irve" ? 0 : c.source === "ocm" ? 1 : 2);
  let onSite =
    linked.slice().sort((a, b) => rank(a) - rank(b) || b.score - a.score)[0] || null;

  // Une même borne physique est souvent décrite par OSM (position) et par la
  // base IRVE ou OCM (puissance, prises, points). Quand la borne retenue n'a
  // pas de puissance, on complète avec l'enregistrement d'une autre source
  // situé au même endroit, à trente mètres près.
  if (onSite && onSite.maxKw == null) {
    const twin = near
      .filter((c) => c.osmId !== onSite.osmId && c.maxKw != null)
      .map((c) => ({ c, gap: haversine(onSite, c) }))
      .filter((x) => x.gap <= 60)
      .sort((a, b) => a.gap - b.gap)[0];
    if (twin) {
      onSite = {
        ...onSite,
        maxKw: twin.c.maxKw,
        dc: twin.c.dc,
        sockets: onSite.sockets.length ? onSite.sockets : twin.c.sockets,
        points: onSite.points ?? twin.c.points,
        fee: onSite.fee ?? twin.c.fee,
        open247: onSite.open247 || twin.c.open247,
        operator: onSite.operator || twin.c.operator,
        amperage: onSite.amperage ?? twin.c.amperage,
        voltage: onSite.voltage ?? twin.c.voltage,
        address: onSite.address ?? twin.c.address,
        updated: onSite.updated ?? twin.c.updated,
        source: twin.c.source || onSite.source,
        mergedFrom: twin.c.source || null,
      };
    }
  }

  // Borne publique littéralement devant la porte, sans lien avec l'hôtel.
  const doorstep = !onSite
    ? near
        .filter((c) => c.distance <= DOORSTEP_M)
        .sort((a, b) => (a.maxKw ? 0 : 1) - (b.maxKw ? 0 : 1) || a.distance - b.distance)[0] || null
    : null;

  const nearby = near.filter((c) => !onSite || c.osmId !== onSite.osmId);
  const bestNearby = nearby.slice().sort((a, b) => (b.maxKw ?? 0) - (a.maxKw ?? 0))[0] || null;

  let confidence = "none";
  if (onSite && onSite.score >= 90) confidence = "confirmed";
  else if (onSite) confidence = "mapped";
  else if (maybe.length) confidence = "probable";
  else if (declared) confidence = "declared";
  else if (doorstep) confidence = "doorstep";

  return {
    declaredOnBooking: declared,
    confidence,
    score: onSite?.score ?? maybe[0]?.score ?? null,
    matchMethod: onSite?.method ?? maybe[0]?.method ?? null,
    matchReasons: onSite?.reasons ?? maybe[0]?.reasons ?? [],
    maybe: maybe[0]
      ? {
          distance: maybe[0].distance,
          kw: maybe[0].maxKw,
          kwLabel: kwLabel(maybe[0].maxKw),
          sockets: maybe[0].sockets.map((x) => SOCKET_LABEL[x] || x),
          points: maybe[0].points ?? null,
          name: maybe[0].name,
          score: maybe[0].score,
          reasons: maybe[0].reasons,
        }
      : null,
    doorstep: doorstep
      ? {
          distance: doorstep.distance,
          kw: doorstep.maxKw,
          kwLabel: kwLabel(doorstep.maxKw),
          sockets: doorstep.sockets.map((x) => SOCKET_LABEL[x] || x),
          points: doorstep.points ?? null,
          name: doorstep.name,
        }
      : null,
    onSite: onSite
      ? {
          osmId: onSite.osmId,
          dataSource: onSite.source || "osm",
          address: onSite.address ?? null,
          updated: onSite.updated ?? null,
          distance: onSite.distance,
          kw: onSite.maxKw,
          kwLabel: kwLabel(onSite.maxKw),
          dc: onSite.dc,
          sockets: onSite.sockets,
          socketLabels: onSite.sockets.map((s) => SOCKET_LABEL[s] || s),
          points: onSite.points,
          fee: onSite.fee,
          open247: onSite.open247,
          reservation: onSite.reservation,
          amperage: onSite.amperage,
          voltage: onSite.voltage,
          operator: onSite.operator || onSite.network,
          access: onSite.access,
        }
      : null,
    // La borne connue la plus proche : c'est elle qui rend la page utile quand
    // la borne de l'hôtel n'a pas de puissance publiée.
    nearestKnown: (() => {
      const k = nearby.find((c) => c.maxKw != null);
      return k
        ? { distance: k.distance, kw: k.maxKw, kwLabel: kwLabel(k.maxKw), sockets: k.sockets.map((x) => SOCKET_LABEL[x] || x), name: k.name, points: k.points }
        : null;
    })(),
    nearby: {
      count: nearby.length,
      within: NEARBY_M,
      bestKw: bestNearby?.maxKw ?? null,
      bestKwLabel: kwLabel(bestNearby?.maxKw),
      nearestM: nearby[0]?.distance ?? null,
      list: nearby.slice(0, 6).map((c) => ({
        name: c.name,
        distance: c.distance,
        kw: c.maxKw,
        kwLabel: kwLabel(c.maxKw),
        sockets: c.sockets.map((s) => SOCKET_LABEL[s] || s),
        points: c.points,
        fee: c.fee,
        open247: c.open247,
      })),
    },
  };
}

function copyFor(hotel, dest, charging, facs) {
  const nice = NICE.filter(([k]) => facs.includes(k)).slice(0, 3);
  const listFr = nice.map(([, l]) => l.fr).join(", ");
  const listEn = nice.map(([, l]) => l.en).join(", ");
  const stars = hotel.stars ? `${hotel.stars} étoiles` : null;
  const starsEn = hotel.stars ? `${hotel.stars}-star` : null;

  const onSite = charging.onSite;
  const chargeFr = onSite
    ? `Borne de ${onSite.kwLabel ?? "puissance non renseignée"} sur place${
        onSite.socketLabels.length ? ` en ${onSite.socketLabels.join(" et ")}` : ""
      }${onSite.points ? `, ${onSite.points} point${onSite.points > 1 ? "s" : ""} de charge` : ""}.`
    : charging.declaredOnBooking
      ? "Recharge déclarée par l'hôtel, caractéristiques non publiées."
      : "";
  const chargeEn = onSite
    ? `A ${onSite.kwLabel ?? "charger of unstated power"} on site${
        onSite.socketLabels.length ? ` with ${onSite.socketLabels.join(" and ")}` : ""
      }${onSite.points ? `, ${onSite.points} charging point${onSite.points > 1 ? "s" : ""}` : ""}.`
    : charging.declaredOnBooking
      ? "Charging declared by the hotel, specifications not published."
      : "";

  return {
    envie: {
      fr: [
        `${hotel.name}${stars ? `, ${stars}` : ""} à ${dest.name}${listFr ? `, ${listFr}` : ""}.`,
        hotel.rating ? `Note des voyageurs ${String(hotel.rating).replace(".", ",")}/10.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      en: [
        `${hotel.name}${starsEn ? `, ${starsEn}` : ""} in ${dest.name}${listEn ? `, ${listEn}` : ""}.`,
        hotel.rating ? `Guest rating ${hotel.rating}/10.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    charge: { fr: chargeFr, en: chargeEn },
  };
}

async function main() {
  // Relevé national : sert à mesurer, ville par ville, ce que la base IRVE
  // recense et que le scrape Booking n'a pas ramené.
  let national = [];
  try {
    national = JSON.parse(await readFile(path.join(ROOT, "data", "france-hotels.json"), "utf8")).hotels;
  } catch {
    /* le dataset national est optionnel */
  }

  const { destinations } = JSON.parse(
    await readFile(path.join(ROOT, "data", "destinations.json"), "utf8"),
  );

  const allHotels = [];
  const cities = [];

  for (const d of destinations) {
    const hf = path.join(RAW, `hotels-${d.slug}.json`);
    const cf = path.join(RAW, `chargers-${d.slug}.json`);
    if (!existsSync(hf) || !existsSync(cf)) {
      console.warn(`[skip] ${d.slug} : données brutes manquantes`);
      continue;
    }
    const { items } = JSON.parse(await readFile(hf, "utf8"));
    const { chargers: osmChargers } = JSON.parse(await readFile(cf, "utf8"));

    // Open Charge Map en complément quand la clé API est configurée : il porte
    // souvent l'ampérage, la tension et le type d'usage, que OSM n'a pas.
    const ocmFile = path.join(RAW, `ocm-${d.slug}.json`);
    const ocm = existsSync(ocmFile) ? JSON.parse(await readFile(ocmFile, "utf8")).chargers : [];

    // France : base nationale IRVE (data.gouv.fr), la source de référence pour
    // la puissance et le nombre de points. Elle prime sur OSM quand les deux
    // décrivent la même borne.
    const irveFile = path.join(RAW, `irve-${d.slug}.json`);
    const irve = existsSync(irveFile) ? JSON.parse(await readFile(irveFile, "utf8")).chargers : [];

    const chargers = [...irve, ...ocm, ...osmChargers];

    const kept = [];
    for (const h of items) {
      const lat = Number(h.location?.lat);
      const lng = Number(h.location?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const facs = facilityNames(h);
      const declared = facs.some((f) => f.toLowerCase().includes(EV_LABEL));
      const charging = buildCharging(
        { lat, lng },
        chargers,
        declared,
        h.name,
        d.name,
        h.address?.full || (typeof h.address === "string" ? h.address : null),
      );
      if (charging.confidence === "none") continue;

      const slug = slugify(h.name);
      const images = (h.images || []).slice(0, 6);
      const copy = copyFor(h, d, charging, facs);

      kept.push({
        slug,
        name: h.name,
        citySlug: d.slug,
        city: d.name,
        cityEn: d.nameEn ?? d.name,
        country: d.country,
        countryEn: d.countryEn ?? d.country,
        lat,
        lng,
        address: h.address?.full || h.address || null,
        stars: h.stars ?? null,
        rating: h.rating ?? null,
        ratingLabel: h.ratingLabel ?? null,
        reviews: h.categoryReviews?.length ? null : (h.reviewSummary?.count ?? null),
        price: typeof h.price === "number" ? Math.round(h.price) : null,
        currency: h.currency || "EUR",
        bookingUrl: (h.url || "").split("?")[0],
        images,
        image: images[0] || null,
        facilities: facs,
        charging,
        copy,
        source: { hotel: "booking", charging: charging.onSite ? "osm" : "booking" },
      });
    }

    // Les mieux notés d'abord : le confort décide, la recharge est la condition.
    kept.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    const withOnSite = kept.filter((h) => h.charging.onSite);
    const withDoorstep = kept.filter((h) => h.charging.confidence === "doorstep");
    const dcCity = chargers.filter((c) => c.dc).length;
    const kwKnown = chargers.filter((c) => c.maxKw != null);

    const irveHotels = national.filter((h) => haversine(d, h) <= d.radiusM).length;

    cities.push({
      ...d,
      irveHotels,
      hotelCount: kept.length,
      declaredCount: kept.filter((h) => h.charging.declaredOnBooking).length,
      onSiteCount: withOnSite.length,
      doorstepCount: withDoorstep.length,
      bestKw: withOnSite.reduce((m, h) => Math.max(m, h.charging.onSite.kw ?? 0), 0) || null,
      chargersInCity: chargers.length,
      chargersDc: dcCity,
      chargersKwKnown: kwKnown.length,
      medianPrice:
        kept.length > 0
          ? kept.map((h) => h.price).filter(Boolean).sort((a, b) => a - b)[
              Math.floor(kept.filter((h) => h.price).length / 2)
            ] ?? null
          : null,
      scrapedAt: JSON.parse(await readFile(hf, "utf8")).fetchedAt,
    });

    allHotels.push(...kept);
    console.log(
      `[build] ${d.name}: ${kept.length} hôtels retenus (${kept.filter((h) => h.charging.declaredOnBooking).length} déclarés Booking, ${withOnSite.length} avec borne cartographiée), ${chargers.length} bornes en ville`,
    );
  }

  await writeFile(path.join(ROOT, "data", "hotels.json"), JSON.stringify(allHotels, null, 2));
  await writeFile(path.join(ROOT, "data", "cities.json"), JSON.stringify(cities, null, 2));
  console.log(`\n${allHotels.length} hôtels écrits dans data/hotels.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
