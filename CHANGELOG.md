# Changelog

Toutes les évolutions importantes d’Ohana-Shizune sont documentées ici.

## [0.1.0] — Première application compagnon — 2026-08-24

### Ajouté

- état synthétique de Konoha, demandes Tsunade et activité récente bornée ;
- association explicite par code et comparaison d’empreinte TLS dans Vision ;
- session révocable conservée dans le trousseau sécurisé de l’iPhone ;
- réponses transmises exclusivement à Tsunade via Agent ;
- notifications APNs natives facultatives, indépendantes de Home Assistant ;
- identité visuelle Ohana, manifeste de confidentialité et préparation TestFlight.

### Sécurité

- aucune route directe vers Katsuyu, Home Assistant ou les équipements ;
- HTTPS obligatoire et autorité Konoha épinglée après validation utilisateur ;
- aucune donnée brute de Vision ni aucun journal complet reçu par l’application.
