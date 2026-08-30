"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";

/**
 * Carte nationale des hôtels équipés.
 *
 * MapLibre avec les tuiles OpenFreeMap : pas de clé, pas de facturation à la
 * requête. Les points viennent d'un GeoJSON statique, agrégés en amas tant
 * qu'on est dézoomé, colorés selon la puissance.
 */
export function FranceMap({ lang, count }: { lang: Lang; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const fr = lang === "fr";

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css");
        if (cancelled || !ref.current) return;

        const m = new maplibre.Map({
          container: ref.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [2.4, 46.6],
          zoom: 4.9,
          attributionControl: { compact: true },
        });
        map = m;
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        m.on("load", () => {
          m.addSource("hotels", {
            type: "geojson",
            data: "/france-hotels.geojson",
            cluster: true,
            clusterRadius: 45,
            clusterMaxZoom: 11,
          });

          m.addLayer({
            id: "clusters",
            type: "circle",
            source: "hotels",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#0E9E7E",
              "circle-opacity": 0.9,
              "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 40, 26, 120, 32],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });
          m.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "hotels",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
            paint: { "text-color": "#FFFFFF" },
          });
          m.addLayer({
            id: "hotel",
            type: "circle",
            source: "hotels",
            filter: ["!", ["has", "point_count"]],
            paint: {
              // Vert pour la charge lente, encre pour la recharge rapide.
              "circle-color": ["case", [">=", ["coalesce", ["get", "k"], 0], 50], "#141B34", "#0E9E7E"],
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });

          m.on("click", "clusters", (e) => {
            const f = m.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
            const id = f.properties?.cluster_id;
            (m.getSource("hotels") as import("maplibre-gl").GeoJSONSource)
              .getClusterExpansionZoom(id)
              .then((z: number) => m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z }));
          });

          m.on("click", "hotel", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties as Record<string, string>;
            const kw = p.k ? `${String(p.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published";
            const html = `
              <div style="font-family:var(--font-sans);min-width:200px">
                <div style="font-weight:700;font-size:15px;line-height:1.2">${p.n}</div>
                <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${p.c}</div>
                <div style="margin-top:8px;font-weight:600;font-size:13px;color:#0E7C68">${kw}${p.so ? ` · ${p.so}` : ""}${p.p ? ` · ${p.p} ${fr ? "points" : "points"}` : ""}</div>
                <a href="${p.u}" target="_blank" rel="noopener nofollow sponsored"
                   style="display:inline-block;margin-top:10px;background:#141B34;color:#fff;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none">
                   ${fr ? "Voir sur Booking" : "See on Booking"}
                </a>
              </div>`;
            new maplibre.Popup({ closeButton: true, maxWidth: "280px" })
              .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
              .setHTML(html)
              .addTo(m);
          });

          for (const layer of ["clusters", "hotel"]) {
            m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
            m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""));
          }
          setReady(true);
        });

        m.on("error", () => setError(true));
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [fr]);

  return (
    <div style={{ position: "relative", border: "1px solid #EBEBF2", borderRadius: 18, overflow: "hidden" }}>
      <div ref={ref} style={{ height: 560, width: "100%", background: "#EDF1EE" }} />
      {!ready && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 13,
            color: "#8B8FA3",
            pointerEvents: "none",
          }}
        >
          {fr ? `Chargement des ${count} hôtels…` : `Loading ${count} hotels…`}
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#8A6414" }}>
          {fr ? "Carte indisponible pour l'instant." : "Map unavailable right now."}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "12px 16px",
          borderTop: "1px solid #EBEBF2",
          background: "#FFFFFF",
          fontWeight: 600,
          fontSize: 12.5,
          color: "#8B8FA3",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#141B34" }} />
          {fr ? "50 kW ou plus" : "50 kW or more"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0E9E7E" }} />
          {fr ? "recharge de nuit" : "overnight charging"}
        </span>
        <span style={{ flex: 1 }} />
        <span>{fr ? "Cliquez un point pour la fiche et le lien de réservation." : "Click a dot for details and the booking link."}</span>
      </div>
    </div>
  );
}
