# Plan de validation de la PWA

## Beta locale

Depuis la racine du dépôt :

```powershell
node --check Shizune/PWA/app.js
git diff --check
python -m http.server 8000 --bind 127.0.0.1 --directory Shizune/PWA
```

Dans le navigateur :

1. vérifier l’affichage mobile de l’accueil ;
2. vérifier la présence de l’icône officielle et du nom Shizune ;
3. ouvrir Activité, Décisions et Profil ;
4. tester Plus tard, Voir, Refuser et Autoriser ;
5. recharger la page et vérifier que les ressources se chargent ;
6. vérifier l’absence d’erreur dans la console.

## Avant branchement API

- confirmer le schéma JSON des résumés, demandes et activités ;
- confirmer les états et choix autorisés par Tsunade ;
- vérifier qu’aucun payload technique ou secret n’est inclus ;
- définir les erreurs de session expirée, révoquée et indisponible ;
- tester une réponse concurrente et garantir l’idempotence côté Agent.

## Après branchement API

- association locale et via WireGuard ;
- certificat ou autorité Konoha incorrect ;
- session expirée et révoquée ;
- états sain, dégradé et critique ;
- demandes expirées, reportées et déjà traitées ;
- réponse concurrente depuis Vision ;
- Konoha indisponible puis resynchronisation ;
- service worker sans mise en cache des réponses privées ;
- aucune route système accessible avec la session compagnon.
