import hotelsJson from "@/data/hotels.json";
import citiesJson from "@/data/cities.json";
import type { Lang } from "./i18n";

export interface NearbyCharger {
  name: string | null;
  distance: number;
  kw: number | null;
  kwLabel: string | null;
  sockets: string[];
  points: number | null;
  fee: "paid" | "free" | null;
  open247: boolean;
}

export interface OnSiteCharger {
  osmId: string;
  distance: number;
  kw: number | null;
  kwLabel: string | null;
  dc: boolean;
  sockets: string[];
  socketLabels: string[];
  points: number | null;
  fee: "paid" | "free" | null;
  open247: boolean;
  reservation: string | null;
  amperage: string | null;
  voltage: string | null;
  operator: string | null;
  access: string | null;
}

export interface Charging {
  declaredOnBooking: boolean;
  confidence: "confirmed" | "declared" | "mapped";
  onSite: OnSiteCharger | null;
  nearby: {
    count: number;
    within: number;
    bestKw: number | null;
    bestKwLabel: string | null;
    nearestM: number | null;
    list: NearbyCharger[];
  };
}

export interface Hotel {
  slug: string;
  name: string;
  citySlug: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  address: string | null;
  stars: number | null;
  rating: number | null;
  ratingLabel: string | null;
  price: number | null;
  currency: string;
  bookingUrl: string;
  images: string[];
  image: string | null;
  facilities: string[];
  charging: Charging;
  copy: { envie: { fr: string; en: string }; charge: { fr: string; en: string } };
}

export interface City {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  radiusM: number;
  corridorKm: number;
  hotelCount: number;
  declaredCount: number;
  onSiteCount: number;
  bestKw: number | null;
  chargersInCity: number;
  chargersDc: number;
  chargersKwKnown: number;
  medianPrice: number | null;
  scrapedAt: string;
}

export const hotels = hotelsJson as unknown as Hotel[];
export const cities = citiesJson as unknown as City[];

export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug);
export const hotelsInCity = (slug: string) => hotels.filter((h) => h.citySlug === slug);
export const hotelBySlug = (city: string, slug: string) =>
  hotels.find((h) => h.citySlug === city && h.slug === slug);

/** Les hôtels dont la borne est cartographiée passent devant, puis la note. */
export function rankHotels(list: Hotel[]) {
  return [...list].sort((a, b) => {
    const ka = a.charging.onSite?.kw ?? -1;
    const kb = b.charging.onSite?.kw ?? -1;
    if ((ka >= 0) !== (kb >= 0)) return kb - ka;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

/** Le sceau posé sur la photo : ce qu'on sait de la borne, en une ligne. */
export function sealFor(h: Hotel, lang: Lang) {
  const c = h.charging;
  if (c.onSite) {
    const parts = [c.onSite.kwLabel ?? (lang === "fr" ? "borne sur place" : "charger on site")];
    if (c.onSite.socketLabels.length) parts.push(c.onSite.socketLabels[0]);
    return { text: parts.join(" · "), tone: "known" as const };
  }
  return {
    text: lang === "fr" ? "recharge déclarée · puissance inconnue" : "charging declared · power unknown",
    tone: "declared" as const,
  };
}

export function proofFor(h: Hotel, lang: Lang) {
  const c = h.charging;
  const bits: string[] = [];
  if (c.onSite) {
    bits.push(
      lang === "fr"
        ? `borne cartographiée à ${c.onSite.distance} m`
        : `charger mapped ${c.onSite.distance} m away`,
    );
    if (c.onSite.points)
      bits.push(lang === "fr" ? `${c.onSite.points} points` : `${c.onSite.points} points`);
  } else {
    bits.push(lang === "fr" ? "déclarée sur Booking" : "declared on Booking");
  }
  if (c.nearby.count)
    bits.push(
      lang === "fr"
        ? `${c.nearby.count} bornes à moins de ${c.nearby.within} m`
        : `${c.nearby.count} chargers within ${c.nearby.within} m`,
    );
  return bits.join(" · ");
}

/** Nuit de référence : 13 h branché, batterie 77 kWh, 18 kWh/100 km. */
export function overnight(kw: number | null) {
  if (!kw) return null;
  const HOURS = 13;
  const BATTERY = 77;
  const CONSO = 18;
  const energy = Math.min(kw * HOURS * 0.92, BATTERY);
  const km = Math.round((energy / CONSO) * 100 / 10) * 10;
  const hoursToFull = Math.round((BATTERY / (kw * 0.92)) * 10) / 10;
  return { km, energy: Math.round(energy), hoursToFull, hours: HOURS };
}
