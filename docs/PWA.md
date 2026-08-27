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

## Connexion à Tsunade

La PWA utilise la passerelle de même origine `/api/shizune` exposée par Vision.
Depuis **Profil**, l’utilisateur crée une demande d’association, compare le code
et l’empreinte TLS dans Vision, puis approuve l’iPhone. Shizune récupère alors
une seule fois son jeton compagnon et le conserve dans IndexedDB.

Les écrans Accueil, Activité et Décisions lisent ensuite la synthèse bornée de
Tsunade. Les réponses restent limitées aux choix fournis par Agent ; aucune
commande libre, configuration ou donnée technique sensible n’est exposée.
Tsunade peut toutefois fournir des commandes d’investigation en lecture seule,
présentées comme texte copiable et toujours exécutées manuellement par
l’utilisateur.

## Déploiement futur

Le déploiement retenu sert Vision et Shizune en HTTP, exclusivement sur le
Wi-Fi domestique ou via WireGuard. Les réponses privées ne sont jamais ajoutées
au cache hors ligne. Le service worker reste désactivé en HTTP conformément aux
règles du navigateur.
