/**
 * Fond de carte : style vectoriel OpenFreeMap, sans clé et sans filigrane.
 *
 * Historique des essais, pour ne pas y revenir :
 *   - Esri Canvas Light Gray seul : trop éteint, carte morte.
 *   - OpenStreetMap France : chaque rue et chaque départementale, illisible
 *     sous nos pastilles de prix.
 *   - Le même canevas repeint par un filtre CSS : le fond prend une couleur
 *     uniforme, menthe puis beige, et l'eau, les bois et les routes finissent
 *     de la même teinte. C'est exactement ce qu'il ne faut pas.
 *
 * La couleur doit venir du sens : bleu pour l'eau, vert pour les bois, blanc
 * pour les voies. C'est ce que fait le style « liberty » d'OpenFreeMap, servi
 * gratuitement, sans clé et sans plafond annoncé, à partir des données
 * OpenStreetMap.
 */
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a>';
