# Process de données PlugStays

Trois étapes, deux sources, aucune invention entre les deux.

```bash
# 1. Bornes réelles (gratuit, OpenStreetMap via Overpass)
node scripts/fetch-chargers-osm.mjs              # toutes les destinations
node scripts/fetch-chargers-osm.mjs --only tours --force

# 1 bis. Enrichissement bornes (optionnel, clé gratuite Open Charge Map)
#    OCM porte souvent l ampérage, la tension et le type d usage, absents d OSM.
node --env-file=.env.local scripts/fetch-chargers-ocm.mjs

# 2. Hôtels réels (Apify, payant, ~0,006 $ par hôtel)
node --env-file=.env.local scripts/fetch-hotels-booking.mjs --max 60
node --env-file=.env.local scripts/fetch-hotels-booking.mjs --only anvers --max 60 --force

# 3. Jointure et écriture du dataset du site
node scripts/build-dataset.mjs
```

## Ce que chaque source apporte

| Donnée | Source | Remarque |
|---|---|---|
| Nom, adresse, coordonnées, note, étoiles, prix, photos | Booking (Apify `voyager/booking-scraper`) | `extractAdditionalHotelData: true` est indispensable, c'est lui qui ramène la liste d'équipements |
| « Electric vehicle charging station » | Booking, liste d'équipements | booléen déclaré par l'hôtel, jamais présenté comme vérifié |
| Puissance de sortie, types de prises, nombre de points, tarif, 24/7, ampérage, tension, opérateur | OpenStreetMap (Overpass) | c'est la seule source gratuite qui donne la donnée physique |
| Bornes publiques autour | OpenStreetMap | rayon de 700 m, environ huit minutes à pied |

## Règles de jointure (`scripts/build-dataset.mjs`)

- Une borne OSM à **moins de 120 m** de l'hôtel est traitée comme étant sur place. La distance est toujours affichée, au lecteur de juger.
- Bornes publiques : **rayon de 700 m**, les six plus proches sont listées sur la fiche.
- Un hôtel n'est retenu que si au moins une source le confirme. Trois niveaux :
  - `confirmed` : déclaré sur Booking **et** borne cartographiée
  - `declared` : déclaré sur Booking seulement, caractéristiques inconnues
  - `mapped` : borne cartographiée seulement
- Le classement met devant les hôtels dont la borne est cartographiée, puis la note des voyageurs. Le confort décide, la recharge est la condition.

## Pièges rencontrés

- L'endpoint Apify `run-sync-get-dataset-items` **coupe à 300 secondes**. Un scrape de 60 hôtels avec équipements dure bien plus : le script lance un run asynchrone et interroge son état toutes les 15 secondes.
- `sortBy` n'accepte que `bayesian_review_score`, `distance_from_search`, `class_asc`, `price`, `review_score_and_price`, `class_and_price`.
- Le filtre Booking `nflt=hotelfacility=182` **n'est pas** la recharge électrique : il ramène des appartements sans borne. On filtre donc localement sur le nom de l'équipement.
- Overpass exige un `User-Agent` explicite (sinon 406) et limite fortement le débit (429) : le script attend douze secondes entre deux villes et réessaie avec une pente de quinze secondes.
- Environ **un hôtel sur trente** déclare la recharge sur Booking dans une recherche généraliste. C'est pour cela qu'on scrape 60 hôtels par ville et qu'on complète avec OSM.

## Licences et mentions

- Bornes : © contributeurs OpenStreetMap, ODbL. La mention est affichée sur les pages ville et les fiches. On publie des résultats produits, jamais un dump de la base.
- Équipements, photos et prix : Booking. Les photos sont servies depuis `cf.bstatic.com`, pas recopiées.
- Les liens de réservation sont monétisés par le script Stay22 « let me allez » (`NEXT_PUBLIC_STAY22_LMA_ID`).

## Ajouter une destination

1. Ajouter une entrée dans `data/destinations.json` (slug, nom FR et EN, pays, coordonnées, rayon, `corridorKm`, terme de recherche Booking).
2. `node scripts/fetch-chargers-osm.mjs --only <slug>`
3. `node --env-file=.env.local scripts/fetch-hotels-booking.mjs --only <slug> --max 60`
4. `node scripts/build-dataset.mjs`
5. `npm run build` puis relire la page ville avant de déployer.
