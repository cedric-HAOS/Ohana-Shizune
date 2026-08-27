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
4. vérifier que l’association fonctionne sur le réseau HTTP de confiance ;
5. recharger la page et vérifier que les ressources se chargent ;
6. vérifier l’absence d’erreur dans la console.

## Connexion Tsunade

- association locale et via WireGuard ;
- certificat ou autorité Konoha incorrect ;
- session expirée et révoquée ;
- états sain, dégradé et critique ;
- demandes expirées, reportées et déjà traitées ;
- réponse concurrente depuis Vision ;
- Konoha indisponible puis resynchronisation ;
- service worker sans mise en cache des réponses privées ;
- absence d’enregistrement du service worker en HTTP ;
- aucune route système accessible avec la session compagnon.

Le parcours nominal attendu est : création de la demande dans Shizune,
comparaison du code et de l’empreinte dans Vision, approbation, remise unique du
jeton, chargement de la synthèse, puis réponse structurée à une demande.
