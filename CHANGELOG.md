# Changelog

## Non publié

- Nouvel accueil, dans cet ordre : l'état de Konoha avec les icônes de Vision
  (« Konoha : stable / dégradé / critique », décisions en attente et sujets
  suivis) ; **Services essentiels** (DNS avec sa durée de réponse, DHCP, MQTT,
  Home Assistant, Z-Wave, Téléinformation, chacun avec son icône d'état) ;
  **Journaux par équipement** (INFRA-01, LINKY-01, ZWAVE-01, HA-01 : attente de
  décision, analyse en cours, à examiner, bruit connu, OK ; date du dernier
  contrôle ; un appui ouvre la fiche de l'incident) ; **Prévention**. Les
  autres incidents restent accessibles par « Voir tous les sujets suivis ».
  Requiert Ohana-Agent qui publie `services` et `logs` ; sans eux, ces blocs
  n'apparaissent pas.
- L'écran « Connexion indisponible » indique l'heure de la dernière
  synchronisation réussie.
- Après une réponse, un message confirme l'envoi (autorisation, refus, report) ;
  une demande reportée indique quand Tsunade la représentera.
- « Décisions récentes » (24 h) : ce que vous avez répondu et l'issue publiée
  par Tsunade (réparation faite, échec…), ou « Exécution en cours ». Requiert
  Ohana-Vision avec le relais `/api/shizune/requests/recent`.

## [0.4.0] — 2026-09-28 — Prévention

- L’essentiel affiche une carte « Prévention » : les dérives que Tsunade
  demande de surveiller (disque, redémarrages, coupures réseau) et sa
  conclusion, par exemple « Aucune intervention nécessaire. ». Les règles et
  leurs preuves restent dans Vision. Requiert Ohana-Agent 1.39.0 ; sans
  synthèse préventive, la carte n’apparaît pas.

## [0.3.0] — 2026-09-12 — Autoriser les investigations complémentaires

- Les demandes de collecte complémentaire portent un titre dédié ; la fiche
  incident donne accès à l’autorisation et affiche l’état de la collecte puis
  de sa réévaluation. Le canal de réponse existant est conservé.

## [0.2.3] — 2026-09-11 — L’essentiel et les prochaines étapes

- L’accueil présente le problème prioritaire et une synthèse des autres sujets.
- Chaque incident dispose d’une fiche : constat, conclusion datée, prochaine
  étape, demande de diagnostic et accès au dossier Vision.
- Les autorisations attendues sont distinctes des incidents actifs ; le contrôle
  réussi ne devient plus un faux « Konoha : OK ».
- Actualisation périodique lorsque la page est visible, sans interrompre une
  réponse ou une demande de diagnostic.

Toutes les évolutions importantes d’Ohana-Shizune sont documentées ici.

## [0.2.2] — Compagnon mobile recentré — 2026-08-27

### Corrigé

- retrait des commandes d’investigation, peu adaptées à une utilisation depuis
  l’iPhone ;
- maintien de la santé synthétique, de l’activité et des décisions Tsunade sans
  voie d’exécution directe.

## [0.2.1] — Suggestions Tsunade — 2026-08-27

### Ajouté

- affichage des suggestions d'investigation transmises par Tsunade ;
- copie manuelle des commandes en lecture seule, sans exécution depuis Shizune.

### Sécurité

- Shizune ne reçoit pas les hypothèses brutes et ne contourne pas Agent/Tsunade
  pour agir sur l'infrastructure.

## [0.2.0] — Connexion à Tsunade — 2026-08-27

### Ajouté

- association de l’iPhone approuvée depuis Vision ;
- lecture de la santé synthétique, des demandes et de l’activité Tsunade ;
- réponses structurées Autoriser, Refuser et Plus tard ;
- conservation locale du jeton compagnon dans IndexedDB.

### Sécurité

- appels privés de même origine via la passerelle bornée de Vision ;
- exclusion explicite de toutes les réponses `/api/` du cache PWA ;
- mode HTTP limité au Wi-Fi de confiance ou à WireGuard ;
- service worker désactivé automatiquement hors contexte sécurisé.

## [0.1.0] — Beta PWA — 2026-08-27

### Ajouté

- interface PWA mobile inspirée de la maquette Shizune ;
- état synthétique de Konoha, demande Tsunade et activité récente ;
- navigation Accueil, Activité, Décisions et Profil ;
- manifest PWA et service worker pour l’installation et les ressources hors ligne ;
- icône officielle Ohana et portrait de Tsunade de la maquette.

### Sécurité

- la Beta utilise uniquement des données locales de démonstration ;
- aucun accès direct à Katsuyu, Home Assistant ou aux équipements ;
- le futur branchement API devra conserver Agent comme point de validation et d’exécution.
