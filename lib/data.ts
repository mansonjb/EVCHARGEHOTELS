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

export interface Doorstep {
  distance: number;
  kw: number | null;
  kwLabel: string | null;
  sockets: string[];
  name: string | null;
}

export interface Charging {
  declaredOnBooking: boolean;
  confidence: "confirmed" | "declared" | "mapped" | "doorstep";
  /** Ce qui rattache la borne à l'hôtel : déclaration, accès réservé, ou nom. */
  linkReason: "declared" | "access" | "name" | "distance" | null;
  doorstep: Doorstep | null;
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
  cityEn: string;
  country: string;
  countryEn: string;
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
  nameEn: string;
  country: string;
  countryEn: string;
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

/** Le nom de la ville dans la langue de la page. */
export const cityName = (c: { name: string; nameEn: string }, lang: Lang) =>
  lang === "en" ? c.nameEn : c.name;
export const countryName = (c: { country: string; countryEn: string }, lang: Lang) =>
  lang === "en" ? c.countryEn : c.country;
export const hotelCityName = (h: { city: string; cityEn: string }, lang: Lang) =>
  lang === "en" ? h.cityEn : h.city;

export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug);
export const hotelsInCity = (slug: string) => hotels.filter((h) => h.citySlug === slug);
export const hotelBySlug = (city: string, slug: string) =>
  hotels.find((h) => h.citySlug === city && h.slug === slug);

const TIER: Record<Charging["confidence"], number> = {
  confirmed: 0,
  mapped: 1,
  declared: 2,
  doorstep: 3,
};

/** Ce qu'on sait le mieux passe devant, puis la note des voyageurs. */
export function rankHotels(list: Hotel[]) {
  return [...list].sort((a, b) => {
    const t = TIER[a.charging.confidence] - TIER[b.charging.confidence];
    if (t !== 0) return t;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

/** Le sceau posé sur la photo : ce qu'on sait de la borne, en une ligne. */
export function sealFor(h: Hotel, lang: Lang) {
  const c = h.charging;
  const fr = lang === "fr";
  if (c.onSite) {
    const parts = [c.onSite.kwLabel ?? (fr ? "borne sur place" : "charger on site")];
    if (c.onSite.socketLabels.length) parts.push(c.onSite.socketLabels[0]);
    return { text: parts.join(" · "), tone: "known" as const };
  }
  if (c.declaredOnBooking) {
    return {
      text: fr ? "recharge déclarée · puissance inconnue" : "charging declared · power unknown",
      tone: "declared" as const,
    };
  }
  const d = c.doorstep;
  return {
    text: d
      ? fr
        ? `borne publique à ${d.distance} m${d.kwLabel ? ` · ${d.kwLabel}` : ""}`
        : `public charger ${d.distance} m away${d.kwLabel ? ` · ${d.kwLabel}` : ""}`
      : fr
        ? "pas de borne identifiée"
        : "no charger identified",
    tone: "doorstep" as const,
  };
}

export function proofFor(h: Hotel, lang: Lang) {
  const c = h.charging;
  const fr = lang === "fr";
  const bits: string[] = [];
  if (c.onSite) {
    bits.push(
      c.linkReason === "declared"
        ? fr
          ? `déclarée par l'hôtel, borne à ${c.onSite.distance} m`
          : `declared by the hotel, charger ${c.onSite.distance} m away`
        : c.linkReason === "access"
          ? fr
            ? `borne réservée aux clients à ${c.onSite.distance} m`
            : `customers-only charger ${c.onSite.distance} m away`
          : c.linkReason === "name"
            ? fr
              ? `borne au nom de l'hôtel à ${c.onSite.distance} m`
              : `charger named after the hotel, ${c.onSite.distance} m away`
            : fr
              ? `borne cartographiée à ${c.onSite.distance} m de l'entrée`
              : `charger mapped ${c.onSite.distance} m from the door`,
    );
    if (c.onSite.points) bits.push(fr ? `${c.onSite.points} points` : `${c.onSite.points} points`);
  } else if (c.declaredOnBooking) {
    bits.push(fr ? "déclarée sur Booking, non cartographiée" : "declared on Booking, not mapped");
  } else if (c.doorstep) {
    bits.push(
      fr
        ? `aucune borne d'hôtel, borne publique à ${c.doorstep.distance} m`
        : `no hotel charger, public charger ${c.doorstep.distance} m away`,
    );
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
