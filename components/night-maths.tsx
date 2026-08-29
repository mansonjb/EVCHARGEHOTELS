"use client";

import { useState } from "react";
import type { Hotel } from "@/data/hotels";
import { STR, type Lang } from "@/lib/i18n";

/** Le calcul de nuit, replié par défaut : il confirme, il ne déclenche pas. */
export function NightMaths({ hotel, lang }: { hotel: Hotel; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = STR[lang];

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
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#0E9E7E" }}>{open ? "−" : "+"}</span>
        <span className="tnum" style={{ fontWeight: 600, fontSize: 13 }}>
          {hotel.nightTitle[lang]}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>{t.nightHint}</span>
      </div>

      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "4px 20px 22px",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              position: "relative",
              height: 12,
              border: "1px solid #DCD9D1",
              borderRadius: 999,
              background: "#F4F2EC",
              overflow: "hidden",
            }}
          >
            <div
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${hotel.socStart}%`, background: "#D5D2CA" }}
            />
            <div
              style={{
                position: "absolute",
                left: `${hotel.socStart}%`,
                top: 0,
                bottom: 0,
                right: 0,
                background: hotel.warn ? "#D89B1C" : "#0E9E7E",
              }}
            />
          </div>
          <div
            className="tnum"
            style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}
          >
            <span>{hotel.socTimes.from}</span>
            <span>{hotel.socTimes.to}</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#8B8FA3", maxWidth: "62ch", textWrap: "pretty" }}>
            {hotel.night[lang]}
          </div>
        </div>
      )}
    </>
  );
}
