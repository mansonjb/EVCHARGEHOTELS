import Link from "next/link";
import type { Metadata } from "next";
import { HOME, STR, alternatesFor, type Lang } from "@/lib/i18n";
import { CityPicker } from "@/components/city-picker";
import { FranceMiniMap } from "@/components/france-mini-map";
import { cities, cityName, hotels } from "@/lib/data";
import { nationalHotels } from "@/lib/national";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const h = HOME[lang as Lang];
  return { title: `${h.h1a} ${h.h1b}`, description: h.lede, alternates: alternatesFor(lang as Lang) };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw as Lang;
  const t = STR[lang];
  const home = HOME[lang];
  const totalChargers = cities.reduce((n, c) => n + c.chargersInCity, 0);
  const firstCity = cities[0];
  const num = (n: number) => n.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB");
  const national = nationalHotels.length;
  const nationalFast = nationalHotels.filter((h) => (h.kw ?? 0) >= 50).length;
  const nationalDepts = new Set(nationalHotels.map((h) => h.deptCode).filter(Boolean)).size;
  const mapCities = cities.map((c) => ({
    slug: c.slug,
    name: cityName(c, lang),
    lat: c.lat,
    lng: c.lng,
    hotelCount: c.hotelCount,
  }));

  return (
    <div>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid #EBEBF2", background: "#FFFFFF" }}>
        <div
          className="ps-hero"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "64px 26px 56px",
            display: "grid",
            gridTemplateColumns: "1.35fr 0.65fr",
            gap: 56,
            alignItems: "end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0E9E7E" }} />
              <span style={{ fontWeight: 600, fontSize: 12.5, letterSpacing: "0.04em", color: "#0A5C4D" }}>
                {home.eyebrow}
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 62,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {home.h1a}{" "}
              <span className="hand" style={{ fontWeight: 700, fontSize: "1.1em", letterSpacing: 0 }}>
                {home.h1b}
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: "#3A4160", textWrap: "pretty" }}>
              {home.lede}
            </p>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 52,
                  border: "1px solid #DEDEEA",
                  borderRadius: 999,
                  padding: "0 6px 0 20px",
                }}
              >
                <CityPicker lang={lang} />
                <span style={{ width: 1, height: 22, background: "#EBEBF2", margin: "0 16px" }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "#8B8FA3" }}>
                  {cities.length} {lang === "fr" ? "étapes ouvertes" : "stops open"}
                </span>
                <Link
                  href={`/${lang}/${firstCity.slug}`}
                  className="ps-dark-btn"
                  style={{
                    flex: "0 0 auto",
                    marginLeft: 14,
                    background: "#141B34",
                    color: "#FFFFFF",
                    height: 40,
                    padding: "0 24px",
                    borderRadius: 999,
                    fontSize: 14.5,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  {t.search}
                </Link>
              </div>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>{home.searchNote}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              border: "1px solid #EBEBF2",
              borderRadius: 22,
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {home.stats.map((st) => (
              <div
                key={st.n}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  padding: "18px 22px",
                  borderBottom: "1px solid #F3F3F8",
                }}
              >
                <span
                  className="tnum"
                  style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.03em", minWidth: 96 }}
                >
                  {st.n}
                </span>
                <span style={{ fontSize: 14.5, lineHeight: 1.4, color: "#3A4160" }}>{st.l}</span>
              </div>
            ))}
            <div style={{ padding: "16px 22px", background: "#F1F9F5", fontWeight: 600, fontSize: 12.5, color: "#0A5C4D" }}>
              {lang === "fr"
                ? `${num(hotels.length)} hôtels sur ${cities.length} étapes, ${num(totalChargers)} bornes cartographiées autour d'eux.`
                : `${num(hotels.length)} hotels across ${cities.length} stops, ${num(totalChargers)} chargers mapped around them.`}
            </div>
          </div>
        </div>
      </div>

      {/* Carte de France : le premier geste de la page. */}
      <div style={{ borderBottom: "1px solid #EBEBF2", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "44px 26px 52px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 34, letterSpacing: "-0.035em" }}>
              {lang === "fr" ? "Où sont les hôtels qui chargent" : "Where the charging hotels are"}
            </h2>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>
              {lang === "fr"
                ? `${num(national)} hôtels équipés dans ${nationalDepts} départements, relevés dans la base nationale IRVE.`
                : `${num(national)} equipped hotels across ${nationalDepts} departments, from the national IRVE database.`}
            </span>
          </div>

          <div
            className="ps-home-map"
            style={{
              display: "grid",
              gridTemplateColumns: "1.45fr 0.55fr",
              gridTemplateRows: 660,
              background: "#FFFFFF",
              border: "1px solid #EBEBF2",
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            <div className="ps-home-map-canvas" style={{ height: "100%", minHeight: 0, background: "#EDF1EE" }}>
              <FranceMiniMap lang={lang} cities={mapCities} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: 0,
                background: "#FFFFFF",
                borderLeft: "1px solid #EBEBF2",
              }}
            >
              <div style={{ padding: "20px 22px", background: "#F1F9F5", display: "flex", flexDirection: "column", gap: 4 }}>
                <span className="tnum" style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.03em" }}>
                  {num(nationalFast)}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.45, color: "#0A5C4D" }}>
                  {lang === "fr"
                    ? "hôtels dont la borne dépasse 50 kW, de quoi repartir plein même après une arrivée tardive."
                    : "hotels whose charger exceeds 50 kW, enough to leave full even after a late arrival."}
                </span>
              </div>

              <div style={{ padding: "16px 22px 10px", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#0A5C4D" }}>
                {lang === "fr" ? "ÉTAPES OUVERTES" : "STOPS OPEN"}
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${lang}/${c.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      padding: "9px 8px",
                      borderRadius: 12,
                      textDecoration: "none",
                      color: "#141B34",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14.5, flex: 1, minWidth: 0 }}>{cityName(c, lang)}</span>
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 12, color: "#8B8FA3" }}>
                      {c.hotelCount}
                    </span>
                  </Link>
                ))}
              </div>

              <Link
                href={`/${lang}/france`}
                className="ps-dark-btn"
                style={{
                  margin: 14,
                  background: "#141B34",
                  color: "#FFFFFF",
                  height: 46,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                {lang === "fr" ? "Explorer toute la France" : "Explore the whole of France"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Types de borne */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "58px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 34, letterSpacing: "-0.035em" }}>{home.stepsH}</h2>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>{home.stepsNote}</span>
        </div>
        <div className="ps-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {home.steps.map((sp) => (
            <div
              key={sp.n}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 11,
                padding: 24,
                border: "1px solid #EBEBF2",
                borderRadius: 22,
              }}
            >
              <span className="tnum" style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em" }}>
                {sp.n}
              </span>
              <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-0.025em" }}>{sp.h}</span>
              <span style={{ fontSize: 15.5, lineHeight: 1.55, color: "#3A4160", textWrap: "pretty" }}>{sp.p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ce que chaque fiche indique */}
      <div style={{ borderTop: "1px solid #EBEBF2", borderBottom: "1px solid #EBEBF2", background: "#F7F5F1" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "58px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 34, letterSpacing: "-0.035em" }}>{home.checksH}</h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#3A4160", textWrap: "pretty" }}>
              {home.checksP}
            </p>
          </div>
          <div
            className="ps-grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {home.checks.map((ck) => (
              <div
                key={ck.k}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 24,
                  background: "#FFFFFF",
                  border: "1px solid #EAE6DE",
                  borderRadius: 18,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#0A5C4D" }}>{ck.k}</span>
                <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{ck.h}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#3A4160" }}>{ck.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Le calcul de nuit */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "58px 26px" }}>
        <div
          className="ps-grid-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderRadius: 22,
            overflow: "hidden",
            background: "#141B34",
            color: "#FFFFFF",
          }}
        >
          <div style={{ padding: "44px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 12.5, letterSpacing: "0.04em", color: "#E4FB4F" }}>
              {home.mathK}
            </span>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 36, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
              {home.mathH}
            </h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#C3C8DC", textWrap: "pretty" }}>
              {home.mathP}
            </p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#8B93B3" }}>{home.mathNote}</p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1,
              padding: "36px 40px",
              background: "rgba(27,35,65,0.5)",
            }}
          >
            {home.math.map((mr) => (
              <div
                key={mr.l}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 18,
                  padding: "14px 0",
                  borderBottom: "1px solid #2B3358",
                }}
              >
                <span style={{ fontSize: 15, color: "#C3C8DC" }}>{mr.l}</span>
                <span className="tnum" style={{ fontWeight: 700, fontSize: 19 }}>
                  {mr.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Villes */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 26px 58px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-0.035em" }}>{home.citiesH}</h2>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>{lang === "fr" ? `${cities.length} villes françaises ouvertes, données de la base nationale IRVE.` : `${cities.length} French cities open, data from the national IRVE database.`}</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
            gap: 12,
          }}
        >
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/${lang}/${c.slug}`}
              className="ps-city-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                padding: "16px 18px",
                background: "#FFFFFF",
                border: "1px solid #EBEBF2",
                borderRadius: 18,
                textDecoration: "none",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 17, flex: 1, minWidth: 0, color: "#141B34" }}>
                  {cityName(c, lang)}
                </span>
                <span
                  className="tnum"
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#0A5C4D",
                    background: "#F1F9F5",
                    padding: "5px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.bestKw ? `${String(c.bestKw).replace(".", ",")} kW max` : lang === "fr" ? "ouvert" : "open"}
                </span>
              </span>
              <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
                {c.hotelCount} {lang === "fr" ? "hôtels" : "hotels"} · {num(c.chargersInCity)}{" "}
                {lang === "fr" ? "bornes en ville" : "chargers in town"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ borderTop: "1px solid #EBEBF2", background: "#FFFFFF" }}>
        <div
          className="ps-faq"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "58px 26px",
            display: "grid",
            gridTemplateColumns: "0.55fr 1.45fr",
            gap: 44,
            alignItems: "start",
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-0.035em" }}>{home.faqH}</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {home.faq.map((fq) => (
              <div
                key={fq.q}
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
                  {fq.q}
                </span>
                <span style={{ fontSize: 16, lineHeight: 1.55, color: "#3A4160", textWrap: "pretty" }}>{fq.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: "1px solid #EBEBF2", background: "#F7F5F1" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "44px 26px 64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>{home.ctaH}</span>
            <span style={{ fontSize: 15, color: "#3A4160" }}>{lang === "fr" ? `${hotels.length} fiches détaillées, puissance et connecteur pour chacune.` : `${hotels.length} detailed pages, power and connector on each.`}</span>
          </div>
          <Link
            href={`/${lang}/${firstCity.slug}`}
            className="ps-dark-btn"
            style={{
              background: "#141B34",
              color: "#FFFFFF",
              height: 52,
              padding: "0 30px",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            {home.ctaBtn}
          </Link>
        </div>
      </div>
    </div>
  );
}
