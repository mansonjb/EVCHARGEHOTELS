"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lang } from "@/lib/i18n";
import { MAP_ATTRIBUTION, MAP_STYLE } from "@/lib/tiles";

/**
 * Carte de la page d'accueil : les hôtels équipés de toute la France, plus
 * les villes déjà ouvertes en étiquettes cliquables.
 *
 * Les 1 273 points sont servis en couche vectorielle, dessinée par le GPU :
 * la couleur du point dit la puissance, le fond de carte garde la sienne.
 */

interface Props {
  lang: Lang;
  cities: { slug: string; name: string; lat: number; lng: number; hotelCount: number }[];
}

const INK = "#141B34";
const GREEN = "#0E9E7E";
const GREEN_DK = "#0A5C4D";

export function FranceMiniMap({ lang, cities }: Props) {
  const fr = lang === "fr";
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !node.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: node.current,
        style: MAP_STYLE,
        bounds: [
          [-5.2, 41.3],
          [9.6, 51.15],
        ],
        fitBoundsOptions: { padding: 20 },
        scrollZoom: false,
        minZoom: 4,
        maxBounds: [
          [-13, 38],
          [17, 54],
        ],
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: MAP_ATTRIBUTION }));

      ro = new ResizeObserver(() => map.resize());
      ro.observe(node.current);

      map.on("load", async () => {
        // Les villes ouvertes, en étiquettes cliquables.
        for (const c of cities) {
          const el = document.createElement("a");
          el.href = `/${lang}/${c.slug}`;
          el.style.cssText =
            "display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:#141B34;color:#FFFFFF;border:1px solid #141B34;box-shadow:0 2px 8px rgba(20,27,52,0.22);font-family:var(--font-sans);font-weight:700;font-size:12.5px;text-decoration:none;white-space:nowrap";
          el.innerHTML = `${c.name} <span style="font-weight:600;color:#E4FB4F;font-variant-numeric:tabular-nums">${c.hotelCount}</span>`;
          new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([c.lng, c.lat]).addTo(map);
        }

        try {
          const res = await fetch("/france-hotels.geojson");
          const geo = await res.json();
          if (cancelled) return;
          setCount(geo.features.length);

          map.addSource("hotels", { type: "geojson", data: geo });
          map.addLayer({
            id: "hotels",
            type: "circle",
            source: "hotels",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 8, 5, 12, 7],
              "circle-color": [
                "case",
                [">=", ["coalesce", ["get", "k"], 0], 50],
                GREEN_DK,
                [">=", ["coalesce", ["get", "k"], 0], 22],
                GREEN,
                "#9AA3B8",
              ],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.2,
              "circle-opacity": 0.92,
            },
          });

          map.on("mouseenter", "hotels", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "hotels", () => (map.getCanvas().style.cursor = ""));
          map.on("click", "hotels", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties as Record<string, string | number | null>;
            const kw = p.k ? `${String(p.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published";
            new maplibregl.Popup({ offset: 12, maxWidth: "250px" })
              .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
              .setHTML(
                `<div style="font-family:var(--font-sans);min-width:200px">
                   ${p.im ? `<img src="${p.im}" alt="" loading="lazy" style="display:block;width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px">` : ""}
                   <div style="font-weight:700;font-size:15px;line-height:1.2">${p.n}</div>
                   <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${p.c}</div>
                   <div style="margin-top:8px;font-weight:600;font-size:13px;color:${GREEN_DK}">${kw}${p.so ? ` · ${p.so}` : ""}</div>
                   <a href="/${lang}/france" style="display:inline-block;margin-top:10px;background:${INK};color:#fff;padding:7px 13px;border-radius:999px;font-weight:700;font-size:12.5px;text-decoration:none">${fr ? "Ouvrir la carte" : "Open the map"}</a>
                 </div>`,
              )
              .addTo(map);
          });
        } catch {
          if (!cancelled) setFailed(true);
        }
      });
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
          zIndex: 5,
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
