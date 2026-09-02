"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Hotel } from "@/lib/data";
import { sealFor } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { MAP_ATTRIBUTION, MAP_STYLE } from "@/lib/tiles";

/**
 * Plan de la ville. Chaque hôtel porte son prix et sa puissance, et le survol
 * de la liste met sa pastille en avant.
 *
 * Rendu vectoriel : la couleur vient du fond de carte lui-même, l'eau en
 * bleu et les bois en vert, au lieu d'une teinte plaquée sur toute l'image.
 */
export function CityMap({
  hotels,
  lang,
  hovered,
  onHover,
}: {
  hotels: Hotel[];
  lang: Lang;
  hovered: string | null;
  onHover: (slug: string | null) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const ready = useRef(false);
  const markers = useRef<Map<string, { marker: import("maplibre-gl").Marker; pill: HTMLElement }>>(new Map());
  const fr = lang === "fr";

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !node.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: node.current,
        style: MAP_STYLE,
        center: [hotels[0]?.lng ?? 2.4, hotels[0]?.lat ?? 46.6],
        zoom: 12,
        scrollZoom: false,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: MAP_ATTRIBUTION }));
      map.on("load", () => {
        ready.current = true;
        map.resize();
      });

      ro = new ResizeObserver(() => map.resize());
      ro.observe(node.current);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      ready.current = false;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Les pastilles sont reconstruites quand la sélection change (filtres).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      const map = mapRef.current;
      if (cancelled || !map || hotels.length === 0) return;

      for (const { marker } of markers.current.values()) marker.remove();
      markers.current.clear();

      const bounds = new maplibregl.LngLatBounds();

      for (const h of hotels) {
        const seal = sealFor(h, lang);
        const kw = h.charging.onSite?.kwLabel ?? h.charging.maybe?.kwLabel ?? h.charging.doorstep?.kwLabel;

        const pill = document.createElement("span");
        pill.dataset.pin = h.slug;
        pill.style.cssText =
          "display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#FFFFFF;color:#141B34;border:1px solid #DCD9D1;box-shadow:0 1px 3px rgba(20,27,52,0.12);font-family:var(--font-sans);font-weight:600;font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer;transition:background 140ms ease,color 140ms ease,transform 140ms ease,box-shadow 140ms ease";
        pill.innerHTML = `${h.price != null ? `${h.price} €` : h.name.slice(0, 12)}${
          kw ? ` <span data-kw style="color:#0E9E7E">${kw}</span>` : ""
        }`;
        pill.addEventListener("mouseenter", () => onHover(h.slug));
        pill.addEventListener("mouseleave", () => onHover(null));

        const popup = new maplibregl.Popup({ offset: 16, maxWidth: "260px" }).setHTML(
          `<div style="font-family:var(--font-sans);min-width:210px">
             ${h.image ? `<img src="${h.image}" alt="" loading="lazy" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:12px;margin-bottom:9px">` : ""}
             <div style="font-weight:700;font-size:15px;line-height:1.2">${h.name}</div>
             <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${seal.text}</div>
             ${h.price != null ? `<div style="margin-top:8px;font-weight:600;font-size:13px">${fr ? "à partir de" : "from"} ${h.price} €</div>` : ""}
             <a href="/${lang}/${h.citySlug}/${h.slug}" style="display:inline-block;margin-top:10px;background:#141B34;color:#fff;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none">${fr ? "Voir la fiche" : "See the page"}</a>
           </div>`,
        );

        const marker = new maplibregl.Marker({ element: pill, anchor: "bottom" })
          .setLngLat([h.lng, h.lat])
          .setPopup(popup)
          .addTo(map);

        markers.current.set(h.slug, { marker, pill });
        bounds.extend([h.lng, h.lat]);
      }

      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 15, animate: false });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels.map((h) => h.slug).join(","), lang]);

  /**
   * Surbrillance pilotée par la liste : l'étiquette de l'hôtel survolé passe
   * en blanc sur fond sombre, grossit, et la carte se décale si elle se
   * trouve hors du champ visible. C'est ce qui relie d'un coup d'oeil une
   * carte de gauche à sa borne sur le plan.
   */
  useEffect(() => {
    for (const [slug, { pill, marker }] of markers.current) {
      const kwSpan = pill.querySelector("[data-kw]") as HTMLElement | null;
      const on = slug === hovered;
      pill.style.background = on ? "#141B34" : "#FFFFFF";
      pill.style.color = on ? "#FFFFFF" : "#141B34";
      pill.style.borderColor = on ? "#141B34" : "#DCD9D1";
      pill.style.transform = on ? "scale(1.18)" : "scale(1)";
      pill.style.boxShadow = on ? "0 6px 18px rgba(20,27,52,0.28)" : "0 1px 3px rgba(20,27,52,0.12)";
      pill.style.zIndex = on ? "10" : "1";
      if (kwSpan) kwSpan.style.color = on ? "#E4FB4F" : "#0E9E7E";
      if (on) marker.getElement().parentElement?.appendChild(marker.getElement());
    }

    const map = mapRef.current;
    const entry = hovered ? markers.current.get(hovered) : null;
    if (!map || !entry) return;
    const at = entry.marker.getLngLat();
    if (!map.getBounds().contains(at)) map.panTo(at, { duration: 400 });
  }, [hovered, hotels]);

  return <div ref={node} style={{ height: "100%", width: "100%", background: "#EDF1EE" }} />;
}
