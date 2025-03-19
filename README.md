# Outils divers internes à Custy

- Recherche dans la charte de programmation du Sharepoint de l'équipe Windev.
  - Recherche par mots clés
  - Actualisation de la liste en temps réel en récupérant les données depuis la feuille Excel contenant toutes les données
- Création d'issues de réintégration avec un compte Gitlab (OAuth).
  - Sauvegarde des issues récentes
  - Possibilité de créer des issues de réintégration sur toutes les versions en cours (Dev + dernière version de production) et sur plusieurs des dernières versions d'Adhoc pour correctifs
  - Aperçu en temps réel des actions qui seront effectuées
  - Gestion automatique du "coller" au format "_[périmètre] - titre_" dans la zone de saisie "périmètre"

## Projet

- `.github` : scripts de déploiements Github Actions
- `dist` : répertoire contenant le bundle de l'application
- `docker` : configuration Docker pour l'environnement de développement
- `scripts` : script pour la mise à jour automatique des variables d'environnement lors du déploiement
- `src/app` : répertoire contenant le code source de l'application

### Angular

Le projet utilise [Angular](https://angular.dev/) en version 19. Les différents composants / services sont standalone, ce qui permet de faciliter la réutilisabilité. Utilisation de `@angular/router` pour la navigation entre les pages définies dans `app.routes.ts`. Tous les composants sont écrits en `typescript (.ts)` pour garantir une meilleure gestion du typage.

### CSS et styles

Les styles sont majoritairement basés sur [Tailwind CSS](https://tailwindcss.com/). Certains styles plus complexes comme le chargement sur la page `charte-programmation` sont gérés en SCSS dans `src/sass/styles.scss`.

### Sharepoint / Office 365

La connexion au Sharepoint Custy est entièrement géré par OAuth2 grâce aux packages npm [@azure/msal-angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) et [@azure/msal-browser](https://www.npmjs.com/package/%40azure/msal-browser). La gestion de la connexion est gérée dans le service `auth.service.ts` et l'accès aux données est effectuée dans le service `microsoft-graph.service.ts`.

### Gitlab

La connexion à Gitlab est gérée par OAuth2 PKCS selon la [documentation Gitlab](https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-with-proof-key-for-code-exchange-pkce). La connexion est gérée dans le service `gitlab-auth.service.ts` et l'accès aux données est effectuée dans le service `gitlab.service.ts`. Les différentes variables nécessaires à la connexion à l'API (client_id, etc.) sont définies dans les fichiers `environment.ts` (ou `environment.development.ts` pour le développement) ([documentation Angular](https://angular.dev/tools/cli/environments))

### Déploiement

Le déploiement se fait sur Firebase (compte personnel) de manière automatisée avec des Github Actions. Les scripts de déploiement sont dans le répertoire `.github`. Un script additionnel est utilisé pour générer le fichier `environment.ts` à partir des variables d'environnement définies dans Github. Ce fichier se trouve dans le répertoire `/scripts`.

## Installation en local

### Installation d'une instance personnelle Gitlab

Pour faciliter les tests et ne pas tout casser, il est possible de déployer une instance personnelle de Gitlab sur Docker. Pour ce faire, il suffit de lancer la commande suivante. Le script docker est disponible dans le répertoire `/docker`.

Une fois lancé, il faudra y accéder depuis l'url `http://localhost:8929`. Il se peut que Gitlab ne demande pas la création d'un compte administrateur. Il faudra alors le réinitialiser en suivant les indications dans le fichier `/docker/notes.txt`. Ces commandes peuvent être directement exécutées dans le docker avec `docker exec`.

(Optionnel) : Il est possible de créer un compte utilisateur autre que le compte développeur pour tester des appels API avec un compte "non-admin".

Pour copier la structure du Gitlab Custy, il faudra créer 2 projets et une issue de base :

- `Suivi général` : contiendra toutes les issues avec les développements à faire
  - Issue `Corrections diverses` : issue (projet) qui listera toutes les réintégrations liées à aucun projet
- `Issues de réintégration` : contiendra la liste des issues de réintégration

Depuis son compte utilisateur, il est nécessaire de créer une nouvelle `Application` (îcone du compte > Preferences > Applications) qui servira à faire les appels API. Il faut ensuite récuéprer `Application ID` pour la suite. Il est également nécessaire de paramétrer autant de `Callback URL` que nécessaire. Cette liste permet de définir quels URLs seront acceptés par Gitlab pour effectuer une connexion à l'API.

Une fois le paramétrage de l'instance Gitlab effectuée. Il faut récupérer les différentes variables énoncées dans le fichier suivant et les mettre à jour dans le fichier `environment.development.ts` :

Exemple de fichier `environment.development.ts` :

```typescript
export const environment = {
  GITLAB_APP_BASE_URI: "http://http://localhost:8929", //URL du gitlab
  GITLAB_APP_ID: "app_id", //application ID
  GITLAB_ID_PROJET_REINTEGRATION: 999, //id projet pour les issues de réintégration
  GITLAB_ID_PROJET_SUIVI_GENERAL: 999, //id projet pour les issues de suivi général
  GITLAB_ID_PROJET_CORRECTIONS_DIVERSES: 999, //id du projet pour les corrections diverses

  //ms secrets
  MS_CLIENT_ID: "abc-def-ghi", //id client pour authentifier l'application Entra
  MS_DRIVE_ID: "abc-def-ghi", //id du stockage Sharepoint
  MS_SITE_ID: "abc-def-ghi", //id du site Sharepoint
  MS_TENANT_ID: "abc-def-ghi", //id du Tenant concerné par l'application
  MS_WORKBOOK_ID: "ABCDEF123", //id de la feuille Excel de la charte de programmation sur le Sharepoint

  MS_WORKSHEET_LINK: "https://example.com", //lien vers la charte de programmation Excel
};
```

Finalement, pour commencer le débug de l'application, il faut exécuter la commande suivante depuis le répertoire racine du projet :

```bash
npm run start
```

Cette commande va lancer le serveur de développement et il faudra ouvrir un navigateur et aller sur l'adresse http://localhost:4200/.

Thomas Eyermann @ Custy - 2024
