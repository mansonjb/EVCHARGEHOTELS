import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cities } from "@/lib/data";
import { departments, deptByCode, hotelsInDept } from "@/lib/national";
import { LANGS, alternatesFor, type Lang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => departments.map((d) => ({ lang, dept: d.code.toLowerCase() })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; dept: string }>;
}): Promise<Metadata> {
  const { lang, dept } = await params;
  const d = deptByCode(dept.toUpperCase());
  if (!d) return {};
  const fr = lang === "fr";
  return {
    title: fr
      ? `${d.count} hôtels avec borne de recharge en ${d.name}`
      : `${d.count} hotels with an EV charger in ${d.name}`,
    description: fr
      ? `Les hôtels de ${d.name} dont la borne est déclarée à la base nationale IRVE : puissance, prises, nombre de points, commune.`
      : `Hotels in ${d.name} with a charger declared in the French national IRVE database: power, sockets, number of points, town.`,
    alternates: alternatesFor(lang as Lang, `/france/${dept.toLowerCase()}`),
  };
}

export default async function DeptPage({
  params,
}: {
  params: Promise<{ lang: string; dept: string }>;
}) {
  const { lang: raw, dept } = await params;
  const lang = raw as Lang;
  const fr = lang === "fr";
  const code = dept.toUpperCase();
  const d = deptByCode(code);
  if (!d) notFound();

  const list = hotelsInDept(code).sort((a, b) => (b.kw ?? 0) - (a.kw ?? 0));
  const fast = list.filter((h) => (h.kw ?? 0) >= 50).length;
  const openCity = new Map(cities.map((c) => [c.name.toLowerCase(), c.slug]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: fr ? `Hôtels avec borne en ${d.name}` : `Hotels with a charger in ${d.name}`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 50).map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Hotel",
        name: h.name,
        address: { "@type": "PostalAddress", addressLocality: h.city, addressCountry: "FR" },
        geo: { "@type": "GeoCoordinates", latitude: h.lat, longitude: h.lng },
        amenityFeature: [
          {
            "@type": "LocationFeatureSpecification",
            name: h.kw ? `EV charging ${h.kw} kW` : "EV charging",
            value: true,
          },
        ],
      },
    })),
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 26px 90px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
        <Link href={`/${lang}/france`} style={{ color: "#0E7C68" }}>
          France
        </Link>{" "}
        · {d.name}
      </nav>

      <h1 style={{ margin: "14px 0 0", fontWeight: 800, fontSize: 44, lineHeight: 1.03, letterSpacing: "-0.04em", maxWidth: "20ch" }}>
        {list.length} {fr ? "hôtels avec borne" : "hotels with a charger"}{" "}
        <span className="hand" style={{ fontSize: "1.1em" }}>
          {fr ? `en ${d.name}` : `in ${d.name}`}
        </span>
      </h1>

      <p style={{ maxWidth: "70ch", fontSize: 16.5, lineHeight: 1.6, color: "#3A4160", marginTop: 18 }}>
        {fr
          ? `Relevé de la base nationale IRVE : ${list.length} établissements répartis sur ${d.cities} communes, dont ${fast} avec une borne de 50 kW ou plus. La puissance affichée est celle déclarée par l'opérateur, pas une estimation.`
          : `From the French national IRVE database: ${list.length} properties across ${d.cities} towns, ${fast} of them with a charger of 50 kW or more. The power shown is the operator's declared figure, not an estimate.`}
      </p>

      <div style={{ marginTop: 26, overflowX: "auto", border: "1px solid #EBEBF2", borderRadius: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ background: "#F3F3F8", textAlign: "left" }}>
              {[
                fr ? "Hôtel" : "Hotel",
                fr ? "Commune" : "Town",
                "kW",
                fr ? "Prises" : "Sockets",
                fr ? "Points" : "Points",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8B8FA3" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((h) => {
              const citySlug = openCity.get(h.city.toLowerCase());
              return (
                <tr key={h.slug} style={{ borderTop: "1px solid #EBEBF2" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 14.5 }}>{h.name}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13.5, color: "#8B8FA3" }}>
                    {citySlug ? (
                      <Link href={`/${lang}/${citySlug}`} style={{ color: "#0E7C68" }}>
                        {h.city}
                      </Link>
                    ) : (
                      h.city
                    )}
                  </td>
                  <td className="tnum" style={{ padding: "11px 14px", fontWeight: 700, fontSize: 13.5, color: (h.kw ?? 0) >= 50 ? "#141B34" : "#0E7C68" }}>
                    {h.kw ? String(h.kw).replace(".", ",") : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#3A4160" }}>{h.sockets.join(", ") || "—"}</td>
                  <td className="tnum" style={{ padding: "11px 14px", fontSize: 13 }}>{h.points ?? "—"}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right" }}>
                    <a
                      href={h.bookingUrl}
                      target="_blank"
                      rel="noopener nofollow sponsored"
                      className="ps-dark-btn"
                      style={{
                        display: "inline-block",
                        background: "#141B34",
                        color: "#FFFFFF",
                        padding: "7px 14px",
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: 12.5,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fr ? "Réserver" : "Book"}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 22, fontSize: 12.5, color: "#8B8FA3", maxWidth: "80ch" }}>
        {fr
          ? "Source : base nationale des infrastructures de recharge (IRVE), data.gouv.fr, licence ouverte. Les liens de réservation ouvrent une recherche Booking sur le nom de l'établissement et sont monétisés. Une station peut porter le nom d'un hôtel sans lui appartenir : vérifiez auprès de l'établissement avant de compter dessus."
          : "Source: French national charging infrastructure database (IRVE), data.gouv.fr, open licence. Booking links open a search on the property name and are monetised. A station may carry a hotel's name without belonging to it: check with the property before relying on it."}
      </p>

      <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {departments
          .filter((x) => x.code !== code)
          .slice(0, 14)
          .map((x) => (
            <Link
              key={x.code}
              href={`/${lang}/france/${x.code.toLowerCase()}`}
              className="tnum"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #EBEBF2",
                fontWeight: 600,
                fontSize: 13,
                color: "#3A4160",
                textDecoration: "none",
              }}
            >
              {x.name} <span style={{ color: "#0E7C68" }}>{x.count}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
