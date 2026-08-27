# Architecture de Shizune

## Rôle

Shizune est une PWA de consultation et de décision limitée. Elle présente une
synthèse destinée à l’utilisateur, sans devenir un panneau d’administration.

```text
Shikamaru -> Tsunade -> demande durable -> Shizune PWA
                                      réponse structurée |
                                                         v
                              Agent valide -> exécute -> Shikamaru vérifie
                                                         |
                                                         v
                                                   nouvel état synthétique
```

## Périmètre autorisé

Le futur listener compagnon ne doit exposer que :

- l’association d’une PWA ;
- la santé synthétique de Konoha ;
- les demandes Tsunade encore ouvertes ;
- l’activité récente bornée ;
- les réponses structurées aux demandes ;
- la révocation de la session.

Il ne doit pas exposer les contrats de configuration, les jobs, les
investigations libres, les journaux complets, les sauvegardes, les opérations
système ou les équipements.

## Session et navigateur

Le protocole d’association devra utiliser un code court à comparer dans Vision,
une approbation explicite, une expiration et une remise unique du secret. Le
secret de session devra être protégé par les mécanismes adaptés au navigateur
et ne devra jamais être écrit dans les données de démonstration, les logs ou
les URLs.

La PWA fonctionne d’abord sur le réseau local ou via WireGuard. HTTPS est
requis pour le déploiement réel. Le service worker ne met en cache que les
ressources statiques de l’interface ; les réponses API privées ne doivent pas
être placées dans le cache public.

## Notifications

La Beta ne met pas encore en œuvre de notifications. Lorsqu’elles seront
ajoutées, elles devront rester informatives : la notification ne sera jamais la
source de vérité et la demande durable restera consultable auprès d’Agent.
