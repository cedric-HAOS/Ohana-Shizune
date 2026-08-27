# Guide de la PWA

## Développement local

La PWA est volontairement sans dépendance de build pour la Beta. Un serveur
statique suffit :

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory Shizune/PWA
```

Le port peut être changé si nécessaire. En cas de `WinError 10013`, utiliser
un autre port et conserver `--bind 127.0.0.1`.

## Fichiers principaux

- `index.html` : structure, métadonnées et navigation ;
- `styles.css` : design responsive et états visuels ;
- `app.js` : rendu des vues et interactions de démonstration ;
- `manifest.webmanifest` : installation comme application ;
- `sw.js` : cache des ressources statiques ;
- `icon.svg` : symbole officiel Ohana ;
- `tsunade.png` : portrait utilisé dans la maquette Beta ;
- `version.json` : version machine-readable de Shizune.

## Données de démonstration

Les données sont définies dans `app.js` et ne représentent pas l’état réel de
Konoha. Toute intégration API devra remplacer cette source par un client dédié,
avec validation stricte des réponses et gestion explicite des erreurs.

## Déploiement futur

Le déploiement réel devra servir la PWA en HTTPS avec les en-têtes adaptés au
service worker. Les endpoints API devront être séparés des ressources statiques
et ne devront pas être ajoutés au cache hors ligne. La publication, le domaine
et la mise en production restent des décisions distinctes de cette Beta locale.
