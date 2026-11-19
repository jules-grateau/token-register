# Décisions métier

Registre des choix métier de **token-register**, tous **confirmés par le responsable produit**.
C'est la référence pour le développement : ce qui est écrit ici s'applique, et ce qui n'y est pas
doit être demandé avant d'être implémenté (voir `.claude/agents/developpeur.md`).

## Règles du registre

- Une entrée = une décision confirmée. On n'ajoute rien qui n'a pas été validé.
- On ne réécrit pas une décision : si elle change, on ajoute une nouvelle entrée qui la remplace
  et on passe l'ancienne au statut `Remplacée par D-XXX`.
- La décision est ajoutée dans le même commit que le code qui l'applique.

## Format d'une entrée

```markdown
### D-001 — Titre court de la décision

- **Date** : AAAA-MM-JJ
- **Confirmée par** : qui a validé la décision
- **Statut** : Active | Remplacée par D-XXX
- **Domaine** : Prix & jetons | Commandes | Catalogue | Remises | Accès | Autre
- **Contexte** : la question qui se posait, et pourquoi.
- **Décision** : ce qui a été décidé, formulé comme une règle vérifiable.
- **Options écartées** : les autres options envisagées, en une ligne chacune.
- **Impact** : fichiers / features concernés (PR ou spec liée si utile).
```

## Décisions

### D-001 — Format du numéro de version et version de départ

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : l'appli n'avait pas de numéro de version maintenu ; il faut en afficher un.
- **Décision** : la version suit le format `MAJOR.MINOR.PATCH` (ex. `1.2.3`). La première version est `1.0.0`.
- **Options écartées** : version par date (`2026.11.19`) ; simple compteur (`v14`) ; départ en `0.1.0`.
- **Impact** : `package.json` (racine et workspaces), README > Versioning.

### D-002 — Incrément manuel de la version à chaque mise en prod

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut décider qui monte le numéro et quand.
- **Décision** : la version est montée à la main dans la PR `develop` → `main`, par le développeur sur demande. La CI fait échouer la PR vers `main` si la version n'est pas supérieure à celle de `main`.
- **Options écartées** : incrément automatique déduit des titres de commits ; +1 automatique sur le dernier chiffre à chaque merge sur `main`.
- **Impact** : `.github/workflows/ci-cd.yml` (job `version-check`), `scripts/ci/version-bumped.sh`.

### D-003 — Affichage de la version en prod et en démo

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut décider quelles informations montrer selon l'instance.
- **Décision** : en prod, on affiche seulement « Version x.y.z ». En démo, on affiche la version, le code court du commit et un badge « Démo ». En local, un badge « Développement » s'affiche. Une information absente n'est jamais affichée.
- **Options écartées** : version + commit + date de build partout ; version seule partout.
- **Impact** : `client/src/config/version.ts`, `client/src/components/AboutModal`.

### D-004 — Marquage de chaque version mise en prod

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut pouvoir retrouver chaque version livrée et revenir en arrière.
- **Décision** : à chaque mise en prod, la CI crée le tag git `v<version>` et une Release GitHub dont les notes sont générées depuis les PR, et tague l'image Docker `:<version>`. La CI échoue si ce tag existe déjà, c'est-à-dire si la version n'a pas été montée.
- **Options écartées** : tag git seul ; `CHANGELOG.md` écrit à la main ; aucun marquage.
- **Impact** : `.github/workflows/ci-cd.yml` (jobs `build` et `release`).

### D-005 — Version visible par tous les utilisateurs

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Accès
- **Contexte** : il faut décider si l'accès au numéro de version est restreint.
- **Décision** : l'écran « À propos » et la version sont accessibles à tous les utilisateurs de la caisse.
- **Options écartées** : réserver l'accès à certains utilisateurs.
- **Impact** : `client/src/components/Register`.

### D-006 — Emplacement de la version : « À propos » dans le menu ⚙️

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active, précisée par D-007
- **Domaine** : Autre
- **Contexte** : il faut décider où l'utilisateur trouve la version (proposition du designer).
- **Décision** : le menu ⚙️ contient un item « À propos » qui ouvre une modale avec le nom de l'appli, la version (cf. D-003) et un bouton « Copier les infos ». Ouvrir cette modale ne touche pas au panier.
- **Options écartées** :
  - ligne discrète « Token Register v1.0.0 » en bas du menu ⚙️, sans modale (1 clic, mais peu lisible sur tablette et rien à copier) ;
  - les deux à la fois (entrée « À propos » + ligne en bas du menu).
- **Impact** : `client/src/components/Register`, `client/src/components/AboutModal`, `client/src/locales`.

### D-007 — Pas de bouton de copie dans « À propos »

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : le bouton « Copier les infos » venait de la proposition du designer reprise dans D-006, sans avoir été validé explicitement par l'utilisateur.
- **Décision** : la modale « À propos » n'affiche que les infos et un bouton « Fermer », en démo comme en prod.
- **Options écartées** : bouton « Copier les infos » partout ; bouton seulement en démo.
- **Impact** : `client/src/components/AboutModal`, `client/src/config/version.ts`, `client/src/locales`.

