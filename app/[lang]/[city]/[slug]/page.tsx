import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NightMaths } from "@/components/night-maths";
import { ConnectorIcon } from "@/components/connector-icon";
import { cityBySlug, hotelBySlug, hotelCityName, hotels, overnight } from "@/lib/data";
import { LANGS, STR, alternatesFor, type Lang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    hotels.map((h) => ({ lang, city: h.citySlug, slug: h.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; city: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, city, slug } = await params;
  const h = hotelBySlug(city, slug);
  if (!h) return {};
  const kw = h.charging.onSite?.kwLabel;
  return {
    title: `${h.name}${kw ? `, ${kw}` : ""} · ${hotelCityName(h, lang as Lang)}`,
    description: h.copy.envie[lang as Lang],
    alternates: alternatesFor(lang as Lang, `/${h.citySlug}/${h.slug}`),
  };
}

const cell: React.CSSProperties = {
  background: "#FFFFFF",
  padding: "18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 7,
};
const cellLabel: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: "0.04em",
  color: "#8B8FA3",
};
const cellSub: React.CSSProperties = { fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" };

export default async function HotelPage({
  params,
}: {
  params: Promise<{ lang: string; city: string; slug: string }>;
}) {
  const { lang: rawLang, city, slug } = await params;
  const lang = rawLang as Lang;
  const h = hotelBySlug(city, slug);
  if (!h) notFound();
  const c = cityBySlug(city);
  const t = STR[lang];
  const on = h.charging.onSite;
  const known = Boolean(on);
  const night = overnight(on?.kw ?? null);

  const feeLabel = on?.fee === "free"
    ? lang === "fr" ? "gratuite" : "free"
    : on?.fee === "paid"
      ? lang === "fr" ? "payante" : "paid"
      : lang === "fr" ? "tarif non renseigné" : "price not stated";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: h.name,
    address: { "@type": "PostalAddress", addressLocality: h.city, addressCountry: h.country },
    geo: { "@type": "GeoCoordinates", latitude: h.lat, longitude: h.lng },
    ...(h.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: h.rating, bestRating: 10 } } : {}),
    ...(h.stars ? { starRating: { "@type": "Rating", ratingValue: h.stars } } : {}),
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Electric vehicle charging station",
        value: h.charging.declaredOnBooking || Boolean(on),
      },
      ...(on?.kw
        ? [{ "@type": "LocationFeatureSpecification", name: `Charging power ${on.kwLabel}`, value: true }]
        : []),
    ],
    image: h.images.slice(0, 3),
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 26px 90px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
          <Link href={`/${lang}/${h.citySlug}`} style={{ color: "#0E7C68" }}>
            {hotelCityName(h, lang)}
          </Link>{" "}
          · {lang === "en" ? h.countryEn : h.country}
        </div>

        <div className="ps-gallery" style={{ display: "flex", gap: 10, height: 400 }}>
          <div
            className="photo-slot"
            style={{ position: "relative", flex: 2, borderRadius: 16, overflow: "hidden", border: "1px solid #EBEBF2" }}
          >
            {h.image && (
              <Image src={h.image} alt={h.name} fill sizes="(max-width: 1100px) 100vw, 700px" style={{ objectFit: "cover" }} priority />
            )}
            <div
              className="tnum"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(20,27,52,0.88)",
                backdropFilter: "blur(4px)",
                fontWeight: 600,
                fontSize: 12.5,
                color: known ? "#3FD9B0" : "#F5C25B",
              }}
            >
              {known
                ? `${on!.kwLabel ?? "?"} · ${on!.socketLabels[0] ?? "Type 2"} · ${on!.distance} m`
                : lang === "fr"
                  ? "recharge déclarée · puissance inconnue"
                  : "charging declared · power unknown"}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="photo-slot"
                style={{ position: "relative", flex: 1, borderRadius: 16, border: "1px solid #EBEBF2", overflow: "hidden" }}
              >
                {h.images[i] && (
                  <Image src={h.images[i]} alt="" fill sizes="360px" style={{ objectFit: "cover" }} />
                )}
                {i === 2 && h.images.length > 3 && (
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 12,
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: "#FFFFFF",
                      border: "1px solid #DEDEEA",
                      fontWeight: 600,
                      fontSize: 12.5,
                    }}
                  >
                    + {h.images.length - 3} photos
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ps-hotel-body" style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 48, paddingTop: 34 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 48, lineHeight: 1.02, letterSpacing: "-0.04em" }}>
              {h.name}
            </h1>
            <div className="tnum" style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>
              {h.stars ? <span>{"★".repeat(Math.round(h.stars))}</span> : null}
              {h.rating != null && <span style={{ color: "#0E7C68" }}>{String(h.rating).replace(".", ",")}/10</span>}
              <span>·</span>
              <span>{h.address || hotelCityName(h, lang)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#3A4160", maxWidth: "58ch", textWrap: "pretty" }}>
              {h.copy.envie[lang]}
            </p>
          </div>

          {/* Bloc de preuve, uniquement des faits sourcés */}
          <div style={{ border: "1px solid #C9E7DC", background: "#F1F9F5", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid #DCEDE5", flexWrap: "wrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: known ? "#0E9E7E" : "#D89B1C" }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: "#0A5C4D", letterSpacing: "0.04em" }}>
                {lang === "fr" ? "CE QUE DISENT LES SOURCES" : "WHAT THE SOURCES SAY"}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontWeight: 600, fontSize: 12.5, color: "#4F776A" }}>
                {h.charging.declaredOnBooking ? (lang === "fr" ? "déclaré Booking" : "declared on Booking") : ""}
                {h.charging.declaredOnBooking && on ? " + " : ""}
                {on ? "OpenStreetMap" : ""}
              </span>
            </div>

            <div className="ps-proof" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#DCEDE5" }}>
              <div style={cell}>
                <span style={cellLabel}>{t.lPower}</span>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 21 }}>
                  {on?.kwLabel ?? (lang === "fr" ? "non publiée" : "not stated")}
                </span>
                <span style={cellSub}>
                  {on?.dc
                    ? lang === "fr" ? "courant continu" : "direct current"
                    : on
                      ? lang === "fr" ? "courant alternatif" : "alternating current"
                      : lang === "fr" ? "à confirmer auprès de l'hôtel" : "to confirm with the hotel"}
                </span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lConn}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {on?.socketLabels.length ? <ConnectorIcon conn={on.socketLabels[0]} /> : null}
                  <span style={{ fontWeight: 600, fontSize: on?.socketLabels.length ? 18 : 15 }}>
                    {on?.socketLabels.join(", ") ?? (lang === "fr" ? "non publié" : "not stated")}
                  </span>
                </div>
                <span style={cellSub}>
                  {on?.amperage || on?.voltage
                    ? [on?.amperage ? `${on.amperage} A` : null, on?.voltage ? `${on.voltage} V` : null]
                        .filter(Boolean)
                        .join(" · ")
                    : lang === "fr" ? "ampérage non renseigné" : "amperage not stated"}
                </span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lPoints}</span>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 21 }}>
                  {on?.points ?? (lang === "fr" ? "?" : "?")}
                </span>
                <span style={cellSub}>
                  {on
                    ? lang === "fr"
                      ? `borne à ${on.distance} m de l'entrée`
                      : `charger ${on.distance} m from the door`
                    : lang === "fr" ? "nombre non publié" : "count not published"}
                </span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lAccess}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 17 }}>
                  <span style={{ width: 8, height: 8, background: on?.open247 ? "#0E9E7E" : "#D89B1C", display: "inline-block" }} />
                  {on?.open247 ? "24/7" : lang === "fr" ? "horaires à vérifier" : "hours to check"}
                </span>
                <span style={cellSub}>
                  {on ? `${feeLabel}${on.operator ? ` · ${on.operator}` : ""}` : lang === "fr" ? "non renseigné" : "not stated"}
                </span>
              </div>
            </div>

            {night && <NightMaths night={night} lang={lang} kwLabel={on?.kwLabel ?? ""} />}
          </div>

          {/* Bornes publiques autour */}
          {h.charging.nearby.count > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
                {lang === "fr"
                  ? `${h.charging.nearby.count} bornes publiques à moins de ${h.charging.nearby.within} m`
                  : `${h.charging.nearby.count} public chargers within ${h.charging.nearby.within} m`}
              </h2>
              <div style={{ border: "1px solid #EBEBF2", borderRadius: 16, overflow: "hidden" }}>
                {h.charging.nearby.list.map((n, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 18px",
                      borderBottom: i < h.charging.nearby.list.length - 1 ? "1px solid #F3F3F8" : undefined,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 0 }}>
                      {n.name || (lang === "fr" ? "Borne publique" : "Public charger")}
                    </span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#0E7C68", minWidth: 70, textAlign: "right" }}>
                      {n.kwLabel ?? "—"}
                    </span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3", minWidth: 90, textAlign: "right" }}>
                      {n.sockets.join(", ") || "—"}
                    </span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3", minWidth: 60, textAlign: "right" }}>
                      {n.distance} m
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#8B8FA3" }}>
                {lang === "fr"
                  ? "Données de bornes © contributeurs OpenStreetMap (ODbL)."
                  : "Charger data © OpenStreetMap contributors (ODbL)."}
              </p>
            </div>
          )}

          {/* Équipements */}
          {h.facilities.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid #EBEBF2", paddingTop: 30 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
                {lang === "fr" ? "L'hôtel" : "The hotel"}
              </h2>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "#3A4160", maxWidth: "70ch" }}>
                {h.copy.charge[lang]}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {h.facilities.slice(0, 18).map((f) => (
                  <span
                    key={f}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid #EBEBF2",
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: "#3A4160",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Réservation */}
        <div>
          <div
            style={{
              position: "sticky",
              top: 90,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              border: "1px solid #DEDEEA",
              borderRadius: 18,
              background: "#FFFFFF",
              padding: 22,
            }}
          >
            {h.price != null && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 27 }}>
                  {h.price} €
                </span>
                <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
                  {lang === "fr" ? "la nuit, relevé en septembre" : "per night, sampled in September"}
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#EBEBF2", border: "1px solid #EBEBF2", borderRadius: 12, overflow: "hidden" }}>
              <div className="tnum" style={{ background: "#FFFFFF", padding: "11px 13px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12 }}>
                <span style={{ color: "#8B8FA3" }}>{t.lPower}</span>
                <span>{on?.kwLabel ?? "—"}</span>
              </div>
              <div className="tnum" style={{ background: "#FFFFFF", padding: "11px 13px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12 }}>
                <span style={{ color: "#8B8FA3" }}>{t.lConn}</span>
                <span>{on?.socketLabels[0] ?? "—"}</span>
              </div>
              <div className="tnum" style={{ background: "#F1F9F5", padding: "11px 13px", display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12, color: "#0A5C4D" }}>
                <span>{lang === "fr" ? "nuit de 13 h" : "13 h night"}</span>
                <span>{night ? `≈ ${night.km} km` : "—"}</span>
              </div>
            </div>

            <a
              href={h.bookingUrl}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="ps-dark-btn"
              style={{
                border: 0,
                background: "#141B34",
                color: "#FFFFFF",
                padding: 15,
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {t.book}
            </a>

            <div style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3", lineHeight: 1.5, borderTop: "1px solid #EBEBF2", paddingTop: 13 }}>
              {lang === "fr"
                ? "Lien partenaire vers Booking. Confirmez la borne avec l'hôtel avant de compter dessus."
                : "Partner link to Booking. Confirm the charger with the hotel before relying on it."}
            </div>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 40, fontSize: 12.5, color: "#8B8FA3", borderTop: "1px solid #EBEBF2", paddingTop: 16 }}>
        {lang === "fr"
          ? `Équipements et prix : Booking, relevé ${new Date(c?.scrapedAt ?? Date.now()).toLocaleDateString("fr-FR")}. Caractéristiques de borne : OpenStreetMap. Nous ne visitons pas les hôtels.`
          : `Facilities and prices: Booking, sampled ${new Date(c?.scrapedAt ?? Date.now()).toLocaleDateString("en-GB")}. Charger specifications: OpenStreetMap. We do not visit the hotels.`}
      </p>
    </div>
  );
}
