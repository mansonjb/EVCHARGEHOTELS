# Process de données PlugStays

**État au 31/08/2026** : 15 villes éditoriales (Paris, Lyon, Toulouse, Marseille,
Lille, Nantes, Montpellier, Rouen, Dijon, Deauville, Bordeaux, Tours, Poitiers,
La Rochelle, Beaune), **342 hôtels avec fiche complète**, dont 112 avec une borne
attribuée par le moteur contre 48 déclarés sur Booking, et 307 avec une puissance
chiffrée. À côté, le relevé national publie **1 273 hôtels** sur 97 pages
départements et une carte. 919 pages statiques au total.

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

## Pipeline inversé : partir des bornes, pas des hôtels

```bash
node scripts/discover-hotels-irve.mjs --top 30
```

Au lieu de partir d'une liste d'hôtels et de chercher leurs bornes, on lit la
base nationale entière et on isole les stations dont le NOM désigne un
hébergement. Résultat au 30/08/2026 : **1 515 hôtels français distincts, 99 %
avec puissance publiée, 665 à 50 kW ou plus**. Le fichier produit,
`data/irve-hotel-stations.json`, alimente la page `/fr/france` et sert à
choisir les prochaines villes à ouvrir.

Deux pièges appris en route :

- **« Hôtel de Ville » est une mairie**, pas un hébergement. Sans liste
  d'exclusion (hôtel de police, hôtel-Dieu, hôtel du département, préfecture,
  hôpital), le jeu de données est inexploitable.
- Le seul critère `implantation_station = parking privé réservé à la clientèle`
  ramène surtout des parkings de supermarchés : 683 stations écartées. Le nom
  de station est trois fois plus discriminant.

Les noms de communes viennent du référentiel INSEE (`geo.api.gouv.fr`), les
adresses IRVE étant trop hétérogènes pour être parsées de façon fiable.

## Ce que chaque source apporte

| Donnée | Source | Remarque |
|---|---|---|
| Nom, adresse, coordonnées, note, étoiles, prix, photos | Booking (Apify `voyager/booking-scraper`) | `extractAdditionalHotelData: true` est indispensable, c'est lui qui ramène la liste d'équipements |
| « Electric vehicle charging station » | Booking, liste d'équipements | booléen déclaré par l'hôtel, jamais présenté comme vérifié |
| Puissance de sortie, types de prises, nombre de points, tarif, 24/7, ampérage, tension, opérateur | OpenStreetMap (Overpass) | c'est la seule source gratuite qui donne la donnée physique |
| Bornes publiques autour | OpenStreetMap | rayon de 700 m, environ huit minutes à pied |

## Moteur d'appariement (`lib/match.mjs`)

Aucune source ne dit « cette borne appartient à cet hôtel ». On le déduit par
recoupement, avec un score dont le détail est affiché sur la fiche :

| Signal | Points |
|---|---|
| Même numéro et même voie | 50 |
| Même voie seulement | 25 |
| La station porte le nom de l'hôtel ou sa marque | 40 |
| Distance : 15 m / 25 m / 40 m / 80 m / 120 m | 45 / 35 / 25 / 15 / 8 |
| Implantation « parking privé réservé à la clientèle » | 20 |
| Même code postal | 10 |
| Accès réservé aux clients (OSM, OCM) | 10 |
| Recharge déclarée par l'hôtel sur Booking | 15 |

Seuils : **70 et plus** la borne est attribuée à l'hôtel, **50 à 70** le
rapprochement est affiché comme probable et signalé comme tel, en dessous la
borne reste une borne publique du voisinage.

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

## État de l'API Open Charge Map

La clé est configurée dans `.env.local` (`OCM_API_KEY`). Au 30/08/2026 l'API
répond en **524 Cloudflare** (l'origine d'OCM ne répond plus) pour toute
requête dépassant quelques dizaines de résultats, aussi bien depuis le shell
que depuis un navigateur. Le script encaisse la panne : quatre tentatives,
temporisation de 180 s, et il s'arrête sans casser la jointure. À relancer
quand leur API est rétablie :

```bash
node --env-file=.env.local scripts/fetch-chargers-ocm.mjs && node scripts/build-dataset.mjs
```

`build-dataset.mjs` fusionne automatiquement `data/raw/ocm-<slug>.json` avec les
bornes OSM dès que les fichiers existent. C'est OCM qui apportera l'ampérage,
la tension et le type d'usage (« Private - for staff, visitors or customers »),
qui manquent presque partout dans OSM.

## Carte

Fond de carte en **tuiles image** (Leaflet, rendu canvas 2D), pas en tuiles
vectorielles. Le vectoriel exige WebGL et une fenêtre qui compose réellement
ses images : dans plusieurs contextes la toile restait grise, contrôles
affichés mais aucune rue ni ville. Les tuiles image se vérifient d'ailleurs
depuis le DOM (`img.leaflet-tile` chargées), ce qui rend la carte testable.

Tuiles : CARTO Positron, attribution OpenStreetMap et CARTO affichée par la
carte elle-même. Recherche de commune : `geo.api.gouv.fr`, sans clé.

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
