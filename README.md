# Ohana-Shizune

Shizune est l’application compagnon personnelle de Konoha. Elle répond à trois
questions : l’infrastructure est-elle saine, Tsunade attend-elle une décision,
et que s’est-il passé récemment ?

Elle ne remplace pas Ohana-Vision et ne possède aucun accès direct aux services,
à Katsuyu ou aux équipements. Toute réponse revient à Tsunade ; Agent applique
ensuite la même liste d’autorisations et la même protection contre les actions
concurrentes que pour Vision.

## MVP

- accueil synthétique `SAIN`, `DÉGRADÉ` ou `CRITIQUE` ;
- demandes Tsunade et réponses structurées ;
- activité récente bornée ;
- association explicite par code court ;
- secret conservé dans le trousseau iOS ;
- HTTPS avec empreinte de l’autorité Konoha ;
- notifications natives APNs, indépendantes de Home Assistant ;
- fonctionnement local ou à distance via WireGuard.

## Ouvrir le projet

Le projet est décrit par `project.yml` afin d’éviter un fichier Xcode généré et
fragile. Sur un Mac équipé de Xcode et de XcodeGen :

```bash
brew install xcodegen
xcodegen generate
open OhanaShizune.xcodeproj
```

Sélectionner ensuite l’équipe Apple Developer et activer l’App ID
`fr.ohana.Shizune` avec la capacité Push Notifications. L’installation finale
sera distribuée par TestFlight ; l’utilisateur n’aura pas besoin de Xcode.

La compilation continue vérifie le projet sur un simulateur iOS. Le workflow
manuel TestFlight et les secrets Apple nécessaires sont décrits dans
[`docs/TESTFLIGHT.md`](docs/TESTFLIGHT.md).

## Notifications

Agent communique directement avec APNs. La clé Apple `.p8` reste uniquement sur
INFRA-01. Shizune transmet son jeton APNs après l’association ; ce jeton est lié
à la session compagnon révocable. Une panne d’APNs ou d’Internet ne bloque
jamais Agent, Tsunade, les réparations ou les sauvegardes : la demande demeure
consultable dans l’application lors de sa prochaine synchronisation.
