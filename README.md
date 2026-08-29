# PlugStays — prototype

Prototype Next.js du guide « hôtels où la voiture recharge la nuit », porté depuis le canvas
Claude Design `PlugStays v3.dc.html`.

- Next 16 · React 19 · Tailwind v4 · TypeScript
- FR à `/fr`, EN à `/en`
- Trois écrans : accueil, résultats (Bordeaux), fiche hôtel
- Données de démonstration dans `data/hotels.ts` (rien n'est vérifié)

```bash
npm install
npm run dev   # http://localhost:3084
```

Système visuel repris du canvas : Archivo + Caveat, encre `#141B34`, vert `#0E9E7E`,
citron `#E4FB4F`, pastilles arrondies, sceau de charge en haut à droite de chaque photo,
bandeau de preuve sous la photo, calcul de nuit repliable.
