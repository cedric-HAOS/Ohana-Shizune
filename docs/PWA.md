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
Assistant, Z-Wave, Téléinformation, Synchro AdGuard), les journaux par équipement avec la date du
dernier contrôle, puis la prévention. Les blocs `services` et `logs` n’apparaissent
que si l’Agent les publie (Agent 1.44.0). Un appui sur un équipement dont les
journaux ont un incident ouvre sa fiche.

Les écrans Accueil, Activité et Décisions lisent ensuite la synthèse bornée de
Tsunade. Après une réponse, un message confirme l’envoi ; « Décisions récentes »
(24 h) affiche ce qui a été répondu et l’issue publiée par Tsunade. Une perte de
synchronisation remplace la page par « Connexion indisponible » et l’heure de la
dernière synchronisation réussie. Les réponses restent limitées aux choix fournis par Agent ; aucune
commande libre, configuration ou donnée technique sensible n’est exposée.

## Mise à jour d'INFRA-01

Décision de l'utilisateur du 10 novembre 2026 : Shizune peut vérifier et lancer
la mise à jour du système d'INFRA-01. C'est la seule opération système du
compagnon.

Le bouton « Mise à jour d'INFRA-01 » de l'accueil ouvre un écran lu à part de la
synthèse (l'Agent simule apt, ce qui peut prendre jusqu'à 30 secondes). Il
affiche le verdict de l'Agent, le nombre de paquets en attente et de correctifs
de sécurité, l'âge des listes de paquets, un redémarrage requis et l'avancement
des assistants. La liste des paquets reste dans Vision.

- « Vérifier maintenant » demande l'actualisation des listes de paquets.
- « Mettre à jour » n'est proposé que si des paquets attendent et que les listes
  sont à jour ; il demande une confirmation avant d'envoyer la demande.
- Pendant une opération, les boutons disparaissent et l'état est relu toutes les
  5 secondes.

Shizune n'envoie aucun paramètre : l'Agent applique les mêmes refus que depuis
Vision et confie le travail aux assistants root de l'Installer. INFRA-01 n'est
jamais redémarré. Nécessite un Agent et une Vision qui publient
`/api/shizune/system/updates` ; sans eux, l'écran dit que la lecture est
impossible et le reste de Shizune fonctionne.

## Déploiement futur

Le déploiement retenu sert Vision et Shizune en HTTP, exclusivement sur le
Wi-Fi domestique ou via WireGuard. Les réponses privées ne sont jamais ajoutées
au cache hors ligne. Le service worker reste désactivé en HTTP conformément aux
règles du navigateur.

## Synchronisation AdGuard

À partir de Platform 1.0.142 (Agent 1.46.0, Vision 1.37.0), la PWA 0.5.0
affiche la tuile **Synchro AdGuard** reçue dans la synthèse Agent. Elle distingue
**Synchronisation vérifiée**, **Synchronisation en défaut** et
**Synchronisation non vérifiée**. Agent invalide la santé affichée lorsque le
plugin est désactivé ou que la mesure dépasse quinze minutes.
Lorsqu’Agent fournit la date du dernier cycle réussi, une synchronisation saine
affiche **Dernière synchro il y a 3 min**, avec un âge calculé depuis la fin du
cycle. Les messages de défaut et d’état non vérifié restent prioritaires.
L’activation et les paramètres se gèrent dans Vision, dans **Configuration →
Plugins → Synchronisation AdGuard**. Le rendu existant est compatible ; aucune
mise à jour native de Shizune n’est nécessaire pour cette tuile.
