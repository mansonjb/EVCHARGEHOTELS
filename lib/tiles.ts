/**
 * Fond de carte : simple, teinté, sans clé et sans filigrane.
 *
 * Trois essais successifs pour arriver là. Le gris clair d'Esri seul était
 * mort ; le rendu OpenStreetMap France, lui, affichait chaque rue, chaque
 * numéro de départementale et chaque hameau, et noyait nos pastilles de prix.
 * On garde donc le fond minimal d'Esri, qui ne dessine que les axes et les
 * noms de villes, et la couleur revient par une teinte menthe appliquée en
 * CSS (`.leaflet-tile-pane` dans globals.css).
 *
 * Les libellés voyagent dans une couche séparée, posée sous les marqueurs.
 * En repli, OpenStreetMap France, hébergé ailleurs : si Esri tombe, la carte
 * tient quand même.
 *
 * CARTO est écarté : ses tuiles anonymes portent « API KEY REQUIRED » en
 * travers de l'image. À fort volume, la solution durable reste une clé
 * MapTiler ou Stadia, ou l'auto-hébergement des tuiles.
 */
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";

export const TILES_PRIMARY = `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
export const TILES_LABELS = `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`;
export const TILES_PRIMARY_ATTR =
  'Fond de carte &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const TILES_FALLBACK = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
export const TILES_FALLBACK_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, tuiles OpenStreetMap France';

/** Zoom maximal du fond minimal : au-delà, Esri ne sert plus ce canevas. */
export const TILES_MAX_ZOOM = 16;

/**
 * Ajoute le fond de carte et bascule sur le repli si les tuiles ne viennent
 * pas. Retourne la couche active.
 */
export function addBasemap(L: typeof import("leaflet"), map: import("leaflet").Map) {
  let errors = 0;
  let swapped = false;

  const primary = L.tileLayer(TILES_PRIMARY, {
    attribution: TILES_PRIMARY_ATTR,
    maxZoom: TILES_MAX_ZOOM,
  }).addTo(map);

  // Noms de communes et limites, sous les marqueurs.
  const labels = L.tileLayer(TILES_LABELS, {
    maxZoom: TILES_MAX_ZOOM,
    pane: "shadowPane",
  }).addTo(map);

  primary.on("tileerror", () => {
    errors += 1;
    if (errors >= 4 && !swapped) {
      swapped = true;
      map.removeLayer(primary);
      // Le repli porte déjà ses propres libellés.
      map.removeLayer(labels);
      L.tileLayer(TILES_FALLBACK, {
        attribution: TILES_FALLBACK_ATTR,
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(map);
    }
  });

  return primary;
}
