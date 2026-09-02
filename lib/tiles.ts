/**
 * Fond de carte : en couleur, sans clé et sans filigrane.
 *
 * Le gris clair d'Esri était juste mais éteint : sur un sujet déjà technique,
 * il donnait des cartes mortes. On prend donc le rendu OpenStreetMap France,
 * qui garde les forêts en vert, l'eau en bleu et les noms de communes en
 * français, avec le fond routier d'Esri en repli, coloré lui aussi, si les
 * tuiles françaises ne répondent pas.
 *
 * CARTO est écarté : ses tuiles anonymes portent désormais « API KEY
 * REQUIRED » en travers de l'image. À fort volume, la solution durable reste
 * une clé MapTiler ou Stadia, ou l'auto-hébergement des tuiles.
 */
export const TILES_PRIMARY = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
export const TILES_PRIMARY_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, tuiles OpenStreetMap France';

export const TILES_FALLBACK =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
export const TILES_FALLBACK_ATTR =
  'Fond de carte &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Ajoute le fond de carte et bascule sur le repli si les tuiles ne viennent
 * pas. Retourne la couche active.
 */
export function addBasemap(L: typeof import("leaflet"), map: import("leaflet").Map) {
  let errors = 0;
  let swapped = false;

  const primary = L.tileLayer(TILES_PRIMARY, {
    attribution: TILES_PRIMARY_ATTR,
    subdomains: "abc",
    maxZoom: 19,
  }).addTo(map);

  primary.on("tileerror", () => {
    errors += 1;
    if (errors >= 4 && !swapped) {
      swapped = true;
      map.removeLayer(primary);
      L.tileLayer(TILES_FALLBACK, {
        attribution: TILES_FALLBACK_ATTR,
        maxZoom: 18,
      }).addTo(map);
    }
  });

  return primary;
}
