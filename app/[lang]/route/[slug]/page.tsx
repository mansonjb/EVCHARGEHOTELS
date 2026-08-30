import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HotelCard } from "@/components/hotel-card";
import { cities, cityName, hotelsInCity, rankHotels } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";

const ROUTES = [
  {
    slug: "amsterdam-bordeaux",
    from: "Amsterdam",
    to: "Bordeaux",
    assumedRangeKm: 320,
  },
];

export function generateStaticParams() {
  return LANGS.flatMap((lang) => ROUTES.map((r) => ({ lang, slug: r.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = ROUTES.find((x) => x.slug === slug);
  if (!r) return {};
  return {
    title:
      lang === "fr"
        ? `${r.from} vers ${r.to} en électrique, où s'arrêter dormir`
        : `${r.from} to ${r.to} by EV, where to stop for the night`,
    description:
      lang === "fr"
        ? "Les étapes du corridor, la distance entre chacune, et les hôtels dont la borne est réellement cartographiée."
        : "The stops along the corridor, the distance between each, and the hotels whose charger is actually mapped.",
  };
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang = rawLang as Lang;
  const r = ROUTES.find((x) => x.slug === slug);
  if (!r) notFound();
  const fr = lang === "fr";

  // Du plus loin de l'arrivée au plus proche.
  const stops = [...cities].sort((a, b) => b.corridorKm - a.corridorKm);
  const total = stops[0]?.corridorKm ?? 0;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 26px 90px" }}>
      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 48, lineHeight: 1.02, letterSpacing: "-0.04em", maxWidth: "18ch" }}>
        {fr ? `${r.from} vers ${r.to}` : `${r.from} to ${r.to}`}{" "}
        <span className="hand" style={{ fontSize: "1.1em" }}>
          {fr ? "en électrique" : "by EV"}
        </span>
      </h1>

      <div
        className="ps-grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 1,
          background: "#EBEBF2",
          border: "1px solid #EBEBF2",
          borderRadius: 22,
          overflow: "hidden",
          marginTop: 26,
        }}
      >
        {[
          { l: fr ? "Distance" : "Distance", v: `${total} km` },
          { l: fr ? "Étapes ouvertes" : "Stops open", v: String(stops.length) },
          { l: fr ? "Autonomie retenue" : "Assumed range", v: `${r.assumedRangeKm} km` },
          {
            l: fr ? "Bornes analysées" : "Chargers analysed",
            v: String(stops.reduce((n, c) => n + c.chargersInCity, 0)),
          },
        ].map((s) => (
          <div key={s.l} style={{ background: "#FFFFFF", padding: "18px 22px" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8B8FA3" }}>{s.l}</p>
            <p className="tnum" style={{ margin: "6px 0 0", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em" }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <p style={{ maxWidth: "70ch", fontSize: 17, lineHeight: 1.6, color: "#3A4160", marginTop: 26 }}>
        {fr
          ? "Les distances sont mesurées d'étape à étape. Ce qui change tout sur ce trajet n'est pas la vitesse de charge, c'est l'endroit où la voiture passe la nuit : treize heures branché à 11 kW valent une batterie pleine, sans un seul arrêt en journée."
          : "Distances are measured stop to stop. What decides this trip is not charging speed but where the car spends the night: thirteen hours plugged in at 11 kW is a full battery, with no daytime stop at all."}
      </p>

      <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: 54 }}>
        {stops.map((c, i) => {
          const prev = stops[i - 1];
          const leg = prev ? prev.corridorKm - c.corridorKm : null;
          const picks = rankHotels(hotelsInCity(c.slug)).slice(0, 3);

          return (
            <section key={c.slug} style={{ position: "relative", paddingLeft: 34 }}>
              <div style={{ position: "absolute", left: 7, top: 10, bottom: -54, width: 1, background: "#EBEBF2" }} />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 6,
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  border: "3px solid #0E9E7E",
                  background: "#FFFFFF",
                }}
              />

              <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-0.035em" }}>
                  <Link href={`/${lang}/${c.slug}`} style={{ color: "#141B34" }}>
                    {cityName(c, lang)}
                  </Link>
                </h2>
                {leg != null && (
                  <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#0E7C68" }}>
                    + {leg} km
                  </span>
                )}
                <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>
                  {c.hotelCount} {fr ? "hôtels" : "hotels"} · {c.onSiteCount}{" "}
                  {fr ? "avec borne cartographiée" : "with a mapped charger"} · {c.chargersInCity}{" "}
                  {fr ? "bornes en ville" : "chargers in town"}
                </span>
              </div>

              {leg != null && leg > r.assumedRangeKm && (
                <p
                  style={{
                    margin: "12px 0 0",
                    padding: "10px 14px",
                    background: "#FDF6E7",
                    border: "1px solid #F5C25B",
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#8A6414",
                    display: "inline-block",
                  }}
                >
                  {fr
                    ? `Étape plus longue que l'autonomie retenue : une recharge rapide en route reste nécessaire, l'hôtel ne la remplace pas.`
                    : `This leg is longer than the assumed range: a fast charge en route is still needed, the hotel does not replace it.`}
                </p>
              )}

              <div className="ps-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18, marginTop: 20 }}>
                {picks.map((h) => (
                  <HotelCard key={h.slug} hotel={h} lang={lang} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
