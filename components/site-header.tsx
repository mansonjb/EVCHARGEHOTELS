"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME, type Lang } from "@/lib/i18n";
import { cities } from "@/lib/data";

const INK = "#141B34";
const LO = "#8B8FA3";

function navStyle(active: boolean): React.CSSProperties {
  return {
    border: 0,
    background: active ? "#F3F3F8" : "transparent",
    color: active ? INK : LO,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 13.5,
    cursor: "pointer",
    fontWeight: active ? 700 : 500,
    textDecoration: "none",
    display: "inline-block",
  };
}

function langStyle(active: boolean): React.CSSProperties {
  return {
    border: 0,
    background: active ? INK : "transparent",
    color: active ? "#FFFFFF" : LO,
    padding: "8px 12px",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.02em",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  };
}

export function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const nav = HOME[lang].nav;
  const firstCity = cities[0]?.slug ?? "";
  const rest = pathname.replace(/^\/(fr|en)/, "") || "";

  const segs = pathname.split("/").filter(Boolean);
  const isHome = segs.length === 1;
  const isList = segs.length === 2 && segs[1] !== "methode";
  const isHotel = segs.length === 3;
  const isMethod = segs[1] === "methode";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 18,
        height: 66,
        padding: "0 26px",
        background: "#FFFFFF",
        borderBottom: "1px solid #EBEBF2",
      }}
    >
      <Link href={`/${lang}`} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <span
          style={{
            display: "block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "3px solid #141B34",
            background: "#E4FB4F",
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.02em", color: INK }}>
          PLUGSTAYS
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      <nav style={{ display: "flex", gap: 6 }}>
        <Link href={`/${lang}`} style={navStyle(isHome)}>
          {nav.home}
        </Link>
        <Link href={`/${lang}/${firstCity}`} style={navStyle(isList || isHotel)}>
          {nav.list}
        </Link>
        <Link href={`/${lang}/france`} style={navStyle(segs[1] === "france")}>
          France
        </Link>
        <Link href={`/${lang}/route/paris-bordeaux`} style={navStyle(segs[1] === "route")}>
          {lang === "fr" ? "Route" : "Route"}
        </Link>
        <Link href={`/${lang}/methode`} style={navStyle(isMethod)}>
          {lang === "fr" ? "Méthode" : "Method"}
        </Link>
      </nav>

      <div style={{ width: 1, height: 22, background: "#EBEBF2" }} />

      <div style={{ display: "flex", border: "1px solid #DEDEEA", borderRadius: 999, overflow: "hidden" }}>
        <Link href={`/fr${rest}`} style={langStyle(lang === "fr")}>
          FR
        </Link>
        <Link href={`/en${rest}`} style={langStyle(lang === "en")}>
          EN
        </Link>
      </div>

      <button
        aria-label="Menu"
        style={{
          border: "1px solid #DEDEEA",
          background: "#FFFFFF",
          width: 38,
          height: 38,
          borderRadius: "50%",
          cursor: "pointer",
          color: LO,
          fontSize: 15,
        }}
      >
        ☰
      </button>
    </div>
  );
}
