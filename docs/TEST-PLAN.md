# Plan de validation iPhone

Les tests Python Agent couvrent l’appairage, le refus d’authentification,
l’expiration, la révocation, l’enregistrement APNs, l’isolation des routes,
la réponse structurée et l’absence de double exécution.

Les tests Xcode couvrent le décodage des contrats synthétiques et la persistance
de la session épinglée. Avant une première diffusion TestFlight, exécuter aussi
sur un véritable iPhone :

1. association locale et via WireGuard ;
2. certificat Konoha incorrect ;
3. session révoquée et expirée ;
4. états sain, dégradé et critique ;
5. autorisation, refus et report ;
6. réponse concurrente depuis Vision ;
7. fermeture complète de Shizune puis réception APNs ;
8. Home Assistant arrêté pendant une notification ;
9. Internet/APNs indisponible puis synchronisation manuelle ;
10. vérification qu’aucune route système n’est joignable avec le jeton compagnon.
