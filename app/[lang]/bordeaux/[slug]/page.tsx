import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOTELS, hotelBySlug } from "@/data/hotels";
import { STR, LANGS, type Lang } from "@/lib/i18n";
import { NightMaths } from "@/components/night-maths";
import { ConnectorIcon } from "@/components/connector-icon";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => HOTELS.map((h) => ({ lang, slug: h.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const h = hotelBySlug(slug);
  if (!h) return {};
  return { title: `${h.name}, ${h.kw} · ${h.area}`, description: h.envie[lang as Lang] };
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
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang = rawLang as Lang;
  const h = hotelBySlug(slug);
  if (!h) notFound();
  const t = STR[lang];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 26px 90px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
          <Link href={`/${lang}/bordeaux`} style={{ color: "#0E7C68" }}>
            {h.city}
          </Link>{" "}
          · {h.area}
        </div>

        <div className="ps-gallery" style={{ display: "flex", gap: 10, height: 400 }}>
          <div
            className="photo-slot"
            style={{ position: "relative", flex: 2, borderRadius: 16, overflow: "hidden", border: "1px solid #EBEBF2" }}
          >
            <div style={{ position: "absolute", left: 14, bottom: 14, fontWeight: 600, fontSize: 12, color: "#6B6862" }}>
              photo · {h.photo[lang]}
            </div>
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
                color: h.warn ? "#F5C25B" : "#3FD9B0",
              }}
            >
              {h.kw} · {h.conn} · {h.warn ? "! " : ""}
              {h.ver}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="photo-slot" style={{ flex: 1, borderRadius: 16, border: "1px solid #EBEBF2" }} />
            <div
              className="photo-slot"
              style={{
                flex: 1,
                borderRadius: 16,
                border: "1px solid #EBEBF2",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: 12,
              }}
            >
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "#FFFFFF",
                  border: "1px solid #DEDEEA",
                  fontWeight: 600,
                  fontSize: 12.5,
                }}
              >
                {t.morePhotos}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ps-hotel-body" style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 48, paddingTop: 34 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 54, lineHeight: 1, letterSpacing: "-0.04em" }}>
              {h.name}
            </h1>
            <div
              className="tnum"
              style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}
            >
              <span>{h.stars}</span>
              <span style={{ color: "#0E7C68" }}>{h.score}</span>
              <span>·</span>
              <span>
                {h.area}, {h.city}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: "#3A4160", maxWidth: "58ch", textWrap: "pretty" }}>
              {h.envie[lang]}
            </p>
          </div>

          {/* Bloc de preuve */}
          <div style={{ border: "1px solid #C9E7DC", background: "#F1F9F5", borderRadius: 16, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 20px",
                borderBottom: "1px solid #DCEDE5",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.warn ? "#D89B1C" : "#0E9E7E" }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: "#0A5C4D", letterSpacing: "0.04em" }}>
                {t.proofTitle}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontWeight: 600, fontSize: 12.5, color: "#4F776A" }}>
                {h.warn ? (lang === "fr" ? "à reconfirmer · 03/2025" : "to reconfirm · 03/2025") : t.stamp}
              </span>
            </div>

            <div
              className="ps-proof"
              style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#DCEDE5" }}
            >
              <div style={cell}>
                <span style={cellLabel}>{t.lPower}</span>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 21 }}>
                  {h.kw}
                </span>
                <span style={cellSub}>{h.phase[lang]}</span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lConn}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <ConnectorIcon conn={h.conn} />
                  <span style={{ fontWeight: 600, fontSize: 18 }}>{h.conn}</span>
                </div>
                <span style={cellSub}>
                  {h.cableProvided
                    ? lang === "fr"
                      ? "câble fourni"
                      : "cable provided"
                    : t.cableNote}
                </span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lPoints}</span>
                <span className="tnum" style={{ fontWeight: 600, fontSize: 21 }}>
                  {h.points}
                </span>
                <span style={cellSub}>
                  1 / {Math.round(h.rooms / h.points)} ch.
                </span>
              </div>

              <div style={cell}>
                <span style={cellLabel}>{t.lAccess}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 18 }}>
                  <span
                    style={{ width: 8, height: 8, background: h.guar ? "#0E9E7E" : "#D89B1C", display: "inline-block" }}
                  />
                  {h.guar ? t.guaranteed : lang === "fr" ? "non garanti" : "not guaranteed"}
                </span>
                <span style={cellSub}>
                  {h.guar ? t.accessNote : lang === "fr" ? "premier arrivé, premier servi" : "first come, first served"}
                </span>
              </div>
            </div>

            <NightMaths hotel={h} lang={lang} />
          </div>

          {/* Éditorial */}
          <div style={{ display: "flex", flexDirection: "column", gap: 26, borderTop: "1px solid #EBEBF2", paddingTop: 30 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 31, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
                {lang === "fr" ? "Pourquoi c’est une bonne étape" : "Why this is a good stop"}
              </h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.62, color: "#3A4160", maxWidth: "70ch", textWrap: "pretty" }}>
                {h.why[lang]}
              </p>
            </div>
            <div className="ps-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>
                  {lang === "fr" ? "Dîner" : "Dinner"}
                </h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#3A4160", textWrap: "pretty" }}>
                  {h.dinner[lang]}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>
                  {lang === "fr" ? "Autour" : "Around"}
                </h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#3A4160", textWrap: "pretty" }}>
                  {h.around[lang]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carte de réservation */}
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
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="tnum" style={{ fontWeight: 600, fontSize: 27 }}>
                {h.price}
              </span>
              <span style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>{t.perNight}</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: "#EBEBF2",
                border: "1px solid #EBEBF2",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                className="tnum"
                style={{
                  background: "#FFFFFF",
                  padding: "11px 13px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#8B8FA3" }}>{t.arrive}</span>
                <span>ven. 12/06</span>
              </div>
              <div
                className="tnum"
                style={{
                  background: "#FFFFFF",
                  padding: "11px 13px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#8B8FA3" }}>{t.depart}</span>
                <span>sam. 13/06</span>
              </div>
              <div
                className="tnum"
                style={{
                  background: "#F1F9F5",
                  padding: "11px 13px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#0A5C4D",
                }}
              >
                <span>{t.plugRow}</span>
                <span>
                  {h.guar
                    ? lang === "fr"
                      ? "1 place réservée"
                      : "1 bay held"
                    : lang === "fr"
                      ? "non garantie"
                      : "not guaranteed"}
                </span>
              </div>
            </div>

            <button
              className="ps-dark-btn"
              style={{
                border: 0,
                background: "#141B34",
                color: "#FFFFFF",
                padding: 15,
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.book}
            </button>

            <div
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: "#8B8FA3",
                lineHeight: 1.5,
                borderTop: "1px solid #EBEBF2",
                paddingTop: 13,
              }}
            >
              {t.bookNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
