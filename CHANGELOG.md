# Changelog

Toutes les évolutions importantes d’Ohana-Shizune sont documentées ici.

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
