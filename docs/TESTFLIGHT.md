# Distribution TestFlight

Shizune utilise APNs ; la distribution durable sur iPhone nécessite donc un
compte Apple Developer actif et un App ID explicite `fr.ohana.Shizune` avec la
capacité **Push Notifications**.

## Préparer App Store Connect

1. créer l’App ID `fr.ohana.Shizune` et activer Push Notifications ;
2. créer l’application Shizune dans App Store Connect ;
3. créer un certificat Apple Distribution et un profil App Store pour cet App ID ;
4. créer une clé App Store Connect autorisée à téléverser les builds ;
5. renseigner les secrets de l’environnement GitHub `testflight` décrits ci-dessous.

| Secret | Contenu |
| --- | --- |
| `APPLE_TEAM_ID` | identifiant de l’équipe Apple Developer |
| `APPLE_DISTRIBUTION_CERTIFICATE_BASE64` | certificat `.p12` encodé en base64 |
| `APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD` | mot de passe du `.p12` |
| `APPLE_PROVISIONING_PROFILE_BASE64` | profil `.mobileprovision` encodé en base64 |
| `APPLE_BUILD_KEYCHAIN_PASSWORD` | mot de passe aléatoire du trousseau éphémère CI |
| `APP_STORE_CONNECT_KEY_ID` | identifiant de la clé App Store Connect |
| `APP_STORE_CONNECT_ISSUER_ID` | issuer ID App Store Connect |
| `APP_STORE_CONNECT_PRIVATE_KEY_BASE64` | clé App Store Connect `.p8` encodée en base64 |

Le workflow manuel **TestFlight** archive, signe et téléverse l’IPA. Aucun
secret Apple n’est inclus dans le dépôt ni dans une release GitHub.

Cette clé App Store Connect sert uniquement au téléversement du build. Elle est
distincte de la clé APNs utilisée par Agent pour envoyer les notifications.

## Activer les notifications côté Agent

La mise à niveau Installer ajoute le listener Shizune à la configuration
existante, mais laisse APNs désactivé tant que les vrais identifiants ne sont
pas présents. Copier la clé APNs `.p8` sur INFRA-01 avec des permissions root,
puis compléter `administration.companion.push` dans `shikamaru.yaml` :

```yaml
enabled: true
environment: production
team_id: VOTRE_TEAM_ID
key_id: VOTRE_KEY_ID
bundle_id: fr.ohana.Shizune
private_key_file: /etc/ohana-agent/shizune-apns.p8
```
