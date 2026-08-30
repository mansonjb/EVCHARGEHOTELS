"use client";

import { useRouter } from "next/navigation";
import { cities, cityName } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

/** Choix de la ville, partout où le site affichait « Bordeaux » en dur. */
export function CityPicker({
  lang,
  current,
  size = "md",
}: {
  lang: Lang;
  current?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const height = size === "sm" ? 36 : 44;

  return (
    <select
      value={current ?? ""}
      onChange={(e) => {
        if (e.target.value) router.push(`/${lang}/${e.target.value}`);
      }}
      aria-label={lang === "fr" ? "Choisir une ville" : "Choose a city"}
      style={{
        height,
        border: "1px solid #DEDEEA",
        borderRadius: 999,
        background: "#FFFFFF",
        padding: size === "sm" ? "0 34px 0 14px" : "0 38px 0 18px",
        fontWeight: 700,
        fontSize: size === "sm" ? 13.5 : 15,
        color: "#141B34",
        cursor: "pointer",
        appearance: "none",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%238B8FA3' stroke-width='1.6' stroke-linecap='round'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: `right ${size === "sm" ? 12 : 15}px center`,
      }}
    >
      {!current && (
        <option value="">{lang === "fr" ? "Choisir une ville" : "Choose a city"}</option>
      )}
      {cities.map((c) => (
        <option key={c.slug} value={c.slug}>
          {cityName(c, lang)}
        </option>
      ))}
    </select>
  );
}
