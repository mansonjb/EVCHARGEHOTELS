"use client";

import { useState } from "react";
import { STR, type Lang } from "@/lib/i18n";

/** Le calcul de nuit, replié par défaut : il confirme, il ne déclenche pas. */
export function NightMaths({
  night,
  lang,
  kwLabel,
}: {
  night: { km: number; energy: number; hoursToFull: number; hours: number };
  lang: Lang;
  kwLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const t = STR[lang];
  const fillPct = Math.min(100, Math.round((night.hours / Math.max(night.hoursToFull, 0.1)) * 100));

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 20px",
          cursor: "pointer",
          background: "#FFFFFF",
          borderTop: "1px solid #DCEDE5",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#0E9E7E" }}>{open ? "−" : "+"}</span>
        <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>
          {lang === "fr"
            ? `${night.hours} h sur place × ${kwLabel} = environ ${night.km} km récupérés`
            : `${night.hours} h on site × ${kwLabel} = about ${night.km} km recovered`}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>{t.nightHint}</span>
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 20px 22px", background: "#FFFFFF" }}>
          <div style={{ position: "relative", height: 12, border: "1px solid #DCD9D1", borderRadius: 999, background: "#F4F2EC", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${fillPct}%`, background: "#0E9E7E" }} />
          </div>
          <div className="tnum" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
            <span>
              {lang === "fr" ? `≈ ${night.energy} kWh repris` : `≈ ${night.energy} kWh back`}
            </span>
            <span>
              {lang === "fr"
                ? `batterie pleine en ${String(night.hoursToFull).replace(".", ",")} h`
                : `full battery in ${night.hoursToFull} h`}
            </span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#8B8FA3", maxWidth: "62ch", textWrap: "pretty" }}>
            {lang === "fr"
              ? "Calcul indicatif : batterie 77 kWh, consommation 18 kWh/100 km, pertes de charge comprises. Beaucoup de voitures plafonnent à 11 kW en courant alternatif, ce qui limite le résultat quelle que soit la borne."
              : "Indicative figures: 77 kWh battery, 18 kWh/100 km, charging losses included. Many cars cap at 11 kW on AC, which limits the result whatever the charger."}
          </div>
        </div>
      )}
    </>
  );
}
