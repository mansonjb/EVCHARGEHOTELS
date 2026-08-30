import type { Metadata } from "next";
import { cities, hotels } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  title: "Méthode",
  description:
    "D'où viennent les informations de PlugStays : Booking pour les équipements et les prix, OpenStreetMap pour les caractéristiques des bornes, et rien d'inventé entre les deux.",
};

export default async function MethodePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw as Lang;
  const fr = lang === "fr";
  const totalChargers = cities.reduce((n, c) => n + c.chargersInCity, 0);
  const onSite = hotels.filter((h) => h.charging.onSite).length;

  const blocks = fr
    ? [
        {
          h: "Deux sources, jamais mélangées",
          p: `Booking donne les équipements, les photos, la note et le prix. Quand un hôtel a coché « Electric vehicle charging station », la fiche l'indique comme une déclaration de l'hôtel, pas comme une vérification. OpenStreetMap donne la borne elle-même : puissance de sortie, types de prises, nombre de points, tarif, horaires, parfois ampérage et tension. Une borne OSM située à moins de 120 m de l'hôtel est traitée comme étant sur place, et la distance est affichée.`,
        },
        {
          h: "Ce que nous ne faisons pas",
          p: "Nous ne visitons pas les hôtels et nous n'appelons pas les réceptions. Aucune information n'est devinée : quand la puissance n'est pas publiée, la fiche affiche « non publiée » plutôt qu'une estimation. Un champ vide est une information en soi.",
        },
        {
          h: "Pourquoi la distance compte",
          p: "Une borne à 40 m de l'entrée est probablement sur le parking de l'hôtel. À 110 m, c'est peut-être la borne municipale d'en face. La distance est donc affichée systématiquement, à vous de juger.",
        },
        {
          h: "Le calcul de nuit",
          p: "Treize heures branché, batterie de référence 77 kWh, consommation 18 kWh/100 km, pertes comprises. Beaucoup de voitures plafonnent à 11 kW en courant alternatif : au-delà, la borne n'est plus le facteur limitant.",
        },
        {
          h: "Fraîcheur",
          p: `Les relevés Booking datent du mois affiché en haut de chaque page ville. Les données de bornes viennent d'OpenStreetMap et évoluent en continu. Un tarif ou une puissance peut changer sans que nous le sachions : confirmez avec l'hôtel avant de compter dessus.`,
        },
        {
          h: "Liens et rémunération",
          p: "Les liens de réservation pointent vers Booking et sont monétisés. Cela ne change ni l'ordre des hôtels, ni les caractéristiques affichées, qui viennent des deux sources ci-dessus.",
        },
      ]
    : [
        {
          h: "Two sources, never blended",
          p: "Booking supplies facilities, photos, rating and price. Where a hotel has ticked “Electric vehicle charging station”, the page reports it as the hotel’s own declaration, not as a verification. OpenStreetMap supplies the charger itself: output power, socket types, number of points, pricing, opening hours, sometimes amperage and voltage. An OSM charger within 120 m of the hotel is treated as on site, and the distance is shown.",
        },
        {
          h: "What we do not do",
          p: "We do not visit hotels and we do not call front desks. Nothing is guessed: where power is not published, the page says so rather than estimating. An empty field is information in itself.",
        },
        {
          h: "Why distance matters",
          p: "A charger 40 m from the door is probably on the hotel car park. At 110 m it might be the municipal charger across the street. So the distance is always shown, and you judge.",
        },
        {
          h: "The overnight maths",
          p: "Thirteen hours plugged in, reference battery 77 kWh, consumption 18 kWh/100 km, losses included. Many cars cap at 11 kW on AC: beyond that, the charger is no longer the limiting factor.",
        },
        {
          h: "Freshness",
          p: "Booking data is sampled on the date shown at the top of each city page. Charger data comes from OpenStreetMap and changes continuously. A price or a power rating can change without us knowing: confirm with the hotel before relying on it.",
        },
        {
          h: "Links and revenue",
          p: "Booking links are monetised. That changes neither the order of the hotels nor the specifications shown, which come from the two sources above.",
        },
      ];

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 26px 90px" }}>
      <h1 style={{ margin: 0, fontWeight: 800, fontSize: 48, lineHeight: 1.02, letterSpacing: "-0.04em" }}>
        {fr ? "D'où viennent ces informations" : "Where this information comes from"}
      </h1>

      <div
        className="tnum"
        style={{
          display: "flex",
          gap: 26,
          flexWrap: "wrap",
          margin: "26px 0 8px",
          padding: "18px 22px",
          background: "#F1F9F5",
          border: "1px solid #C9E7DC",
          borderRadius: 16,
          fontWeight: 600,
          fontSize: 13,
          color: "#0A5C4D",
        }}
      >
        <span>{hotels.length} {fr ? "fiches" : "pages"}</span>
        <span>{onSite} {fr ? "avec borne cartographiée" : "with a mapped charger"}</span>
        <span>{totalChargers} {fr ? "bornes analysées" : "chargers analysed"}</span>
        <span>{cities.length} {fr ? "étapes" : "stops"}</span>
      </div>

      {blocks.map((b) => (
        <section key={b.h} style={{ marginTop: 34 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em" }}>{b.h}</h2>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.62, color: "#3A4160", textWrap: "pretty" }}>
            {b.p}
          </p>
        </section>
      ))}

      <p style={{ marginTop: 40, fontSize: 12.5, color: "#8B8FA3", borderTop: "1px solid #EBEBF2", paddingTop: 16 }}>
        {fr
          ? "Données de bornes © contributeurs OpenStreetMap, sous licence ODbL. Équipements, photos et prix : Booking."
          : "Charger data © OpenStreetMap contributors, ODbL licence. Facilities, photos and prices: Booking."}
      </p>
    </div>
  );
}
