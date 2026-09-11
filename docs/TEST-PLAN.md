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

## Priorités et diagnostic (0.2.3)

- incident critique présent malgré aucune autorisation en attente ;
- conclusion ancienne avec nouveaux éléments, analyse en cours et surveillance ;
- détail mobile à 390 px, navigation vers tous les équipements et retour ;
- demande de diagnostic acceptée, session absente/révoquée et erreur serveur ;
- aucune confirmation affichée après un échec de transmission ;
- lien du dossier Vision sans jeton, ouverture du bon incident ;
- actualisation visible sans effacer une action ou le formulaire de profil.

Validation locale effectuée sur les fichiers réels avec des données de démonstration :
vue desktop, largeur 390 px et refus d’une demande sans session. Les tests Agent
et Vision couvrent l’authentification et le relais borné. L’association et le
cycle de journaux réels seront à contrôler après déploiement.
