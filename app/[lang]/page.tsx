import Link from "next/link";
import type { Metadata } from "next";
import { HOME, STR, alternatesFor, type Lang } from "@/lib/i18n";
import { cities, cityName, hotels } from "@/lib/data";

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
                <span style={{ width: 132, fontSize: 15, fontWeight: 700 }}>{cityName(firstCity, lang)}</span>
                <span style={{ width: 1, height: 22, background: "#EBEBF2", margin: "0 16px" }} />
                <span style={{ width: 104, fontWeight: 600, fontSize: 14 }}>12 – 13 juin</span>
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
                ? `${hotels.length} hôtels sur ${cities.length} étapes, ${totalChargers} bornes cartographiées autour d'eux.`
                : `${hotels.length} hotels across ${cities.length} stops, ${totalChargers} chargers mapped around them.`}
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
      <div style={{ borderTop: "1px solid #EBEBF2", borderBottom: "1px solid #EBEBF2", background: "#F3F3F8" }}>
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
              gap: 1,
              background: "#DEDEEA",
              border: "1px solid #DEDEEA",
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            {home.checks.map((ck) => (
              <div
                key={ck.k}
                style={{ display: "flex", flexDirection: "column", gap: 8, padding: 24, background: "#FFFFFF" }}
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
          <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>{lang === "fr" ? "Corridor Amsterdam vers Bordeaux, cinq étapes ouvertes." : "Amsterdam to Bordeaux corridor, five stops open."}</span>
        </div>
        <div
          className="ps-grid-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            background: "#EBEBF2",
            border: "1px solid #EBEBF2",
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/${lang}/${c.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "17px 22px",
                background: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 0, color: "#141B34" }}>{cityName(c, lang)}</span>
              <span className="tnum" style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>
                {c.hotelCount} {lang === "fr" ? "hôtels" : "hotels"} · {c.chargersInCity}{" "}
                {lang === "fr" ? "bornes" : "chargers"}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 12.5,
                  color: "#0A5C4D",
                  background: "#F1F9F5",
                  padding: "5px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {c.bestKw ? `${String(c.bestKw).replace(".", ",")} kW max` : lang === "fr" ? "ouvert" : "open"}
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
      <div style={{ borderTop: "1px solid #EBEBF2", background: "#F3F3F8" }}>
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