### D-008 — La monnaie est un réglage de l'instance, visible en lecture seule

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : un nouveau client travaille en euros au lieu de jetons ; il faut décider où se règle la monnaie et qui peut la changer.
- **Décision** : la monnaie est fixée par la configuration de l'instance (variable d'environnement `CURRENCY` = `TOKEN` par défaut, ou `EUR`), transmise au client par `/config.js`. Elle n'est pas modifiable dans l'appli. Le menu ⚙️ affiche une entrée non cliquable « Monnaie : Euros (€) » ou « Monnaie : Jetons », avec une icône cadenas et la mention « Définie par la configuration de l'instance ».
- **Options écartées** : réglage modifiable dans l'appli (n'importe quel caissier pourrait le changer, l'accès étant unique, et cela dépassait le délai).
- **Impact** : `api/src/utils/currency.ts`, `api/src/server.ts`, `client/src/config/currency.ts`, `client/src/components/Register`, `deploy/README.md`.

### D-009 — Changement de monnaie : interdit par défaut, conversion par commande admin explicite

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : passer une instance qui contient déjà des prix et des commandes d'une monnaie à l'autre ferait lire « 3 jetons » comme « 0,03 € », ou l'inverse.
- **Décision** : l'instance enregistre sa monnaie au premier démarrage et refuse de démarrer si la configuration indique une autre monnaie, avec un message qui renvoie à la commande de correction. Un changement de configuration accidentel ne convertit jamais rien. Pour changer réellement de monnaie, une commande admin lancée volontairement (`prod:db:convert-currency`, documentée dans `deploy/README.md`) convertit 1 pour 1 les prix des produits **et** l'historique des commandes, puis enregistre la nouvelle monnaie. Jetons → euros : 3 → 3,00 €. Euros → jetons : arrondi au jeton le plus proche, le .5 étant arrondi vers le haut en valeur absolue (1,50 € → 2, 1,49 € → 1, -1,50 € → -2). La commande affiche d'abord un aperçu (par défaut, sans rien écrire) et n'applique qu'avec `--apply`, dans une transaction, en rappelant de faire une sauvegarde.
- **Options écartées** : conversion automatique au redémarrage ; refus de convertir s'il y a des commandes ; arrondi supérieur ; arrondi inférieur.
- **Impact** : `api/src/db/currency.ts`, `api/src/db/scripts/migrateDb.ts`, `api/src/db/scripts/convertCurrency.ts`, `MIGRATIONS.md`, `deploy/README.md`.

### D-010 — Euros au centime, saisie trop précise refusée, remise en % au centime supérieur

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Remises
- **Contexte** : les euros introduisent des montants à virgule ; il faut fixer la précision et l'arrondi des remises.
- **Décision** : en euros, les montants ont 2 décimales. Une saisie plus précise (ex. 1,555) est refusée avec un message, côté client et côté API (les montants doivent être un nombre entier de centimes). Une remise en pourcentage est arrondie au centime supérieur, en faveur du client (15 % de 2,50 € = 0,38 €). Une remise fixe peut comporter des centimes (0,50 €). Le pourcentage reste un entier de 1 à 100.
- **Options écartées** : arrondir silencieusement la saisie ; remise en pourcentage arrondie au centime le plus proche ou inférieur.
- **Impact** : `client/src/utils/currency.ts`, `client/src/components/DiscountModal`, `client/src/components/ProductManagement/ProductFormModal.tsx`, `api/src/controllers/product.controller.ts`, `api/src/services/order.service.ts`.

### D-011 — Montants en euros toujours au format français

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : il faut fixer l'affichage des montants en euros, l'interface existant en français et en anglais.
- **Décision** : les montants en euros s'affichent toujours au format français, centimes compris, avec un espace insécable avant le symbole (« 1,50 € », « 2,00 € », « -1,00 € »), même quand l'interface est en anglais. Les jetons gardent leur affichage actuel (« 3 Jetons »).
- **Options écartées** : format selon la langue (« €1.50 » en anglais) ; centimes affichés seulement s'ils sont non nuls.
- **Impact** : `client/src/utils/currency.ts` (`formatAmount`), tous les écrans qui affichent un montant.

### D-012 — Pas de jetons à virgule

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : l'arrivée des centimes pose la question des fractions de jeton.
- **Décision** : les jetons restent des nombres entiers. Rien ne change pour les instances en jetons.
- **Options écartées** : autoriser les jetons à virgule.
- **Impact** : validations de saisie (client) et contrôle « nombre entier » (API).

### D-013 — Prix négatifs (consigne) autorisés à la saisie, quelle que soit la monnaie

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : le formulaire produit refusait les prix négatifs ; une consigne (« Retour Eco-cup ») ne pouvait exister que si elle était préinstallée.
- **Décision** : le formulaire produit accepte un prix négatif, pour toutes les monnaies, y compris sur les instances en jetons existantes. Un produit à prix négatif ne peut toujours pas recevoir de remise.
- **Options écartées** : garder l'interdiction des prix négatifs à la saisie.
- **Impact** : `client/src/components/ProductManagement/ProductFormModal.tsx`.

### D-014 — Catalogue vide pour une nouvelle instance en euros

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : une base vide reçoit un catalogue d'exemple dont les prix sont en jetons.
- **Décision** : une nouvelle instance en euros démarre avec un catalogue vide. Les instances en jetons gardent le catalogue d'exemple actuel.
- **Options écartées** : même catalogue d'exemple avec les mêmes chiffres en euros ; catalogue réel du client.
- **Impact** : `api/src/db/scripts/initDb.ts`.

### D-015 — Le nom « Token Register » est conservé

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : le nom de l'appli évoque les jetons alors qu'une instance peut être en euros.
- **Décision** : on garde « Token Register » (en-tête et « À propos ») ; seuls les libellés de prix dépendent de la monnaie. Une refonte de l'identité (logo, nom, direction artistique) est prévue plus tard.
- **Options écartées** : changer le nom affiché pour les instances en euros.
- **Impact** : aucun changement de code ; libellés de prix dans `client/src/locales`.
