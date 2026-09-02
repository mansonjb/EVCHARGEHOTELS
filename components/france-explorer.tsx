"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Lang } from "@/lib/i18n";
import { addBasemap } from "@/lib/tiles";

/**
 * Explorateur national : la carte pilote la recherche.
 *
 * Fond de carte en tuiles image (Leaflet, rendu canvas 2D) et non en tuiles
 * vectorielles : le vectoriel exige WebGL et une fenêtre qui compose vraiment
 * ses images, ce qui laissait un rectangle gris dans plusieurs contextes.
 *
 * Les 1 273 points sont chargés une fois depuis un GeoJSON statique et filtrés
 * côté client : aucun appel serveur au déplacement de la carte.
 */

interface Props {
  lang: Lang;
  total: number;
}

interface Hotel {
  s: string;
  n: string;
  c: string;
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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const libRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());

  const [all, setAll] = useState<Hotel[]>([]);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [minKw, setMinKw] = useState(0);
  const [sockets, setSockets] = useState<"all" | "ccs" | "type2">("all");
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [limit, setLimit] = useState(40);

  /* --------------------------------------------------------------- filtres */

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

  const ready = all.length > 0 && bounds !== null;

  /* ----------------------------------------------------------------- URL */

  const syncUrl = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const p = new URLSearchParams();
    p.set("lat", c.lat.toFixed(4));
    p.set("lng", c.lng.toFixed(4));
    p.set("zoom", String(map.getZoom()));
    if (minKw) p.set("kw", String(minKw));
    if (sockets !== "all") p.set("prise", sockets);
    window.history.replaceState(null, "", `?${p}`);
  }, [minKw, sockets]);

  useEffect(() => {
    if (bounds) syncUrl();
  }, [minKw, sockets, bounds, syncUrl]);

  /* ---------------------------------------------------------------- popup */

  const popupHtml = useCallback(
    (h: Hotel) => {
      const kw = h.k ? `${String(h.k).replace(".", ",")} kW` : fr ? "puissance non publiée" : "power not published";
      return `<div style="font-family:var(--font-sans);min-width:200px">
        <div style="font-weight:700;font-size:15px;line-height:1.2">${h.n}</div>
        <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${h.c}</div>
        <div style="margin-top:8px;font-weight:600;font-size:13px;color:${GREEN_DK}">${kw}${h.so ? ` · ${h.so}` : ""}${h.p ? ` · ${h.p} ${fr ? "points" : "points"}` : ""}</div>
        <a href="${h.u}" target="_blank" rel="noopener nofollow sponsored"
           style="display:inline-block;margin-top:10px;background:${INK};color:#fff;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none">
           ${fr ? "Voir sur Booking" : "See on Booking"}</a>
      </div>`;
    },
    [fr],
  );

  /* ----------------------------------------------------------------- carte */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !mapNode.current) return;
        libRef.current = L;

        const url = new URL(window.location.href);
        const lat = Number(url.searchParams.get("lat")) || 46.6;
        const lng = Number(url.searchParams.get("lng")) || 2.4;
        const zoom = Number(url.searchParams.get("zoom")) || 6;
        const kw = Number(url.searchParams.get("kw"));
        const prise = url.searchParams.get("prise");
        if (kw) setMinKw(kw);
        if (prise === "ccs" || prise === "type2") setSockets(prise);

        // preferCanvas : les points sont dessinés en canvas 2D, ce qui tient
        // largement les 1 273 marqueurs sans WebGL.
        const map = L.map(mapNode.current, { preferCanvas: true, zoomControl: true }).setView([lat, lng], zoom);
        mapRef.current = map;

        addBasemap(L, map);

        const group = L.layerGroup().addTo(map);
        layerRef.current = group;

        const readBounds = () => {
          const b = map.getBounds();
          setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        };
        readBounds();

        map.on("moveend zoomend", () => {
          readBounds();
          setLimit(40);
          syncUrl();
        });

        // Le conteneur est dans une grille : sa taille peut arriver après la
        // création de la carte.
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(mapNode.current);
        requestAnimationFrame(() => map.invalidateSize());

        const res = await fetch("/france-hotels.geojson");
        const geo = (await res.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
        if (cancelled) return;

        const list: Hotel[] = geo.features.map((f) => ({
          ...(f.properties as unknown as Hotel),
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }));
        setAll(list);

        for (const h of list) {
          const marker = L.circleMarker([h.lat, h.lng], {
            radius: 5,
            color: "#FFFFFF",
            weight: 2,
            fillColor: (h.k ?? 0) >= 50 ? INK : GREEN,
            fillOpacity: 1,
          });
          marker.bindPopup(popupHtml(h), { maxWidth: 280 });
          marker.on("mouseover", () => setHovered(h.s));
          marker.on("mouseout", () => setHovered(null));
          markersRef.current.set(h.s, marker);
        }

        return () => ro.disconnect();
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------- points affichés = filtrés */

  useEffect(() => {
    const group = layerRef.current;
    if (!group || all.length === 0) return;
    group.clearLayers();
    for (const h of all) {
      if (!matches(h)) continue;
      const m = markersRef.current.get(h.s);
      if (m) group.addLayer(m);
    }
  }, [all, matches]);

  /* ------------------------------------------------------- surbrillance */

  useEffect(() => {
    for (const [slug, marker] of markersRef.current) {
      marker.setRadius(slug === hovered ? 10 : 5);
    }
  }, [hovered]);

  /* --------------------------------------------------- recherche commune */

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,centre&boost=population&limit=6`,
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
    mapRef.current.setView([coords[1], coords[0]], 13);
    setQuery("");
    setSuggestions([]);
  };

  const focus = (h: Hotel) => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([h.lat, h.lng], Math.max(map.getZoom(), 14));
    markersRef.current.get(h.s)?.openPopup();
  };

  /* ---------------------------------------------------------------- rendu */

  const shown = visible.slice(0, limit);

  return (
    <div style={{ border: "1px solid #EBEBF2", borderRadius: 18, overflow: "hidden", background: "#FFFFFF" }}>
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
                zIndex: 1000,
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
              onClick={() => focus(h)}
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
              {fr
                ? `Voir ${Math.min(60, visible.length - shown.length)} de plus`
                : `Show ${Math.min(60, visible.length - shown.length)} more`}
            </button>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <div ref={mapNode} style={{ height: 620, width: "100%", background: "#EDF1EE" }} />
          {!ready && !error && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 18,
                transform: "translateX(-50%)",
                padding: "7px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.94)",
                border: "1px solid #EBEBF2",
                fontWeight: 600,
                fontSize: 12.5,
                color: "#8B8FA3",
                pointerEvents: "none",
                zIndex: 500,
              }}
            >
              {fr ? `Chargement des ${total} hôtels…` : `Loading ${total} hotels…`}
            </div>
          )}
          {error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "#8A6414",
              }}
            >
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
