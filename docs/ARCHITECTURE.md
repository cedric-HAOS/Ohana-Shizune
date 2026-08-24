# Architecture Shizune MVP

```text
Shikamaru -> Tsunade -> demande durable -> Shizune
                                      réponse |
                                              v
                     Agent valide -> exécute -> Shikamaru vérifie
                                              |
                                              v
                                           Shizune
```

## Frontière de sécurité

Shizune utilise un listener HTTPS distinct et limité. Ce listener ne route que :

- l’association d’un compagnon ;
- la santé synthétique de Konoha ;
- les demandes Tsunade ;
- l’activité synthétique ;
- les réponses structurées ;
- l’enregistrement du jeton APNs.

Il ne route jamais les contrats de configuration, jobs, investigations libres,
journaux, sauvegardes ou opérations système. Le jeton d’administration Vision
n’est jamais copié sur l’iPhone.

L’association reprend le mécanisme éprouvé de Katsuyu : secret de sondage,
code court à comparer dans Vision, approbation explicite et remise unique du
jeton. La variante compagnon ajoute expiration, révocation et stockage Keychain.

## Notifications natives

Agent est le fournisseur APNs de Shizune. Il utilise une clé Apple `.p8` et
HTTP/2/TLS, seulement lorsqu’un événement pertinent doit être transmis. Aucune
connexion APNs permanente n’est maintenue au repos. Les événements admis sont :

- `ATTENTION` ;
- `DECISION_REQUIRED` ;
- `CRITICAL` ;
- `RESOLVED` ;
- `INFORMATION` lorsqu’elle présente un intérêt utilisateur explicite.

La notification n’est jamais une source de vérité. La demande durable Tsunade
reste dans Agent jusqu’à sa réponse, son expiration, son annulation ou la
résolution de l’incident.
