import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListView } from "@/components/list-view";
import { cities, cityBySlug, cityName, hotelsInCity, rankHotels } from "@/lib/data";
import { LANGS, STR, alternatesFor, type Lang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => cities.map((c) => ({ lang, city: c.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; city: string }>;
}): Promise<Metadata> {
  const { lang, city } = await params;
  const c = cityBySlug(city);
  if (!c) return {};
  const t = STR[lang as Lang];
  const cn = cityName(c, lang as Lang);
  return {
    title: `${t.listH1} ${t.listH1b} · ${cn}`,
    description:
      lang === "fr"
        ? `${c.hotelCount} hôtels de ${cn} avec recharge : puissance, connecteur, nombre de points, bornes publiques autour. Données Booking et OpenStreetMap, datées.`
        : `${c.hotelCount} hotels in ${cn} with charging: power, connector, number of points, public chargers nearby. Booking and OpenStreetMap data, dated.`,
    alternates: alternatesFor(lang as Lang, `/${c.slug}`),
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ lang: string; city: string }>;
}) {
  const { lang: rawLang, city } = await params;
  const lang = rawLang as Lang;
  const c = cityBySlug(city);
  if (!c) notFound();
  const list = rankHotels(hotelsInCity(c.slug));
  const cn = cityName(c, lang);

  const others = cities.filter((x) => x.slug !== c.slug);
  const fr = lang === "fr";
  const best = list.find((h) => h.charging.onSite?.kw);
  const free = list.filter((h) => h.charging.onSite?.fee === "free").length;
  const open247 = list.filter((h) => h.charging.onSite?.open247).length;

  const faq = fr
    ? [
        {
          q: `Combien d'hôtels de ${cn} ont une borne de recharge ?`,
          a: `${c.hotelCount} établissements de notre sélection en annoncent une : ${c.declaredCount} l'ont déclarée sur Booking, et ${c.onSiteCount} ont une borne cartographiée sur OpenStreetMap à moins de 120 m de l'entrée. Le reste de la ville compte ${c.chargersInCity} bornes publiques, dont ${c.chargersDc} en courant continu.`,
        },
        {
          q: `Quelle est la borne d'hôtel la plus puissante à ${cn} ?`,
          a: best
            ? `${best.name}, avec ${best.charging.onSite?.kwLabel} en ${best.charging.onSite?.socketLabels.join(" et ") || "Type 2"}. Sur une nuit de treize heures, cette puissance suffit largement à remplir une batterie de 77 kWh.`
            : `Aucune borne d'hôtel de la ville n'a de puissance publiée pour l'instant. Les fiches indiquent « non publiée » plutôt qu'une estimation.`,
        },
        {
          q: `La recharge est-elle gratuite à ${cn} ?`,
          a: `${free > 0 ? `${free} hôtel${free > 1 ? "s" : ""} de la sélection a${free > 1 ? "" : ""} une borne annoncée gratuite dans OpenStreetMap` : "Aucune borne de la sélection n'est annoncée gratuite"}. Pour les autres, le tarif dépend de l'opérateur et n'est pas toujours publié : la fiche laisse le champ vide plutôt que de deviner.`,
        },
        {
          q: `Peut-on brancher à toute heure ?`,
          a: `${open247} borne${open247 > 1 ? "s" : ""} de la sélection ${open247 > 1 ? "sont annoncées" : "est annoncée"} accessible${open247 > 1 ? "s" : ""} 24h/24 dans OpenStreetMap. Ailleurs, l'accès peut dépendre des horaires de la réception ou d'un portail fermé la nuit : c'est la question à poser en réservant.`,
        },
      ]
    : [
        {
          q: `How many hotels in ${cn} have a charger?`,
          a: `${c.hotelCount} properties in our selection state one: ${c.declaredCount} declared it on Booking, and ${c.onSiteCount} have a charger mapped on OpenStreetMap within 120 m of the door. The rest of the city counts ${c.chargersInCity} public chargers, ${c.chargersDc} of them DC.`,
        },
        {
          q: `What is the most powerful hotel charger in ${cn}?`,
          a: best
            ? `${best.name}, with ${best.charging.onSite?.kwLabel} on ${best.charging.onSite?.socketLabels.join(" and ") || "Type 2"}. Over a thirteen-hour night that is more than enough to fill a 77 kWh battery.`
            : `No hotel charger in town has a published power rating yet. Pages say "not stated" rather than estimating.`,
        },
        {
          q: `Is charging free in ${cn}?`,
          a: `${free > 0 ? `${free} hotel${free > 1 ? "s" : ""} in the selection has a charger listed as free on OpenStreetMap` : "No charger in the selection is listed as free"}. For the others, pricing depends on the operator and is not always published: the page leaves the field empty rather than guessing.`,
        },
        {
          q: `Can you plug in at any hour?`,
          a: `${open247} charger${open247 > 1 ? "s" : ""} in the selection ${open247 > 1 ? "are" : "is"} listed as 24/7 on OpenStreetMap. Elsewhere access may depend on reception hours or a gate closed at night: that is the question to ask when booking.`,
        },
      ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: list.slice(0, 20).map((h, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: h.name,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://plugstays.com"}/${lang}/${h.citySlug}/${h.slug}`,
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ListView city={c} hotels={list} lang={lang} />

      {c.irveHotels > 0 && (
        <div style={{ borderTop: "1px solid #EBEBF2", background: "#F1F9F5" }}>
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "22px 26px",
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            <span className="tnum" style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: "#0A5C4D" }}>
              {c.irveHotels}
            </span>
            <span style={{ fontSize: 15, lineHeight: 1.55, color: "#0A5C4D", maxWidth: "70ch" }}>
              {fr
                ? `hôtels équipés recensés dans ce rayon par la base nationale IRVE. Nous en publions ${list.length} avec une fiche complète ; les autres figurent sur la carte nationale.`
                : `equipped hotels recorded within this radius by the national IRVE database. We publish ${list.length} with a full page here; the others appear on the national map.`}
            </span>
            <span style={{ flex: 1 }} />
            <Link
              href={`/${lang}/france`}
              className="tnum"
              style={{ fontWeight: 700, fontSize: 13, color: "#0E7C68", whiteSpace: "nowrap" }}
            >
              {fr ? "Voir la carte de France" : "See the France map"}
            </Link>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #EBEBF2", background: "#FFFFFF" }}>
        <div
          className="ps-faq"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "52px 26px",
            display: "grid",
            gridTemplateColumns: "0.55fr 1.45fr",
            gap: 44,
            alignItems: "start",
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-0.035em" }}>
            {fr ? `Recharger à ${cn}` : `Charging in ${cn}`}
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {faq.map((f) => (
              <div
                key={f.q}
                className="ps-faq-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.4fr",
                  gap: 28,
                  padding: "20px 0",
                  borderTop: "1px solid #EBEBF2",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textWrap: "pretty" }}>
                  {f.q}
                </span>
                <span style={{ fontSize: 15.5, lineHeight: 1.58, color: "#3A4160", textWrap: "pretty" }}>{f.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #EBEBF2", background: "#F3F3F8" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 26px 56px", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
            {lang === "fr" ? "Les autres étapes du corridor" : "Other stops on the corridor"}
          </h2>
          <div
            className="ps-grid-4"
            style={{
              display: "grid",
              // Quinze villes ne tiennent pas sur une ligne : la grille
              // s'adapte au lieu de pousser la page en largeur.
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 12,
            }}
          >
            {others.slice(0, 8).map((o) => (
              <Link
                key={o.slug}
                href={`/${lang}/${o.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: 18,
                  background: "#FFFFFF",
                  border: "1px solid #EBEBF2",
                  borderRadius: 16,
                  textDecoration: "none",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 17, color: "#141B34" }}>{cityName(o, lang)}</span>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
                  {o.hotelCount} {lang === "fr" ? "hôtels" : "hotels"} · {o.chargersInCity}{" "}
                  {lang === "fr" ? "bornes" : "chargers"}
                </span>
              </Link>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#8B8FA3" }}>
            {lang === "fr"
              ? "Données de bornes © contributeurs OpenStreetMap (ODbL). Équipements et tarifs : Booking."
              : "Charger data © OpenStreetMap contributors (ODbL). Facilities and prices: Booking."}
          </p>
        </div>
      </div>
    </>
  );
}
