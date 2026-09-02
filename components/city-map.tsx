"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Hotel } from "@/lib/data";
import { sealFor } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { addBasemap } from "@/lib/tiles";

/**
 * Plan de la ville : une vraie carte, à la place du fond quadrillé de la
 * maquette. Chaque hôtel porte son prix et sa puissance, et le survol de la
 * liste met sa pastille en avant.
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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const fr = lang === "fr";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !node.current || mapRef.current) return;

      const map = L.map(node.current, { scrollWheelZoom: false, zoomControl: true });
      mapRef.current = map;
      addBasemap(L, map);

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(node.current);
      requestAnimationFrame(() => map.invalidateSize());

      return () => ro.disconnect();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  // Les pastilles sont reconstruites quand la sélection change (filtres).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (cancelled || !map || hotels.length === 0) return;

      for (const m of markers.current.values()) m.remove();
      markers.current.clear();

      for (const h of hotels) {
        const seal = sealFor(h, lang);
        const kw = h.charging.onSite?.kwLabel ?? h.charging.maybe?.kwLabel ?? h.charging.doorstep?.kwLabel;
        const label = `
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#FFFFFF;border:1px solid #DCD9D1;box-shadow:0 1px 3px rgba(20,27,52,0.12);font-family:var(--font-sans);font-weight:600;font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap">
            ${h.price != null ? `${h.price} €` : h.name.slice(0, 12)}
            ${kw ? `<span style="color:#0E9E7E">${kw}</span>` : ""}
          </span>`;

        const marker = L.marker([h.lat, h.lng], {
          icon: L.divIcon({ html: label, className: "ps-pin", iconSize: [0, 0], iconAnchor: [0, 0] }),
          riseOnHover: true,
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:var(--font-sans);min-width:190px">
             <div style="font-weight:700;font-size:15px;line-height:1.2">${h.name}</div>
             <div style="font-size:12.5px;color:#8B8FA3;margin-top:2px">${seal.text}</div>
             ${h.price != null ? `<div style="margin-top:8px;font-weight:600;font-size:13px">${fr ? "à partir de" : "from"} ${h.price} €</div>` : ""}
             <a href="/${lang}/${h.citySlug}/${h.slug}" style="display:inline-block;margin-top:10px;background:#141B34;color:#fff;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none">${fr ? "Voir la fiche" : "See the page"}</a>
           </div>`,
          { maxWidth: 260 },
        );
        marker.on("mouseover", () => onHover(h.slug));
        marker.on("mouseout", () => onHover(null));
        markers.current.set(h.slug, marker);
      }

      const group = L.featureGroup([...markers.current.values()]);
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 });
    })();

    return () => {
      cancelled = true;
    };
  }, [hotels, lang, fr, onHover]);

  // Surbrillance pilotée par la liste.
  useEffect(() => {
    for (const [slug, marker] of markers.current) {
      const el = marker.getElement();
      if (!el) continue;
      const pill = el.firstElementChild as HTMLElement | null;
      if (!pill) continue;
      const on = slug === hovered;
      pill.style.background = on ? "#141B34" : "#FFFFFF";
      pill.style.color = on ? "#FFFFFF" : "#141B34";
      pill.style.borderColor = on ? "#141B34" : "#DCD9D1";
      if (on) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    }
  }, [hovered, hotels]);

  return <div ref={node} style={{ height: "100%", width: "100%", background: "#EDF1EE" }} />;
}
