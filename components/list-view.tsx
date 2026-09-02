"use client";

import { useCallback, useMemo, useState } from "react";
import { cityName, countryName, type Hotel } from "@/lib/data";
import type { City } from "@/lib/data";
import { STR, type Lang } from "@/lib/i18n";
import { HotelCard } from "./hotel-card";
import { CityMap } from "./city-map";
import { CityPicker } from "./city-picker";

const INK = "#141B34";
const GREEN = "#0E9E7E";
const GREEN_DK = "#0A5C4D";
const LINE = "#DEDEEA";

function chip(active: boolean): React.CSSProperties {
  return {
    flex: "0 0 auto",
    border: `1px solid ${active ? GREEN : LINE}`,
    background: active ? "#F1F9F5" : "#FFFFFF",
    color: active ? GREEN_DK : INK,
    padding: "0 15px",
    height: 38,
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

export function ListView({ city, hotels, lang }: { city: City; hotels: Hotel[]; lang: Lang }) {
  const t = STR[lang];
  const [minKw, setMinKw] = useState(0);
  const [dcOnly, setDcOnly] = useState(false);
  const [guarOnly, setGuarOnly] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  // Référence stable : la carte ne doit pas se reconstruire quand le parent rend.
  const handleHover = useCallback((slug: string | null) => setHovered(slug), []);

  // Mémoïsé : sans cela la liste change d'identité à chaque rendu, la carte
  // reconstruit ses pastilles en boucle et perd la surbrillance.
  const all = useMemo(() => hotels.filter((h) => {
    const kw = h.charging.onSite?.kw ?? 0;
    if (dcOnly) return Boolean(h.charging.onSite?.dc);
    if (guarOnly) return Boolean(h.charging.onSite);
    return kw >= minKw;
  }), [hotels, dcOnly, guarOnly, minKw]);

  // Une fiche sans puissance chiffrée ne sert à rien : elle passe en second
  // rideau, avec la raison. La sélection ne garde que ce qui est mesuré.
  const hasPower = (h: Hotel) =>
    Boolean(h.charging.onSite?.kwLabel || h.charging.maybe?.kwLabel || h.charging.doorstep?.kwLabel);

  const list = useMemo(() => all.filter(hasPower), [all]);
  const doorstep = useMemo(() => all.filter((h) => !hasPower(h)), [all]);

  const count =
    lang === "fr"
      ? `${list.length} ${list.length > 1 ? "hôtels" : "hôtel"}`
      : `${list.length} ${list.length > 1 ? "hotels" : "hotel"}`;

  const verified = new Date(city.scrapedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 26px",
          background: "#FFFFFF",
          borderBottom: "1px solid #EBEBF2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
          <CityPicker lang={lang} current={city.slug} />
          <span style={{ fontWeight: 600, fontSize: 13.5, color: "#8B8FA3" }}>
            {countryName(city, lang)}
          </span>
        </div>

        <span style={{ flex: "0 0 1px", width: 1, height: 26, background: "#EBEBF2" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 auto", minWidth: 0, overflowX: "auto" }}>
          <button onClick={() => { setMinKw(0); setDcOnly(false); setGuarOnly(false); }} style={chip(!dcOnly && !guarOnly && minKw === 0)}>
            {t.allChargers}
          </button>
          <button onClick={() => { setMinKw(11); setDcOnly(false); setGuarOnly(false); }} style={chip(!dcOnly && minKw === 11)}>
            11 kW+
          </button>
          <button onClick={() => { setMinKw(22); setDcOnly(false); setGuarOnly(false); }} style={chip(!dcOnly && minKw === 22)}>
            22 kW+
          </button>
          <button onClick={() => { setMinKw(0); setDcOnly(true); setGuarOnly(false); }} style={chip(dcOnly)}>
            DC
          </button>
          <button onClick={() => { setGuarOnly((g) => !g); setDcOnly(false); setMinKw(0); }} style={chip(guarOnly)}>
            {lang === "fr" ? "Borne cartographiée" : "Charger mapped"}
          </button>
        </div>

        <div style={{ flex: "0 0 auto" }}>
          <button onClick={() => setShowMap((m) => !m)} style={{ ...chip(false), border: `1px solid ${INK}` }}>
            {showMap ? t.mapHide : t.mapShow}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, padding: "30px 26px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
              {t.listH1}{" "}
              <span className="hand" style={{ fontWeight: 700, fontSize: "1.12em", letterSpacing: 0 }}>
                {t.listH1b}
              </span>
            </h1>
            <div className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3", paddingBottom: 5 }}>
              {count} · {lang === "fr" ? `relevé ${verified}` : `checked ${verified}`}
            </div>
          </div>

          <div
            className="ps-cards"
            style={{
              display: "grid",
              gridTemplateColumns: showMap ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {list.map((h) => (
              <div
                key={h.slug}
                onMouseEnter={() => setHovered(h.slug)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  borderRadius: 16,
                  outline: hovered === h.slug ? "2px solid #0E9E7E" : "2px solid transparent",
                  outlineOffset: 2,
                  transition: "outline-color 140ms ease, transform 140ms ease",
                  transform: hovered === h.slug ? "translateY(-2px)" : "none",
                }}
              >
                <HotelCard hotel={h} lang={lang} />
              </div>
            ))}
          </div>

          {doorstep.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em" }}>
                {lang === "fr"
                  ? "Puissance non publiée par les sources"
                  : "Power not published by the sources"}
              </h2>
              {doorstep.map((h) => (
                <a
                  key={h.slug}
                  href={`/${lang}/${h.citySlug}/${h.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    background: "#FFFFFF",
                    border: "1px solid #EBEBF2",
                    borderRadius: 16,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#B9B5AC" }} />
                  <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.02em", color: "#8B8FA3", flex: 1, minWidth: 0 }}>
                    {h.name}
                  </span>
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 12, color: "#8B8FA3" }}>
                    {h.charging.nearestKnown
                      ? lang === "fr"
                        ? `borne connue la plus proche : ${h.charging.nearestKnown.kwLabel} à ${h.charging.nearestKnown.distance} m`
                        : `nearest known charger: ${h.charging.nearestKnown.kwLabel}, ${h.charging.nearestKnown.distance} m`
                      : t.noCharger}
                  </span>
                  {h.price != null && (
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 14, color: "#8B8FA3" }}>
                      {h.price} €
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          {list.length === 0 && doorstep.length === 0 && (
            <p style={{ color: "#8B8FA3", fontSize: 15 }}>
              {lang === "fr"
                ? "Aucun hôtel ne passe ce filtre dans cette ville. Élargissez la puissance minimale."
                : "No hotel matches this filter in this city. Lower the minimum power."}
            </p>
          )}
        </div>

        {showMap && (
          <div
            className="ps-map"
            style={{
              width: "44%",
              flex: "0 0 44%",
              position: "sticky",
              top: 66,
              height: "calc(100vh - 66px)",
              borderLeft: "1px solid #EBEBF2",
            }}
          >
            <CityMap hotels={list} lang={lang} hovered={hovered} onHover={handleHover} />
            <div
              className="tnum"
              style={{
                position: "absolute",
                right: 18,
                bottom: 42,
                zIndex: 500,
                display: "flex",
                flexDirection: "column",
                gap: 5,
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
              <span style={{ color: INK }}>{t.publicChargers}</span>
              <span>· {city.chargersInCity} {lang === "fr" ? "en ville" : "in town"}</span>
              <span>· {city.chargersDc} {lang === "fr" ? "en DC" : "DC"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
