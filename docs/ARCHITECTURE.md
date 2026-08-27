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

Le listener compagnon expose uniquement :

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

Le protocole d’association utilise un code court à comparer dans Vision,
une approbation explicite, une expiration et une remise unique du secret. Le
secret de session devra être protégé par les mécanismes adaptés au navigateur
et ne devra jamais être écrit dans les données de démonstration, les logs ou
les URLs.

La PWA appelle une passerelle de même origine fournie par Vision. Cette
passerelle ne conserve aucun secret et ne relaie que le contrat synthétique du
listener compagnon Agent/Tsunade. Vision vérifie le certificat privé d’Agent à
l’aide de la CA provisionnée par Installer. Le jeton compagnon reste dans
IndexedDB sur l’iPhone et n’est transmis qu’en en-tête d’authentification.

Le lien iPhone vers Vision fonctionne en HTTP dans le périmètre de confiance
retenu : Wi-Fi domestique ou WireGuard. Ce choix ne fournit pas de chiffrement
applicatif du jeton au repos et suppose que le LAN et ses équipements sont
maîtrisés. La session reste révocable depuis Vision.

Lorsqu’un contexte sécurisé est disponible, le service worker ne met en cache
que les ressources statiques. En HTTP, il n’est pas enregistré. Les réponses
`/api/` restent systématiquement en mode réseau et `no-store`.

## Notifications

La Beta ne met pas encore en œuvre de notifications. Lorsqu’elles seront
ajoutées, elles devront rester informatives : la notification ne sera jamais la
source de vérité et la demande durable restera consultable auprès d’Agent.
