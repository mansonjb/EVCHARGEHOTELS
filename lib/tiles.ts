/**
 * Fond de carte : tuiles image, sans clé et sans filigrane.
 *
 * CARTO Positron a commencé à exiger une clé et tamponne « API KEY REQUIRED »
 * sur les tuiles anonymes. On prend donc le fond gris clair d'Esri, très
 * proche visuellement, avec le fond OpenStreetMap France en repli si les
 * tuiles échouent. À fort volume, la solution durable reste une clé MapTiler
 * ou Stadia, ou l'auto-hébergement des tuiles.
 */
export const TILES_PRIMARY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const TILES_PRIMARY_ATTR =
  'Fond de carte &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const TILES_FALLBACK = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
export const TILES_FALLBACK_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, tuiles OpenStreetMap France';

/**
 * Ajoute le fond de carte et bascule sur le repli si les tuiles ne viennent
 * pas. Retourne la couche active.
 */
export function addBasemap(L: typeof import("leaflet"), map: import("leaflet").Map) {
  let errors = 0;
  let swapped = false;

  const primary = L.tileLayer(TILES_PRIMARY, {
    attribution: TILES_PRIMARY_ATTR,
    maxZoom: 18,
  }).addTo(map);

  primary.on("tileerror", () => {
    errors += 1;
    if (errors >= 3 && !swapped) {
      swapped = true;
      map.removeLayer(primary);
      L.tileLayer(TILES_FALLBACK, {
        attribution: TILES_FALLBACK_ATTR,
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);
    }
  });

  return primary;
}
