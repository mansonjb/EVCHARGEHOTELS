import type { Lang } from "@/lib/i18n";

/**
 * Carte Stay22 : les prix en direct autour de la ville.
 *
 * Elle complète le plan des bornes plutôt que de le remplacer. Le nôtre dit
 * où l'on peut brancher, celui-ci dit ce que coûte la nuit ce soir.
 *
 * Pas de montage différé en JavaScript : l'attribut loading="lazy" du
 * navigateur suffit, il ne dépend d'aucun observateur et le bloc reste rendu
 * côté serveur, donc visible même si un script échoue.
 */

const AID = process.env.NEXT_PUBLIC_STAY22_AID ?? process.env.NEXT_PUBLIC_STAY22_LMA_ID ?? "";

export function Stay22Map({
  lat,
  lng,
  city,
  citySlug,
  lang,
  height = 460,
}: {
  lat: number;
  lng: number;
  city: string;
  citySlug: string;
  lang: Lang;
  height?: number;
}) {
  const fr = lang === "fr";

  const src =
    `https://www.stay22.com/embed/gm?aid=${encodeURIComponent(AID)}` +
    `&lat=${lat}&lng=${lng}&markerlat=${lat}&markerlng=${lng}` +
    `&maincolor=0E9E7E&hidebrandlogo=true&adults=2&currency=EUR` +
    `&campaign=${encodeURIComponent(`plugstays-${lang}-${citySlug}`)}`;

  const search =
    `https://www.stay22.com/allez/booking?aid=${encodeURIComponent(AID)}` +
    `&lat=${lat}&lng=${lng}&address=${encodeURIComponent(city)}&adults=2`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>
          {fr ? `Les prix de ce soir à ${city}` : `Tonight's prices in ${city}`}
        </h2>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#8B8FA3", maxWidth: "58ch" }}>
          {fr
            ? "Notre plan dit où brancher, celle-ci dit ce que coûte la nuit. Comparez, puis revenez vérifier la borne sur la fiche."
            : "Our map says where to plug in, this one says what the night costs. Compare, then check the charger on the page."}
        </span>
      </div>

      <div
        style={{
          border: "1px solid #DEDEEA",
          borderRadius: 22,
          overflow: "hidden",
          background: "#F7F5F1",
        }}
      >
        <iframe
          src={src}
          title={fr ? `Carte des prix à ${city}` : `Price map in ${city}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ display: "block", width: "100%", height, border: 0, background: "#F7F5F1" }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            padding: "12px 18px",
            background: "#FFFFFF",
            borderTop: "1px solid #EBEBF2",
            fontSize: 12.5,
            color: "#8B8FA3",
          }}
        >
          <span>
            {fr
              ? "Prix et disponibilités fournis par Stay22. Réserver depuis cette carte nous rémunère, sans surcoût pour vous."
              : "Prices and availability provided by Stay22. Booking from this map earns us a commission, at no extra cost to you."}
          </span>
          <a
            href={search}
            target="_blank"
            rel="noopener nofollow sponsored"
            style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
          >
            {fr ? "Ouvrir la recherche" : "Open the search"}
          </a>
        </div>
      </div>
    </div>
  );
}
