"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lang } from "@/lib/i18n";
import { MAP_ATTRIBUTION, MAP_STYLE } from "@/lib/tiles";

/**
 * Explorateur national : la carte pilote la recherche.
 *
 * Rendu vectoriel (MapLibre) : les 1 273 points partent en une seule couche
 * dessinée par le GPU, au lieu d'autant de marqueurs dans le DOM, et le fond
 * garde ses couleurs de sens, l'eau en bleu et les bois en vert.
 *
 * Le GeoJSON est chargé une fois et filtré côté client : aucun appel serveur
 * au déplacement de la carte.
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
  /** Photo réelle de l'établissement, quand notre relevé Booking en a une. */
  im?: string;
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
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const popupRef = useRef<import("maplibre-gl").Popup | null>(null);

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
    p.set("zoom", String(Math.round(map.getZoom())));
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
        ${h.im ? `<img src="${h.im}" alt="" loading="lazy" style="display:block;width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px">` : ""}
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
    let ro: ResizeObserver | null = null;

    (async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !mapNode.current || mapRef.current) return;
        libRef.current = maplibregl;

        const url = new URL(window.location.href);
        const lat = Number(url.searchParams.get("lat")) || 46.6;
        const lng = Number(url.searchParams.get("lng")) || 2.4;
        const zoom = Number(url.searchParams.get("zoom")) || 5.2;
        const kw = Number(url.searchParams.get("kw"));
        const prise = url.searchParams.get("prise");
        if (kw) setMinKw(kw);
        if (prise === "ccs" || prise === "type2") setSockets(prise);

        const map = new maplibregl.Map({
          container: mapNode.current,
          style: MAP_STYLE,
          center: [lng, lat],
          zoom,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
        map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: MAP_ATTRIBUTION }));

        const readBounds = () => {
          const b = map.getBounds();
          setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        };

        map.on("moveend", () => {
          readBounds();
          setLimit(40);
          syncUrl();
        });

        ro = new ResizeObserver(() => map.resize());
        ro.observe(mapNode.current);

        map.on("load", async () => {
          readBounds();
          const res = await fetch("/france-hotels.geojson");
          const geo = (await res.json()) as GeoJSON.FeatureCollection<GeoJSON.Point>;
          if (cancelled) return;

          const list: Hotel[] = geo.features.map((f) => ({
            ...(f.properties as unknown as Hotel),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }));
          setAll(list);

          map.addSource("hotels", { type: "geojson", data: geo, promoteId: "s" });
          map.addLayer({
            id: "hotels",
            type: "circle",
            source: "hotels",
            paint: {
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                10,
                ["interpolate", ["linear"], ["zoom"], 5, 4, 9, 6, 13, 8],
              ],
              "circle-color": [
                "case",
                [">=", ["coalesce", ["get", "k"], 0], 50],
                INK,
                GREEN,
              ],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 2,
            },
          });

          map.on("mouseenter", "hotels", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "hotels", () => {
            map.getCanvas().style.cursor = "";
            setHovered(null);
          });
          map.on("mousemove", "hotels", (e) => {
            const f = e.features?.[0];
            if (f?.id) setHovered(String(f.id));
          });
          map.on("click", "hotels", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const h = {
              ...(f.properties as unknown as Hotel),
              lng: (f.geometry as GeoJSON.Point).coordinates[0],
              lat: (f.geometry as GeoJSON.Point).coordinates[1],
            };
            popupRef.current?.remove();
            popupRef.current = new maplibregl.Popup({ offset: 12, maxWidth: "280px" })
              .setLngLat([h.lng, h.lat])
              .setHTML(popupHtml(h))
              .addTo(map);
          });
        });
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------- points affichés = filtrés */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer?.("hotels")) return;
    const filters: unknown[] = ["all"];
    if (minKw) filters.push([">=", ["coalesce", ["get", "k"], 0], minKw]);
    if (sockets === "ccs") filters.push([">=", ["index-of", "CCS", ["coalesce", ["get", "so"], ""]], 0]);
    if (sockets === "type2") filters.push([">=", ["index-of", "Type 2", ["coalesce", ["get", "so"], ""]], 0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setFilter("hotels", filters.length > 1 ? (filters as any) : null);
  }, [minKw, sockets, all]);

  /* ------------------------------------------------------- surbrillance */

  const lastHover = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource?.("hotels")) return;
    if (lastHover.current) map.setFeatureState({ source: "hotels", id: lastHover.current }, { hover: false });
    if (hovered) map.setFeatureState({ source: "hotels", id: hovered }, { hover: true });
    lastHover.current = hovered;
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
    mapRef.current.flyTo({ center: [coords[0], coords[1]], zoom: 12 });
    setQuery("");
    setSuggestions([]);
  };

  const focus = (h: Hotel) => {
    const map = mapRef.current;
    const maplibregl = libRef.current;
    if (!map || !maplibregl) return;
    map.flyTo({ center: [h.lng, h.lat], zoom: Math.max(map.getZoom(), 13) });
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ offset: 12, maxWidth: "280px" })
      .setLngLat([h.lng, h.lat])
      .setHTML(popupHtml(h))
      .addTo(map);
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
                alignItems: "flex-start",
                padding: "13px 16px",
                borderBottom: "1px solid #F1F4F2",
                cursor: "pointer",
                background: hovered === h.s ? "#F1F9F5" : "#FFFFFF",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: "0 0 auto",
                  width: 78,
                  height: 62,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#F7F5F1",
                  border: "1px solid #EAE6DE",
                }}
              >
                {h.im ? (
                  <Image src={h.im} alt="" fill sizes="78px" style={{ objectFit: "cover" }} />
                ) : (
                  <span
                    className="tnum"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      fontWeight: 800,
                      fontSize: 15,
                      color: GREEN_DK,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {h.k ? String(h.k).replace(".", ",") : "–"}
                    <span style={{ fontWeight: 700, fontSize: 9.5, letterSpacing: "0.06em", color: "#5FA894" }}>
                      {h.k ? "KW" : fr ? "N.C." : "N/A"}
                    </span>
                  </span>
                )}
              </div>
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
                background: "#F7F5F1",
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
