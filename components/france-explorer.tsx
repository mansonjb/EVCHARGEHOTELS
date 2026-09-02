"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lang } from "@/lib/i18n";

/**
 * Explorateur national : la carte pilote la recherche.
 *
 * Le cadrage de la carte définit la liste, les filtres s'appliquent aux deux,
 * et l'URL porte l'état complet pour être partagée. Les 1 273 points sont
 * chargés une fois depuis un GeoJSON statique : pas d'appel serveur à chaque
 * déplacement, donc pas de latence ni de facturation à la requête.
 */

interface Props {
  lang: Lang;
  total: number;
}

interface Hotel {
  s: string;
  n: string;
  c: string;
  d: string | null;
  k: number | null;
  p: number | null;
  so: string;
  u: string;
  lat: number;
  lng: number;
}

interface Commune {
  nom: string;
  centre?: { coordinates: [number, number] };
  population?: number;
}

const INK = "#141B34";
const GREEN = "#0E9E7E";
const GREEN_DK = "#0A5C4D";
const LINE = "#DEDEEA";

const POWER_STEPS = [0, 11, 22, 50] as const;

function chipStyle(active: boolean): React.CSSProperties {
  return {
    flex: "0 0 auto",
    border: `1px solid ${active ? GREEN : LINE}`,
    background: active ? "#F1F9F5" : "#FFFFFF",
    color: active ? GREEN_DK : INK,
    padding: "0 14px",
    height: 36,
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

export function FranceExplorer({ lang, total }: Props) {
  const fr = lang === "fr";
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const popupRef = useRef<import("maplibre-gl").Popup | null>(null);

  const [all, setAll] = useState<Hotel[]>([]);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [minKw, setMinKw] = useState(0);
  const [sockets, setSockets] = useState<"all" | "ccs" | "type2">("all");
  const [layersReady, setLayersReady] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [limit, setLimit] = useState(40);

  /* ---------------------------------------------------------------- filtres */

  const matches = useCallback(
    (h: Hotel) => {
      if (minKw && (h.k ?? 0) < minKw) return false;
      if (sockets === "ccs" && !/ccs/i.test(h.so)) return false;
      if (sockets === "type2" && !/type 2/i.test(h.so)) return false;
      return true;
    },
    [minKw, sockets],
  );

  const visible = useMemo(() => {
    if (!bounds) return [];
    const [w, s, e, n] = bounds;
    return all
      .filter((h) => h.lng >= w && h.lng <= e && h.lat >= s && h.lat <= n && matches(h))
      .sort((a, b) => (b.k ?? 0) - (a.k ?? 0));
  }, [all, bounds, matches]);

  /* --------------------------------------------------- filtre côté carte */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;
    const f: unknown[] = ["all", ["!", ["has", "point_count"]]];
    if (minKw) f.push([">=", ["coalesce", ["get", "k"], 0], minKw]);
    if (sockets === "ccs") f.push(["!=", ["index-of", "CCS", ["coalesce", ["get", "so"], ""]], -1]);
    if (sockets === "type2") f.push(["!=", ["index-of", "Type 2", ["coalesce", ["get", "so"], ""]], -1]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setFilter("hotel", f as any);
  }, [minKw, sockets, layersReady]);

  /* ------------------------------------------------------- surbrillance */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty("hotel", "circle-radius", [
      "case",
      ["==", ["get", "s"], hovered ?? "__none__"],
      11,
      6,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);
  }, [hovered, layersReady]);

  /* ------------------------------------------------------------- URL */

  const syncUrl = useCallback(
    (center: { lat: number; lng: number }, zoom: number) => {
      const p = new URLSearchParams();
      p.set("lat", center.lat.toFixed(4));
      p.set("lng", center.lng.toFixed(4));
      p.set("zoom", zoom.toFixed(1));
      if (minKw) p.set("kw", String(minKw));
      if (sockets !== "all") p.set("prise", sockets);
      window.history.replaceState(null, "", `?${p}`);
    },
    [minKw, sockets],
  );

  // Les filtres font partie de l'état partageable au même titre que le cadrage.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    syncUrl(map.getCenter(), map.getZoom());
  }, [minKw, sockets, bounds, syncUrl]);

  /* ------------------------------------------------------------- carte */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !mapNode.current) return;
        libRef.current = maplibre;

        const url = new URL(window.location.href);
        const lat = Number(url.searchParams.get("lat")) || 46.6;
        const lng = Number(url.searchParams.get("lng")) || 2.4;
        const zoom = Number(url.searchParams.get("zoom")) || 4.9;
        const kw = Number(url.searchParams.get("kw"));
        const prise = url.searchParams.get("prise");
        if (kw) setMinKw(kw);
        if (prise === "ccs" || prise === "type2") setSockets(prise);

        const m = new maplibre.Map({
          container: mapNode.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [lng, lat],
          zoom,
          attributionControl: { compact: true },
        });
        mapRef.current = m;
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        m.addControl(new maplibre.GeolocateControl({ trackUserLocation: false }), "top-right");

        // Les points alimentent la liste dès qu'ils sont téléchargés, sans
        // attendre que la carte ait peint sa première image : dans un onglet
        // masqué, MapLibre n'émet jamais « load ».
        const res = await fetch("/france-hotels.geojson");
        const geo = (await res.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
        if (cancelled) return;

        setAll(
          geo.features.map((f) => ({
            ...(f.properties as unknown as Hotel),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          })),
        );
        const b0 = m.getBounds();
        setBounds([b0.getWest(), b0.getSouth(), b0.getEast(), b0.getNorth()]);

        const addLayers = () => {
          if (cancelled || m.getSource("hotels")) return;
          m.addSource("hotels", {
            type: "geojson",
            data: geo,
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
              "circle-color": GREEN,
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
              "circle-color": ["case", [">=", ["coalesce", ["get", "k"], 0], 50], INK, GREEN],
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });

          setLayersReady(true);

          m.on("moveend", () => {
            const bb = m.getBounds();
            mapNode.current?.setAttribute("data-zoom", m.getZoom().toFixed(1));
            setBounds([bb.getWest(), bb.getSouth(), bb.getEast(), bb.getNorth()]);
            setLimit(40);
            syncUrl(m.getCenter(), m.getZoom());
          });

          m.on("click", "clusters", (e) => {
            const f = m.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
            (m.getSource("hotels") as import("maplibre-gl").GeoJSONSource)
              .getClusterExpansionZoom(f.properties?.cluster_id)
              .then((z: number) =>
                m.jumpTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z }),
              );
          });

          m.on("click", "hotel", (e) => {
            const f = e.features?.[0];
            if (f) openPopup(f.properties as unknown as Hotel, (f.geometry as GeoJSON.Point).coordinates as [number, number]);
          });

          for (const layer of ["clusters", "hotel"]) {
            m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
            m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""));
          }
        };

        if (m.isStyleLoaded()) addLayers();
        else m.once("styledata", addLayers);

        m.on("error", () => setError(true));
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------ popup */

  const openPopup = useCallback(
    (h: Hotel, coords: [number, number]) => {
      const map = mapRef.current;
      const maplibre = libRef.current;
      if (!map || !maplibre) return;
      popupRef.current?.remove();
      const kw = h.k ? `${String(h.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published";
      popupRef.current = new maplibre.Popup({ closeButton: true, maxWidth: "290px" })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:var(--font-sans);min-width:210px">
             <div style="font-weight:700;font-size:15px;line-height:1.2">${h.n}</div>
             <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${h.c}</div>
             <div style="margin-top:8px;font-weight:600;font-size:13px;color:${GREEN_DK}">${kw}${h.so ? ` · ${h.so}` : ""}${h.p ? ` · ${h.p} ${fr ? "points" : "points"}` : ""}</div>
             <a href="${h.u}" target="_blank" rel="noopener nofollow sponsored"
                style="display:inline-block;margin-top:10px;background:${INK};color:#fff;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none">
                ${fr ? "Voir sur Booking" : "See on Booking"}</a>
           </div>`,
        )
        .addTo(map);
    },
    [fr],
  );

  /* ------------------------------------------------------- recherche ville */

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,centre,population&boost=population&limit=6`,
          { signal: ctrl.signal },
        );
        setSuggestions(await res.json());
      } catch {
        /* recherche annulée */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const goTo = (c: Commune) => {
    const coords = c.centre?.coordinates;
    if (!coords || !mapRef.current) return;
    mapRef.current.jumpTo({ center: coords, zoom: 12 });
    setQuery("");
    setSuggestions([]);
  };

  /* ---------------------------------------------------------------- rendu */

  const ready = all.length > 0 && bounds !== null;
  const shown = visible.slice(0, limit);

  return (
    <div style={{ border: "1px solid #EBEBF2", borderRadius: 18, overflow: "hidden", background: "#FFFFFF" }}>
      {/* Barre de filtres */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid #EBEBF2",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? "Aller à une ville" : "Jump to a town"}
            style={{
              height: 36,
              width: 190,
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "0 16px",
              fontSize: 13.5,
              fontWeight: 600,
              outline: "none",
            }}
          />
          {suggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                zIndex: 20,
                top: 42,
                left: 0,
                margin: 0,
                padding: 6,
                listStyle: "none",
                background: "#FFFFFF",
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                boxShadow: "0 8px 24px rgba(20,27,52,0.10)",
                minWidth: 220,
              }}
            >
              {suggestions.map((c) => (
                <li key={c.nom}>
                  <button
                    onClick={() => goTo(c)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      border: 0,
                      background: "transparent",
                      padding: "8px 10px",
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {c.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <span style={{ width: 1, height: 22, background: "#EBEBF2" }} />

        {POWER_STEPS.map((k) => (
          <button key={k} onClick={() => setMinKw(k)} style={chipStyle(minKw === k)}>
            {k === 0 ? (fr ? "Toutes puissances" : "Any power") : `${k} kW+`}
          </button>
        ))}
        <button onClick={() => setSockets(sockets === "type2" ? "all" : "type2")} style={chipStyle(sockets === "type2")}>
          Type 2
        </button>
        <button onClick={() => setSockets(sockets === "ccs" ? "all" : "ccs")} style={chipStyle(sockets === "ccs")}>
          CCS
        </button>

        <span style={{ flex: 1 }} />
        <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
          {ready
            ? fr
              ? `${visible.length} ${visible.length > 1 ? "hôtels" : "hôtel"} dans cette zone · ${total} en France`
              : `${visible.length} ${visible.length > 1 ? "hotels" : "hotel"} in view · ${total} in France`
            : fr
              ? "chargement…"
              : "loading…"}
        </span>
      </div>

      <div className="ps-explorer" style={{ display: "grid", gridTemplateColumns: "360px 1fr" }}>
        {/* Liste */}
        <div style={{ borderRight: "1px solid #EBEBF2", maxHeight: 620, overflowY: "auto" }}>
          {shown.length === 0 && ready && (
            <p style={{ padding: 20, fontSize: 14, color: "#8B8FA3", margin: 0 }}>
              {fr
                ? "Aucun hôtel dans ce cadrage avec ces filtres. Dézoomez ou baissez la puissance minimale."
                : "No hotel in this view with these filters. Zoom out or lower the minimum power."}
            </p>
          )}
          {shown.map((h) => (
            <div
              key={h.s}
              onMouseEnter={() => setHovered(h.s)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                mapRef.current?.jumpTo({ center: [h.lng, h.lat], zoom: Math.max(mapRef.current.getZoom(), 13) });
                openPopup(h, [h.lng, h.lat]);
              }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "baseline",
                padding: "13px 16px",
                borderBottom: "1px solid #F3F3F8",
                cursor: "pointer",
                background: hovered === h.s ? "#F1F9F5" : "#FFFFFF",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25 }}>{h.n}</div>
                <div style={{ fontSize: 12.5, color: "#8B8FA3", marginTop: 2 }}>{h.c}</div>
                <div className="tnum" style={{ fontSize: 12.5, color: GREEN_DK, marginTop: 5, fontWeight: 600 }}>
                  {h.k ? `${String(h.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published"}
                  {h.so ? ` · ${h.so}` : ""}
                  {h.p ? ` · ${h.p} pts` : ""}
                </div>
              </div>
              <a
                href={h.u}
                target="_blank"
                rel="noopener nofollow sponsored"
                onClick={(e) => e.stopPropagation()}
                className="ps-dark-btn"
                style={{
                  flex: "0 0 auto",
                  background: INK,
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {fr ? "Réserver" : "Book"}
              </a>
            </div>
          ))}
          {visible.length > shown.length && (
            <button
              onClick={() => setLimit((l) => l + 60)}
              style={{
                display: "block",
                width: "100%",
                border: 0,
                background: "#F3F3F8",
                padding: "13px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {fr ? `Voir ${Math.min(60, visible.length - shown.length)} de plus` : `Show ${Math.min(60, visible.length - shown.length)} more`}
            </button>
          )}
        </div>

        {/* Carte */}
        <div style={{ position: "relative" }}>
          <div ref={mapNode} style={{ height: 620, width: "100%", background: "#EDF1EE" }} />
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
              {fr ? `Chargement des ${total} hôtels…` : `Loading ${total} hotels…`}
            </div>
          )}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#8A6414" }}>
              {fr ? "Carte indisponible pour l'instant." : "Map unavailable right now."}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "12px 16px",
          borderTop: "1px solid #EBEBF2",
          fontWeight: 600,
          fontSize: 12.5,
          color: "#8B8FA3",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: INK }} />
          {fr ? "50 kW ou plus" : "50 kW or more"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: GREEN }} />
          {fr ? "recharge de nuit" : "overnight charging"}
        </span>
        <span style={{ flex: 1 }} />
        <span>
          {fr
            ? "La liste suit le cadrage de la carte. L'adresse de la page garde votre position et vos filtres."
            : "The list follows the map view. The page URL keeps your position and filters."}
        </span>
      </div>
    </div>
  );
}
