"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Lang } from "@/lib/i18n";
import { addBasemap } from "@/lib/tiles";

/**
 * Carte de la page d'accueil : les hôtels équipés de toute la France, plus
 * les villes déjà ouvertes en étiquettes cliquables.
 *
 * Les points viennent du GeoJSON statique, chargés une fois et dessinés en
 * canvas : mille deux cents cercles ne coûtent rien à afficher, et la carte
 * reste utilisable dès le premier écran.
 */

interface Props {
  lang: Lang;
  cities: { slug: string; name: string; lat: number; lng: number; hotelCount: number }[];
}

interface Feature {
  geometry: { coordinates: [number, number] };
  properties: { s: string; n: string; c: string; k: number | null; p: number | null; so: string; u: string };
}

const INK = "#141B34";
const GREEN = "#0E9E7E";
const GREEN_DK = "#0A5C4D";

/** Trois familles de puissance, la seule chose qui change la nuit. */
function toneOf(kw: number | null) {
  if (kw != null && kw >= 50) return { fill: GREEN_DK, r: 5 };
  if (kw != null && kw >= 22) return { fill: GREEN, r: 4.2 };
  return { fill: "#9AA3B8", r: 3.4 };
}

export function FranceMiniMap({ lang, cities }: Props) {
  const fr = lang === "fr";
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !node.current || mapRef.current) return;

      const map = L.map(node.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        preferCanvas: true,
        minZoom: 5,
        // La carte reste sur la France : on ne dérive pas jusqu'en Pologne.
        maxBounds: [
          [39.5, -8.5],
          [53.0, 12.5],
        ],
        maxBoundsViscosity: 0.75,
      });
      mapRef.current = map;
      addBasemap(L, map);
      map.fitBounds([
        [41.3, -5.2],
        [51.15, 9.6],
      ]);

      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(node.current);
      requestAnimationFrame(() => map.invalidateSize());

      // Les villes ouvertes d'abord : elles doivent être lisibles même si le
      // GeoJSON national met une seconde à arriver.
      for (const c of cities) {
        const html = `
          <a href="/${lang}/${c.slug}" style="display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:${INK};color:#FFFFFF;border:1px solid ${INK};box-shadow:0 2px 8px rgba(20,27,52,0.22);font-family:var(--font-sans);font-weight:700;font-size:12.5px;text-decoration:none;white-space:nowrap">
            ${c.name}
            <span style="font-weight:600;color:#E4FB4F;font-variant-numeric:tabular-nums">${c.hotelCount}</span>
          </a>`;
        L.marker([c.lat, c.lng], {
          icon: L.divIcon({ html, className: "ps-pin", iconSize: [0, 0], iconAnchor: [0, 0] }),
          zIndexOffset: 800,
        }).addTo(map);
      }

      try {
        const res = await fetch("/france-hotels.geojson");
        const geo = (await res.json()) as { features: Feature[] };
        if (cancelled) return;
        setCount(geo.features.length);

        const layer = L.layerGroup().addTo(map);
        for (const f of geo.features) {
          const [lng, lat] = f.geometry.coordinates;
          const p = f.properties;
          const tone = toneOf(p.k);
          const dot = L.circleMarker([lat, lng], {
            radius: tone.r,
            fillColor: tone.fill,
            fillOpacity: 0.85,
            color: "#FFFFFF",
            weight: 1,
          }).addTo(layer);
          dot.bindPopup(
            `<div style="font-family:var(--font-sans);min-width:190px">
               <div style="font-weight:700;font-size:15px;line-height:1.2">${p.n}</div>
               <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${p.c}</div>
               <div style="margin-top:8px;font-weight:600;font-size:13px;color:${GREEN_DK}">${
                 p.k ? `${String(p.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published"
               }${p.so ? ` · ${p.so}` : ""}</div>
               <a href="/${lang}/france" style="display:inline-block;margin-top:10px;background:${INK};color:#fff;padding:7px 13px;border-radius:999px;font-weight:700;font-size:12.5px;text-decoration:none">${
                 fr ? "Ouvrir la carte" : "Open the map"
               }</a>
             </div>`,
            { maxWidth: 250 },
          );
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={node} style={{ height: "100%", width: "100%", background: "#EDF1EE" }} />
      <div
        className="tnum"
        style={{
          position: "absolute",
          left: 16,
          bottom: 26,
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "12px 14px",
          background: "#FFFFFF",
          border: "1px solid #DEDEEA",
          borderRadius: 14,
          fontWeight: 600,
          fontSize: 12.5,
          color: "#8B8FA3",
          pointerEvents: "none",
        }}
      >
        <span style={{ color: INK }}>
          {count != null
            ? fr
              ? `${count.toLocaleString("fr-FR")} hôtels équipés`
              : `${count.toLocaleString("en-GB")} equipped hotels`
            : failed
              ? fr
                ? "points indisponibles"
                : "points unavailable"
              : fr
                ? "chargement des points"
                : "loading points"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN_DK }} />
          {fr ? "50 kW et plus" : "50 kW and above"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
          {fr ? "22 à 50 kW" : "22 to 50 kW"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9AA3B8" }} />
          {fr ? "moins de 22 kW" : "under 22 kW"}
        </span>
      </div>
    </div>
  );
}
