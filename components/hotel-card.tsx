import Image from "next/image";
import Link from "next/link";
import type { Hotel } from "@/lib/data";
import { hotelCityName, proofFor, sealFor } from "@/lib/data";
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
            color: seal.tone === "known" ? "#3FD9B0" : seal.tone === "declared" ? "#F5C25B" : "#C3C8DC",
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
          background: seal.tone === "known" ? "#F1F9F5" : seal.tone === "declared" ? "#FDF6E7" : "#F3F3F8",
          borderBottom: "1px solid #EBEBF2",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: seal.tone === "known" ? "#0E9E7E" : seal.tone === "declared" ? "#D89B1C" : "#8B8FA3",
            flex: "0 0 7px",
          }}
        />
        <span className="tnum" style={{ fontWeight: 600, fontSize: 12, color: seal.tone === "known" ? "#0A5C4D" : seal.tone === "declared" ? "#8A6414" : "#3A4160" }}>
          {proofFor(h, lang)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.12, letterSpacing: "-0.025em", textWrap: "pretty" }}>
          {h.name}
        </div>
        <div style={{ fontSize: 13.5, color: "#8B8FA3" }}>{hotelCityName(h, lang)}</div>
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
