import Link from "next/link";
import type { Hotel } from "@/data/hotels";
import type { Lang } from "@/lib/i18n";

export function proofLine(h: Hotel, lang: Lang) {
  if (h.warn) {
    return lang === "fr"
      ? `${h.points} bornes déclarées · à reconfirmer`
      : `${h.points} points declared · to reconfirm`;
  }
  if (lang === "fr") {
    return `${h.points} ${h.points > 1 ? "bornes vérifiées" : "borne vérifiée"} · ${h.nearby} à proximité${
      h.guar ? " · place garantie" : ""
    }`;
  }
  return `${h.points} ${h.points > 1 ? "verified chargers" : "verified charger"} · ${h.nearby} nearby${
    h.guar ? " · guaranteed bay" : ""
  }`;
}

export function sealText(h: Hotel) {
  return h.warn ? `${h.kw} · ${h.conn} · ! ${h.ver}` : `${h.kw} · ${h.conn} · ${h.ver}`;
}

export function HotelCard({ hotel: h, lang }: { hotel: Hotel; lang: Lang }) {
  return (
    <Link
      href={`/${lang}/bordeaux/${h.slug}`}
      className="group"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        border: "1px solid #EBEBF2",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="photo-slot" style={{ position: "relative", aspectRatio: "4 / 3" }}>
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            fontWeight: 600,
            fontSize: 12,
            color: "#6B6862",
          }}
        >
          photo · {h.photo[lang]}
        </div>
        <div
          className="tnum"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(20,27,52,0.88)",
            backdropFilter: "blur(4px)",
            fontWeight: 600,
            fontSize: 12.5,
            color: h.warn ? "#F5C25B" : "#3FD9B0",
          }}
        >
          {sealText(h)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 14px",
          background: h.warn ? "#FDF6E7" : "#F1F9F5",
          borderBottom: "1px solid #EBEBF2",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: h.warn ? "#D89B1C" : "#0E9E7E",
            flex: "0 0 7px",
          }}
        />
        <span
          className="tnum"
          style={{ fontWeight: 600, fontSize: 12, color: h.warn ? "#8A6414" : "#0A5C4D" }}
        >
          {proofLine(h, lang)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px 18px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 23,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            textWrap: "pretty",
          }}
        >
          {h.name}
        </div>
        <div style={{ fontSize: 13.5, color: "#8B8FA3" }}>
          {h.area}, {h.city}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            paddingTop: 4,
            borderTop: "1px solid #F1EFE9",
            marginTop: 4,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>{h.stars}</span>
          <span style={{ flex: 1 }} />
          <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#0E7C68" }}>
            {h.score}
          </span>
          <span className="tnum" style={{ fontWeight: 600, fontSize: 15 }}>
            {h.price}
          </span>
        </div>
      </div>
    </Link>
  );
}
