"use client";

import { useState } from "react";
import { HOTELS, NO_CHARGER } from "@/data/hotels";
import { STR, type Lang } from "@/lib/i18n";
import { HotelCard } from "./hotel-card";

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

export function ListView({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const [minKw, setMinKw] = useState(0);
  const [dcOnly, setDcOnly] = useState(false);
  const [guarOnly, setGuarOnly] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [chargersOn, setChargersOn] = useState(false);

  const list = HOTELS.filter(
    (h) => (dcOnly ? h.dc : h.kwNum >= minKw) && (!guarOnly || h.guar),
  );

  const count =
    lang === "fr"
      ? `${list.length} ${list.length > 1 ? "hôtels" : "hôtel"}`
      : `${list.length} ${list.length > 1 ? "hotels" : "hotel"}`;

  return (
    <div>
      {/* Barre de filtres */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: "0 0 auto",
            height: 46,
            border: "1px solid #DEDEEA",
            borderRadius: 999,
            background: "#FFFFFF",
            padding: "0 5px 0 18px",
          }}
        >
          <span style={{ width: 104, fontSize: 14.5, fontWeight: 700 }}>Bordeaux</span>
          <span style={{ width: 1, height: 20, background: "#EBEBF2", margin: "0 14px" }} />
          <span style={{ width: 92, fontWeight: 600, fontSize: 13.5 }}>12 – 13 juin</span>
          <button
            className="ps-dark-btn"
            style={{
              flex: "0 0 auto",
              marginLeft: 12,
              border: 0,
              background: INK,
              color: "#FFFFFF",
              height: 36,
              padding: "0 20px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.search}
          </button>
        </div>

        <span style={{ flex: "0 0 1px", width: 1, height: 26, background: "#EBEBF2" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 auto", minWidth: 0, overflowX: "auto" }}>
          <button onClick={() => { setMinKw(0); setDcOnly(false); }} style={chip(!dcOnly && minKw === 0)}>
            {t.allChargers}
          </button>
          <button onClick={() => { setMinKw(11); setDcOnly(false); }} style={chip(!dcOnly && minKw === 11)}>
            11 kW+
          </button>
          <button onClick={() => { setMinKw(22); setDcOnly(false); }} style={chip(!dcOnly && minKw === 22)}>
            22 kW+
          </button>
          <button onClick={() => { setMinKw(0); setDcOnly(true); }} style={chip(dcOnly)}>
            DC
          </button>
          <button onClick={() => setGuarOnly((g) => !g)} style={chip(guarOnly)}>
            {t.guaranteedChip}
          </button>
        </div>

        <div style={{ flex: "0 0 auto" }}>
          <button
            onClick={() => setShowMap((m) => !m)}
            style={{ ...chip(false), border: `1px solid ${INK}` }}
          >
            {showMap ? t.mapHide : t.mapShow}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "30px 26px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
              {t.listH1}{" "}
              <span className="hand" style={{ fontWeight: 700, fontSize: "1.12em", letterSpacing: 0 }}>
                {t.listH1b}
              </span>
            </h1>
            <div className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3", paddingBottom: 5 }}>
              {count} · {t.verifiedNote}
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
              <HotelCard key={h.slug} hotel={h} lang={lang} />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 20px",
              background: "#FFFFFF",
              border: "1px solid #EBEBF2",
              borderRadius: 16,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#B9B5AC" }} />
            <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.02em", color: "#8B8FA3" }}>
              {NO_CHARGER.name}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontWeight: 600, fontSize: 12, color: "#8B8FA3" }}>{t.noCharger}</span>
            <span className="tnum" style={{ fontWeight: 600, fontSize: 14, color: "#8B8FA3" }}>
              {NO_CHARGER.price}
            </span>
          </div>
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
              background: "#EDF1EE",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(#E2E8E4 1px,transparent 1px),linear-gradient(90deg,#E2E8E4 1px,transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 26,
                top: 22,
                fontWeight: 600,
                fontSize: 12.5,
                letterSpacing: "0.03em",
                color: "#66716D",
              }}
            >
              {t.mapTitle}
            </div>

            {list.map((h) => (
              <div
                key={h.slug}
                style={{
                  position: "absolute",
                  transform: "translate(-50%,-100%)",
                  left: h.mx,
                  top: h.my,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  className="tnum"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "#FFFFFF",
                    border: "1px solid #DCD9D1",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    fontWeight: 600,
                    fontSize: 12.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.price} <span style={{ color: GREEN }}>{h.kw}</span>
                </div>
                <span
                  style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN, border: "2px solid #FFFFFF" }}
                />
              </div>
            ))}

            <div
              style={{
                position: "absolute",
                left: 26,
                bottom: 26,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "#FFFFFF",
                border: "1px solid #DEDEEA",
                borderRadius: 999,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 12, color: INK }}>{t.showChargers}</span>
              <span
                onClick={() => setChargersOn((c) => !c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: 40,
                  height: 22,
                  borderRadius: 999,
                  background: chargersOn ? GREEN : "#DCD9D1",
                  padding: 2,
                  cursor: "pointer",
                  justifyContent: chargersOn ? "flex-end" : "flex-start",
                }}
              >
                <span style={{ display: "block", width: 18, height: 18, borderRadius: "50%", background: "#FFFFFF" }} />
              </span>
            </div>

            {chargersOn && (
              <div
                className="tnum"
                style={{
                  position: "absolute",
                  right: 26,
                  bottom: 26,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "14px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #DEDEEA",
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 12.5,
                  color: "#8B8FA3",
                }}
              >
                <span style={{ color: INK }}>{t.publicChargers}</span>
                <span>· 34 en 22 kW</span>
                <span>· 11 en DC 50+</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
