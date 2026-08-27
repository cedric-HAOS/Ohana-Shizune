# Shizune

Shizune est la PWA compagnon personnelle de Konoha. Elle donne une vue courte
et lisible de l’état de l’infrastructure, des décisions en attente de Tsunade
et de l’activité récente.

La Beta actuelle est une interface autonome avec données de démonstration. Elle
valide l’expérience mobile et la hiérarchie de l’information avant le
branchement du listener Shizune réel.

## Démarrer la Beta

Depuis la racine du dépôt :

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory Shizune/PWA
```

Ouvrir ensuite <http://127.0.0.1:8000> dans un navigateur moderne. Le serveur
HTTP local est nécessaire pour que le manifest et le service worker soient
traités correctement.

La PWA peut ensuite être installée depuis le menu du navigateur lorsqu’il
propose « Installer Shizune » ou « Ajouter à l’écran d’accueil ».

## Contenu de la Beta

- état général de Konoha : stable, dégradé ou critique ;
- carte Tsunade avec rapport et décision requise ;
- activité récente synthétique ;
- liste des incidents critiques ;
- navigation Accueil, Activité, Décisions et Profil ;
- icône officielle Ohana ;
- fonctionnement hors ligne des ressources de l’interface après une première
  ouverture.

Les actions de la Beta modifient uniquement l’état visuel local. Elles ne
transmettent encore aucune réponse à Konoha.

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
directe. Le futur flux devra conserver les responsabilités existantes :
Tsunade orchestre, Agent valide et exécute, puis Shikamaru vérifie.

La PWA ne doit recevoir que des données synthétiques : santé de Konoha,
demandes Tsunade, activité bornée et réponses structurées. Elle ne doit jamais
recevoir de journaux complets, de contrats d’administration, de secrets
Agent/Vision ou d’accès direct aux équipements.

## Suite prévue

1. valider visuellement la Beta sur mobile ;
2. définir le contrat HTTP PWA du listener Shizune ;
3. implémenter l’association et la session côté navigateur ;
4. remplacer les données de démonstration par la lecture de l’état réel ;
5. connecter les réponses structurées de Tsunade avec confirmation explicite ;
6. ajouter les tests de sécurité et de régression du parcours complet.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/TEST-PLAN.md](docs/TEST-PLAN.md) et [docs/PWA.md](docs/PWA.md).
