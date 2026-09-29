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
- `app.js` : rendu des vues et interactions ;
- `health-healthy.png`, `health-degraded.png`, `health-critical.png` : icônes
  d’état de Konoha, reprises de Vision et réduites à 144 px ;
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

L’accueil présente, dans l’ordre : l’état de Konoha (icône de Vision, décisions
en attente, sujets suivis), les services essentiels (DNS, DHCP, MQTT, Home
Assistant, Z-Wave, Téléinformation), les journaux par équipement avec la date du
dernier contrôle, puis la prévention. Les blocs `services` et `logs` n’apparaissent
que si l’Agent les publie (Agent 1.44.0). Un appui sur un équipement dont les
journaux ont un incident ouvre sa fiche.

Les écrans Accueil, Activité et Décisions lisent ensuite la synthèse bornée de
Tsunade. Après une réponse, un message confirme l’envoi ; « Décisions récentes »
(24 h) affiche ce qui a été répondu et l’issue publiée par Tsunade. Une perte de
synchronisation remplace la page par « Connexion indisponible » et l’heure de la
dernière synchronisation réussie. Les réponses restent limitées aux choix fournis par Agent ; aucune
commande libre, configuration ou donnée technique sensible n’est exposée.

## Déploiement futur

Le déploiement retenu sert Vision et Shizune en HTTP, exclusivement sur le
Wi-Fi domestique ou via WireGuard. Les réponses privées ne sont jamais ajoutées
au cache hors ligne. Le service worker reste désactivé en HTTP conformément aux
règles du navigateur.
