import type { Metadata } from "next";
import Link from "next/link";
import stationsJson from "@/data/irve-hotel-stations.json";
import { cities } from "@/lib/data";
import { LANGS, alternatesFor, type Lang } from "@/lib/i18n";

interface Station {
  id: string;
  name: string | null;
  operator: string | null;
  lat: number;
  lng: number;
  street: string | null;
  postcode: string | null;
  city: string | null;
  dept: string | null;
  deptCode: string | null;
  kw: number | null;
  sockets: string[];
  points: number | null;
  free: boolean;
  hours: string | null;
  updated: string | null;
}

const stations = (stationsJson as { stations: Station[] }).stations;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    title: fr
      ? `${stations.length} hôtels français avec borne de recharge`
      : `${stations.length} French hotels with an EV charger`,
    description: fr
      ? "Relevé de la base nationale IRVE : les hôtels de France dont la borne est déclarée, avec puissance, prises et nombre de points."
      : "From the French national IRVE database: hotels across France with a declared charger, with power, sockets and number of points.",
    alternates: alternatesFor(lang as Lang, "/france"),
  };
}

export default async function FrancePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw as Lang;
  const fr = lang === "fr";

  const withKw = stations.filter((s) => s.kw);
  const fast = stations.filter((s) => (s.kw ?? 0) >= 50);
  const t22 = stations.filter((s) => (s.kw ?? 0) >= 22 && (s.kw ?? 0) < 50);
  const slow = stations.filter((s) => (s.kw ?? 0) > 0 && (s.kw ?? 0) < 22);
  const open = new Set(cities.map((c) => c.name.toLowerCase()));

  const byCity = new Map<string, { n: number; best: number }>();
  for (const s of stations) {
    const c = (s.city || "").trim();
    if (!c || c.toLowerCase() === "france") continue;
    const cur = byCity.get(c) ?? { n: 0, best: 0 };
    byCity.set(c, { n: cur.n + 1, best: Math.max(cur.best, s.kw ?? 0) });
  }
  const topCities = [...byCity.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 48);

  const byDept = new Map<string, number>();
  for (const s of stations) {
    if (!s.dept) continue;
    byDept.set(s.dept, (byDept.get(s.dept) ?? 0) + 1);
  }
  const topDepts = [...byDept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const stat = (n: number, l: string) => (
    <div key={l} style={{ background: "#FFFFFF", padding: "18px 22px" }}>
      <p className="tnum" style={{ margin: 0, fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>
        {n}
      </p>
      <p style={{ margin: "4px 0 0", fontWeight: 600, fontSize: 13, color: "#8B8FA3" }}>{l}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 26px 90px" }}>
      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 48, lineHeight: 1.02, letterSpacing: "-0.04em", maxWidth: "20ch" }}>
        {fr ? `${stations.length} hôtels français` : `${stations.length} French hotels`}{" "}
        <span className="hand" style={{ fontSize: "1.1em" }}>
          {fr ? "avec une borne" : "with a charger"}
        </span>
      </h1>

      <p style={{ maxWidth: "72ch", fontSize: 17, lineHeight: 1.6, color: "#3A4160", marginTop: 22 }}>
        {fr
          ? "Ce relevé ne vient pas d'un filtre de réservation mais de la base nationale des infrastructures de recharge, que les opérateurs sont tenus de publier. Nous y avons isolé les stations dont le nom désigne un hôtel, puis dédoublonné par établissement. Chaque ligne porte donc une puissance réelle, pas une case cochée."
          : "This list does not come from a booking filter but from the French national charging infrastructure database, which operators are required to publish. We isolated the stations whose name identifies a hotel, then deduplicated by property. Every line therefore carries a real power rating, not a ticked box."}
      </p>

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
        {stat(withKw.length, fr ? "avec puissance publiée" : "with published power")}
        {stat(fast.length, fr ? "à 50 kW ou plus" : "at 50 kW or more")}
        {stat(t22.length, fr ? "entre 22 et 50 kW" : "between 22 and 50 kW")}
        {stat(slow.length, fr ? "sous 22 kW" : "below 22 kW")}
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.035em", marginTop: 48 }}>
        {fr ? "Les villes les mieux équipées" : "Best-equipped towns"}
      </h2>
      <p style={{ fontSize: 14.5, color: "#8B8FA3", marginTop: 6 }}>
        {fr
          ? "Nombre d'hôtels équipés, et meilleure puissance relevée dans la commune."
          : "Number of equipped hotels, and the highest power recorded in the town."}
      </p>
      <div
        className="ps-grid-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 1,
          background: "#EBEBF2",
          border: "1px solid #EBEBF2",
          borderRadius: 18,
          overflow: "hidden",
          marginTop: 18,
        }}
      >
        {topCities.map(([city, v]) => {
          const isOpen = open.has(city.toLowerCase());
          const slug = cities.find((c) => c.name.toLowerCase() === city.toLowerCase())?.slug;
          const inner = (
            <>
              <span style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 0, color: isOpen ? "#0E7C68" : "#141B34" }}>
                {city}
              </span>
              <span className="tnum" style={{ fontWeight: 600, fontSize: 12.5, color: "#8B8FA3" }}>
                {v.n} · {v.best ? `${String(v.best).replace(".", ",")} kW` : "—"}
              </span>
            </>
          );
          const style: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 18px",
            background: "#FFFFFF",
            textDecoration: "none",
          };
          return isOpen && slug ? (
            <Link key={city} href={`/${lang}/${slug}`} style={style}>
              {inner}
            </Link>
          ) : (
            <div key={city} style={style}>
              {inner}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.035em", marginTop: 48 }}>
        {fr ? "Par département" : "By department"}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {topDepts.map(([d, n]) => (
          <span
            key={d}
            className="tnum"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #EBEBF2",
              fontWeight: 600,
              fontSize: 13,
              color: "#3A4160",
            }}
          >
            {d} <span style={{ color: "#0E7C68" }}>{n}</span>
          </span>
        ))}
      </div>

      <h2 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.035em", marginTop: 48 }}>
        {fr ? "Les bornes d'hôtel les plus puissantes de France" : "The most powerful hotel chargers in France"}
      </h2>
      <div style={{ marginTop: 18, overflowX: "auto", border: "1px solid #EBEBF2", borderRadius: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ background: "#F3F3F8", textAlign: "left" }}>
              {[
                fr ? "Station" : "Station",
                fr ? "Commune" : "Town",
                "kW",
                fr ? "Prises" : "Sockets",
                fr ? "Points" : "Points",
              ].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8B8FA3" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...stations]
              .sort((a, b) => (b.kw ?? 0) - (a.kw ?? 0))
              .slice(0, 40)
              .map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid #EBEBF2" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 14 }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13.5, color: "#8B8FA3" }}>{s.city || "—"}</td>
                  <td className="tnum" style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13.5, color: "#0E7C68" }}>
                    {s.kw ? String(s.kw).replace(".", ",") : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#3A4160" }}>{s.sockets.join(", ") || "—"}</td>
                  <td className="tnum" style={{ padding: "10px 14px", fontSize: 13 }}>{s.points ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 26, fontSize: 12.5, color: "#8B8FA3" }}>
        {fr
          ? "Source : base nationale des infrastructures de recharge (IRVE), data.gouv.fr, licence ouverte. Une station porte parfois le nom d'un hôtel sans lui appartenir : les fiches détaillées expliquent, hôtel par hôtel, pourquoi la borne lui est attribuée."
          : "Source: French national charging infrastructure database (IRVE), data.gouv.fr, open licence. A station sometimes carries a hotel's name without belonging to it: the detailed pages explain, hotel by hotel, why the charger is attributed to it."}
      </p>
    </div>
  );
}
