import Image from "next/image";
import Link from "next/link";
import type { Hotel } from "@/lib/data";
import { proofFor, sealFor } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

export function HotelCard({ hotel: h, lang }: { hotel: Hotel; lang: Lang }) {
  const seal = sealFor(h, lang);
  const known = seal.tone === "known";

  return (
    <Link
      href={`/${lang}/${h.citySlug}/${h.slug}`}
      className="ps-card"
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
        {h.image && (
          <Image
            src={h.image}
            alt={h.name}
            fill
            sizes="(max-width: 1100px) 100vw, 380px"
            style={{ objectFit: "cover" }}
          />
        )}
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
            color: known ? "#3FD9B0" : "#F5C25B",
          }}
        >
          {seal.text}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 14px",
          background: known ? "#F1F9F5" : "#FDF6E7",
          borderBottom: "1px solid #EBEBF2",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: known ? "#0E9E7E" : "#D89B1C",
            flex: "0 0 7px",
          }}
        />
        <span className="tnum" style={{ fontWeight: 600, fontSize: 12, color: known ? "#0A5C4D" : "#8A6414" }}>
          {proofFor(h, lang)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.12, letterSpacing: "-0.025em", textWrap: "pretty" }}>
          {h.name}
        </div>
        <div style={{ fontSize: 13.5, color: "#8B8FA3" }}>{h.city}</div>
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
          <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
            {h.stars ? "★".repeat(Math.round(h.stars)) : ""}
          </span>
          <span style={{ flex: 1 }} />
          {h.rating != null && (
            <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#0E7C68" }}>
              {String(h.rating).replace(".", ",")}
            </span>
          )}
          {h.price != null && (
            <span className="tnum" style={{ fontWeight: 600, fontSize: 15 }}>
              {h.price} €
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
