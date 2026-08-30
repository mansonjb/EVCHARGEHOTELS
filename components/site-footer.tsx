import Link from "next/link";
import { cities, cityName } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

export function SiteFooter({ lang }: { lang: Lang }) {
  const fr = lang === "fr";
  return (
    <footer style={{ borderTop: "1px solid #EBEBF2", background: "#FFFFFF" }}>
      <div
        className="ps-grid-4"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "48px 26px 28px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", border: "3px solid #141B34", background: "#E4FB4F" }} />
            <span style={{ fontWeight: 600, fontSize: 12.5, letterSpacing: "0.02em" }}>PLUGSTAYS</span>
          </span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#3A4160", maxWidth: "38ch" }}>
            {fr
              ? "Les informations de charge des hôtels au même endroit : puissance, connecteur, nombre de points, accès. Chaque fiche dit d'où vient l'information et quand elle a été relevée."
              : "Hotel charging details in one place: power, connector, number of points, access. Every page says where the information comes from and when it was sampled."}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8B8FA3" }}>
            {fr ? "ÉTAPES" : "STOPS"}
          </span>
          {cities.map((c) => (
            <Link key={c.slug} href={`/${lang}/${c.slug}`} style={{ fontSize: 14, color: "#3A4160" }}>
              {cityName(c, lang)}
            </Link>
          ))}
        </nav>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8B8FA3" }}>
            {fr ? "LE SITE" : "THE SITE"}
          </span>
          <Link href={`/${lang}/route/amsterdam-bordeaux`} style={{ fontSize: 14, color: "#3A4160" }}>
            {fr ? "Corridor Amsterdam vers Bordeaux" : "Amsterdam to Bordeaux corridor"}
          </Link>
          <Link href={`/${lang}/methode`} style={{ fontSize: 14, color: "#3A4160" }}>
            {fr ? "Méthode et sources" : "Method and sources"}
          </Link>
          <Link href={`/${lang === "fr" ? "en" : "fr"}`} style={{ fontSize: 14, color: "#3A4160" }}>
            {fr ? "English" : "Français"}
          </Link>
        </nav>
      </div>

      <div style={{ borderTop: "1px solid #EBEBF2" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "16px 26px 36px",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            justifyContent: "space-between",
            fontSize: 12.5,
            color: "#8B8FA3",
          }}
        >
          <span>
            {fr
              ? "Bornes : base nationale IRVE (data.gouv.fr, licence ouverte) et contributeurs OpenStreetMap (ODbL). Équipements, photos et prix : Booking."
              : "Chargers: French national IRVE database (data.gouv.fr, open licence) and OpenStreetMap contributors (ODbL). Facilities, photos and prices: Booking."}
          </span>
          <span>
            {fr
              ? "Les liens de réservation sont monétisés. Cela ne change pas l'ordre des hôtels."
              : "Booking links are monetised. That does not change the order of the hotels."}
          </span>
        </div>
      </div>
    </footer>
  );
}
