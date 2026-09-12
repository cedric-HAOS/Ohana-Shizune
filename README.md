# Shizune

Shizune est la PWA compagnon personnelle de Konoha. Elle donne une vue courte
et lisible de l’état de l’infrastructure, des décisions en attente de Tsunade
et de l’activité récente.

La Beta se connecte au contrat compagnon de Tsunade par une passerelle bornée
de même origine dans Vision. Agent reste le seul point de validation et
d’exécution.

## Développement de l’interface

Depuis la racine du dépôt :

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory Shizune/PWA
```

Ouvrir ensuite <http://127.0.0.1:8000> dans un navigateur moderne. Ce mode
permet de vérifier l’interface. Sur Infra-01, Shizune utilise le même serveur
HTTP que Vision et reste limitée au Wi-Fi de confiance ou à WireGuard.

La PWA peut ensuite être installée depuis le menu du navigateur lorsqu’il
propose « Installer Shizune » ou « Ajouter à l’écran d’accueil ».

## Contenu de la Beta

- état général de Konoha : stable, dégradé ou critique ;
- synthèse et décisions réelles fournies par Tsunade ;
- activité récente synthétique ;
- liste des incidents critiques ;
- navigation L’essentiel, Activité, Décisions et Profil ;
- icône officielle Ohana ;
- association contrôlée depuis Vision avec code et empreinte TLS ;
- jeton compagnon conservé dans IndexedDB sur l’iPhone ;
- fonctionnement hors ligne des seules ressources statiques.

En HTTP, Safari n’active pas le service worker : l’icône d’écran d’accueil reste
utilisable, mais les ressources ne sont pas garanties hors ligne.

Les réponses Autoriser, Refuser et Plus tard sont transmises à Tsunade sous
forme structurée. Aucun texte libre ni accès d’administration n’est relayé.

## Organisation

```text
Shizune/
└── PWA/
    ├── index.html
    ├── app.js
    ├── styles.css
    ├── manifest.webmanifest
    ├── sw.js
    ├── icon.svg
    └── tsunade.png
```

## Principes de sécurité

Shizune ne remplace pas Ohana-Vision et ne possède pas de route d’exécution
directe. Le flux conserve les responsabilités existantes :
Tsunade orchestre, Agent valide et exécute, puis Shikamaru vérifie.

La PWA ne doit recevoir que des données synthétiques : santé de Konoha,
demandes Tsunade, activité bornée et réponses structurées. Elle ne doit jamais
recevoir de journaux complets, de contrats
d’administration, de secrets Agent/Vision ou d’accès direct aux équipements.

Le déploiement HTTP suppose explicitement un réseau de confiance : Wi-Fi
domestique ou accès WireGuard. Le jeton compagnon n’est pas chiffré par le
navigateur au repos ; il reste révocable depuis Vision et n’est jamais placé
dans une URL, un journal ou le cache applicatif.

## Parcours d’association

1. ouvrir **Profil** dans Shizune et choisir **Associer cet iPhone** ;
2. ouvrir **Configuration → Compagnons** dans Vision ;
3. comparer le code et l’empreinte TLS ;
4. approuver la demande ;
5. revenir dans Shizune et confirmer l’approbation.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/TEST-PLAN.md](docs/TEST-PLAN.md) et [docs/PWA.md](docs/PWA.md).

## Investigations complémentaires (0.3.0)

Avec Agent 1.27.0, Tsunade peut proposer une collecte complémentaire bornée.
La demande précise son périmètre et permet de l’autoriser, la refuser ou la
reporter. La fiche incident suit ensuite la collecte Katsuyu et la réévaluation.

## L’essentiel (0.2.3)

L’accueil présente l’incident prioritaire et regroupe les autres sujets. La fiche
d’un incident distingue le constat, la conclusion datée et la prochaine étape.
« Lancer le diagnostic » transmet une demande bornée à Tsunade via Vision ;
« Voir le dossier » ouvre l’incident dans Vision sans jeton dans l’URL.
Les réparations restent soumises aux autorisations existantes.

La synthèse nécessite Agent 1.26.16 et Vision 1.22.13. Elle s’actualise toutes
les 30 secondes lorsque la page est visible, sans interrompre une action.
Cette release concerne uniquement la PWA, distribuée en archive statique.
