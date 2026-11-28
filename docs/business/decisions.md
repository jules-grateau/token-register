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
- **Statut** : Active, précisée par D-027
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
- **Statut** : Active, précisée par D-017
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
- **Statut** : Remplacée par D-055
- **Domaine** : Catalogue
- **Contexte** : une base vide reçoit un catalogue d'exemple dont les prix sont en jetons.
- **Décision** : une nouvelle instance en euros démarre avec un catalogue vide. Les instances en jetons gardent le catalogue d'exemple actuel.
- **Options écartées** : même catalogue d'exemple avec les mêmes chiffres en euros ; catalogue réel du client.
- **Impact** : `api/src/db/scripts/initDb.ts`.

### D-015 — Le nom « Token Register » est conservé

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Remplacée par D-039
- **Domaine** : Autre
- **Contexte** : le nom de l'appli évoque les jetons alors qu'une instance peut être en euros.
- **Décision** : on garde « Token Register » (en-tête et « À propos ») ; seuls les libellés de prix dépendent de la monnaie. Une refonte de l'identité (logo, nom, direction artistique) est prévue plus tard.
- **Options écartées** : changer le nom affiché pour les instances en euros.
- **Impact** : aucun changement de code ; libellés de prix dans `client/src/locales`.

### D-016 — Conversion euros → jetons refusée si une remise dépasse le total de sa ligne

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Remises
- **Contexte** : la conversion euros → jetons (D-009) arrondit chaque montant séparément ; une ligne d'historique peut alors avoir une remise supérieure à son total (ex. 2 × 1,49 € avec 2,98 € de remise → 2 × 1 jeton avec 3 jetons de remise).
- **Décision** : si au moins une ligne d'historique se retrouve avec une remise supérieure à son total après arrondi, la conversion est refusée et rien n'est écrit. Les lignes concernées sont listées dans l'aperçu. Pour convertir, l'admin doit d'abord traiter ces commandes.
- **Options écartées** : plafonner la remise au total de la ligne ; arrondir le total de la ligne puis en déduire la remise.
- **Impact** : `api/src/db/currency.ts`, `api/src/db/scripts/convertCurrency.ts`, `deploy/README.md`.

### D-017 — Un collage trop précis est tronqué à 2 décimales

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : en euros, le champ de saisie empêche de taper une 3e décimale ; un collage de « 1,555 » est coupé à « 1,55 » sans message.
- **Décision** : la troncature silencieuse à 2 décimales est acceptée pour un collage dans le champ (le clavier empêche déjà la 3e décimale). Précise D-010, qui reste active : une saisie trop précise reste refusée avec un message par la validation du formulaire et par l'API.
- **Options écartées** : refuser aussi le collage avec un message.
- **Impact** : `client/src/components/ProductManagement/ProductFormModal.tsx`, `client/src/components/DiscountModal` (`NumberInput` avec `decimalScale={2}`).

### D-018 — Téléphone : portrait et paysage pris en charge

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : sur téléphone, le catalogue était quasi inutilisable (catégories et panier occupaient l'écran, scrolls imbriqués). Réponse : « Les deux », avec la remarque « Faudrait juste que ce soit en horizontal forcé, non ? ».
- **Décision** : les deux orientations du téléphone sont prises en charge. En portrait : catégories en rangée horizontale, grille de 2 colonnes, panier replié en barre basse (nombre d'articles, total, « Valider ») qui s'ouvre en tiroir. En paysage : catalogue et panier côte à côte, panier toujours visible. Aucun écran « Tournez votre téléphone ».
- **Options écartées** : paysage obligatoire seul ; portrait seul.
- **Impact** : `client/src/hooks/useLayoutMode.ts`, `client/src/components/Register`, `client/src/components/Catalog`, `client/src/components/Cart`, `docs/design/spacing-layout.md`.

### D-019 — Vider le panier : immédiat, avec « Annuler » pendant 5 s qui fusionne

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, précisée par D-024 et D-025
- **Domaine** : Commandes
- **Contexte** : « Vider le panier » vidait tout en un toucher, sans retour possible ; agrandir le bouton augmente le risque d'erreur.
- **Décision** : le panier est vidé immédiatement, puis un toast « Panier vidé – Annuler » reste 5 s. Si le panier a été modifié pendant ces 5 s, « Annuler » fusionne (réponse : « Fusionner ») : l'ancien panier revient et les produits ajoutés entre-temps restent. Un produit sans remise présent dans les deux paniers voit ses quantités additionnées.
- **Options écartées** : modale de confirmation ; laisser tel quel ; restaurer seulement l'ancien panier ; fermer le toast dès que le panier change.
- **Impact** : `client/src/hooks/useClearCartWithUndo.tsx`, `client/src/redux/cartSlice.tsx` (`restore`), `docs/design/components.md`.

### D-020 — Suppression d'une commande dans l'historique conservée, avec confirmation

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : le bouton « Supprimer » de l'historique était petit et mal placé ; la question de garder la suppression se posait.
- **Décision** : la suppression d'une commande est gardée (réponse : « La garder »), derrière la confirmation existante. Le bouton fait 44 px de haut, en bas de la carte de la commande.
- **Options écartées** : retirer la suppression de l'historique.
- **Impact** : `client/src/components/OrderHistoryModal`, `client/src/components/ConfirmationModal`.

### D-021 — Noms de produits jamais coupés

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : les noms longs étaient coupés après 2 lignes ; deux produits proches pouvaient s'afficher pareil.
- **Décision** : un nom de produit n'est jamais coupé (cartes, lignes de panier, historique) : il passe à la ligne et la carte grandit. Le prix reste toujours visible.
- **Options écartées** : coupés après 2 lignes ; coupés après 3 lignes.
- **Impact** : `client/src/components/Catalog/ProductList/ProductCard`, `client/src/components/Cart/CartItem`, `docs/design/typography.md`.

### D-022 — Mode édition complet sur téléphone, toucher une carte ouvre sa modification

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : en mode édition sur téléphone, les actions des produits étaient invisibles et les catégories tronquées.
- **Décision** : le mode édition est disponible et complet sur téléphone (réponse : « Oui, complètement »). En mode édition, toucher une carte produit ouvre sa modification (réponse : « Ouvre la modification »), en plus des boutons modifier / supprimer.
- **Options écartées** : masquer le mode édition sur téléphone.
- **Impact** : `client/src/components/Catalog`, `client/src/components/Catalog/ProductList/ProductCard`.

### D-023 — Quantité affichée sur chaque ligne de l'historique

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : l'historique affichait le nom et le montant d'une ligne, sans la quantité.
- **Décision** : chaque ligne de l'historique affiche sa quantité devant le nom : « 2 × Bière ».
- **Options écartées** : aucune (réponse : « Oui »).
- **Impact** : `client/src/components/OrderHistoryModal`, `client/src/components/Cart/CartItem` (`showQuantity`).

### D-024 — « Annuler » : les remises d'un même produit s'additionnent

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Remises
- **Contexte** : D-019 ne disait pas ce que devient la remise quand un même produit est dans l'ancien panier et dans le nouveau au moment de « Annuler ».
- **Décision** : on additionne les quantités **et** les montants de remise (réponse : « Additionner »). Exemple : 2 × Bière (-1 €), vider, 1 × Bière (-0,50 €), « Annuler » → 3 × Bière (-1,50 €).
- **Options écartées** : garder la remise de l'ancien panier ; ne pas fusionner ce cas.
- **Impact** : `client/src/redux/cartSlice.tsx` (`restore`), `docs/design/components.md`.

### D-025 — Plus d'annulation du vidage après une vente

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : le toast « Panier vidé – Annuler » pouvait encore être affiché après la validation d'une commande ; « Annuler » aurait remis dans le panier des produits d'avant la vente.
- **Décision** : dès qu'une commande est validée, le toast « Panier vidé – Annuler » se ferme et l'annulation n'est plus possible (réponse : « Fermer le toast à la validation »).
- **Options écartées** : laisser l'annulation possible.
- **Impact** : `client/src/components/CartConfirmationModal`.

### D-026 — Quantité affichée dans le récapitulatif de confirmation

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : la modale de confirmation du panier listait les lignes sans leur quantité ; D-023 l'ajoutait seulement à l'historique.
- **Décision** : le récapitulatif de confirmation affiche aussi « 2 × Bière » sur chaque ligne, comme l'historique (réponse : « Oui »).
- **Options écartées** : le laisser tel quel.
- **Impact** : `client/src/components/CartConfirmationModal`, `client/src/components/Cart/CartItem` (`showQuantity`).

### D-027 — La version est montée dans la PR de la feature

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, précisée par D-042
- **Domaine** : Autre
- **Contexte** : D-002 prévoyait de monter la version dans la PR `develop` → `main`. Comme cette PR part de `develop` et qu'on ne commite jamais directement sur `develop`, il fallait une PR de bump séparée à chaque release (#18, #21).
- **Décision** : la version est montée **dans la PR de la feature** qui partira en prod (réponse : « Bah oui, dans la PR de la feature c'est mieux »). S'il y a plusieurs PR dans une même release, seule la première la monte, sauf si une PR suivante change la catégorie (correctif → nouveauté : PATCH → MINOR) : elle remonte alors la version. Le type de montée (PATCH / MINOR / MAJOR) est demandé au responsable produit pendant la clarification de la feature. Une PR qui ne touche pas l'appli (docs, agents, CI de revue) ne monte pas la version. La règle de D-002 est inchangée sur le reste : montée à la main, et `version-check` fait échouer la PR vers `main` si la version n'est pas supérieure à celle de `main`.
- **Options écartées** : PR de bump séparée vers `develop` avant chaque release ; branche `release/x.y.z` puis report de `main` dans `develop` ; calcul automatique de la version par la CI.
- **Impact** : `README.md` (section Versioning), `.claude/agents/developpeur.md`, `CLAUDE.md`. Conséquence : la démo affiche le nouveau numéro dès le merge de la feature dans `develop`, avant la mise en prod.

### D-028 — Encaissement dans la modale de confirmation, enregistrement dès le toucher

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Remplacée par D-053
- **Domaine** : Commandes
- **Contexte** : l'aide au paiement (mode, montant reçu, monnaie à rendre) devait s'insérer dans la validation d'une commande sans ralentir la caisse. Avant de choisir, l'utilisateur a demandé une comparaison avec d'autres caisses (Shopify POS, Square, Loyverse).
- **Décision** : tout se passe dans la modale de confirmation, qui devient « Encaissement » (réponse : « Enregistrer dès le toucher »). « Carte » et « Appoint » enregistrent la vente immédiatement. S'il y a de la monnaie à rendre, « À rendre » s'affiche en grand, puis on touche « Encaisser ». Un montant tapé au pavé attend toujours « Encaisser », même s'il est égal au total. La modale se ferme par la croix ou Échap, le panier restant intact.
- **Options écartées** : « Toujours confirmer avec « Encaisser » » (Carte et Appoint ne font que sélectionner, puis « Encaisser » : un toucher de plus par vente).
- **Impact** : `client/src/components/CartConfirmationModal`, `docs/design/components.md` (section « Encaissement »).

### D-029 — Montants rapides suggérés selon le total, pavé pour la saisie libre

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, amendée par D-053
- **Domaine** : Prix & jetons
- **Contexte** : il fallait choisir les raccourcis de montant reçu.
- **Décision** : les montants rapides sont suggérés selon le total (réponse : « Suggérés selon le total »), avec l'algorithme `suggestAmounts` de `docs/design/components.md` : « Appoint » plus 4 montants croissants, tous supérieurs au total. Un pavé intégré permet de saisir un montant libre (2 décimales au plus en euros, entiers en jetons).
- **Options écartées** : « Billets fixes + Appoint (5/10/20/50 €) » ; « Les deux (Appoint + suggestions + billets fixes 10/20/50) ».
- **Impact** : `client/src/utils/payment.ts` (`suggestAmounts`, saisie au pavé), `client/src/components/CartConfirmationModal`.

### D-030 — Mode de paiement obligatoire, sans défaut : Espèces ou Carte

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, amendée par D-053
- **Domaine** : Commandes
- **Contexte** : il fallait décider si le mode de paiement est obligatoire, et quels moyens proposer.
- **Décision** : sur une instance en euros, le mode de paiement est obligatoire et n'a pas de valeur par défaut (réponse : « Obligatoire, sans défaut »). Il n'y a que deux moyens, Espèces et Carte (réponse : « Espèces et Carte »). Choisir un montant d'espèces vaut choix « Espèces ». L'API refuse une nouvelle commande en euros sans mode.
- **Options écartées** : « Facultatif (bouton « Enregistrer sans préciser ») » ; « Dernier mode présélectionné ». Pour les moyens : « + « Autre » (chèque, virement, Lydia…) ».
- **Impact** : `api/src/utils/payment.ts`, `api/src/services/order.service.ts`, `client/src/components/CartConfirmationModal`.

### D-031 — Paiement mixte : espèces d'abord, le reste en carte

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Remplacée par D-053
- **Domaine** : Commandes
- **Contexte** : il fallait décider quoi faire quand les espèces reçues sont inférieures au total.
- **Décision** : le paiement mixte espèces + carte est possible (réponse : « Paiement mixte espèces + carte »). Si les espèces reçues sont inférieures au total, l'écran affiche « Il reste X € » et le bouton « Reste en carte (X €) » enregistre la vente. Seule la part en espèces peut donner lieu à un rendu ; la carte est débitée du montant exact. On part toujours des espèces : pas de saisie d'une part carte d'abord (choix du designer).
- **Options écartées** : « « Il manque X € », bloqué (pas de paiement mixte) » ; « Avertir mais laisser passer ».
- **Impact** : `client/src/utils/payment.ts` (`splitCashPayment`), `client/src/components/CartConfirmationModal`, `api/src/utils/payment.ts`.

### D-032 — Total à 0 € ou négatif : le mode est demandé aussi

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, amendée par D-053
- **Domaine** : Commandes
- **Contexte** : avec la consigne (D-013), une commande peut avoir un total nul ou négatif (remboursement).
- **Décision** : le mode est demandé aussi (réponse : « Demander le mode aussi ») : Espèces ou Carte, y compris pour un remboursement. Sans suggestion ni pavé, l'écran affiche « Rien à encaisser » ou « À rendre au client X € », puis les boutons Espèces et Carte qui enregistrent immédiatement. Le mode choisi porte le total (0 ou négatif).
- **Options écartées** : « 0 € : enregistrer sans mode ; négatif : rendre en espèces ».
- **Impact** : `client/src/components/CartConfirmationModal`, `api/src/utils/payment.ts`.

### D-033 — Instances en jetons : aide en jetons, rien d'enregistré

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Remplacée par D-053
- **Domaine** : Prix & jetons
- **Contexte** : D-008 fixe la monnaie par instance ; il fallait décider si l'aide existe aussi en jetons.
- **Décision** : l'aide existe aussi en jetons (réponses : « Aide en jetons aussi », puis « Jetons reçus / à rendre, rien d'enregistré ») : pas de mode de paiement, suggestions et pavé en nombres entiers, « Jetons à rendre ». Si les jetons reçus sont insuffisants, « Il manque X Jetons » et « Encaisser » est désactivé. Rien n'est enregistré en plus de la commande : l'API refuse un paiement envoyé sur une instance en jetons.
- **Options écartées** : « Rien ne change » ; « Mode de paiement seulement » ; puis « Comme les euros (choix du mode et enregistrement par mode) ».
- **Impact** : `client/src/components/CartConfirmationModal`, `api/src/utils/payment.ts`.

### D-034 — Enregistrement du montant par mode, badges dans l'historique

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : il fallait décider ce que la commande conserve du paiement (historique, futur tableau de bord de la spec 003).
- **Décision** : d'abord « Le mode seul », précisé avec le paiement mixte en « Montant par mode ». Une commande en euros garde le montant payé en espèces et le montant payé en carte (colonnes `orders.cash_amount` et `orders.card_amount`, en centimes ; un mode non utilisé reste vide). Leur somme vaut le total. Ni le montant reçu ni la monnaie rendue ne sont enregistrés. Les anciennes commandes restent sans paiement. L'historique affiche un badge par mode avec son montant (« Espèces 5,00 € », « Carte 2,50 € »), et aucun badge pour les anciennes commandes ni en jetons. La suppression d'une commande (D-020) supprime aussi son paiement.
- **Options écartées** : « Rien, juste une aide à l'écran » ; « Le mode + le montant reçu » ; avec le paiement mixte, « Juste « Mixte » (sans les montants) ».
- **Impact** : `shared-ts/index.ts`, `api/src/db/orderPayment.ts`, `api/src/db/scripts/migrateDb.ts`, `api/src/db/scripts/initDb.ts`, `api/src/db/currency.ts`, `api/src/services/order.service.ts`, `client/src/components/OrderHistoryModal`, `MIGRATIONS.md`, `deploy/README.md`.

### D-035 — Commande sans paiement refusée en euros, y compris l'ancien format

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : pendant une mise à jour, un onglet resté ouvert sur une version antérieure à 1.3.0 envoie la commande sans paiement (ancien format : tableau d'articles). La première version de la PR l'acceptait et l'enregistrait sans paiement, ce qui contournait D-030 (relevé en revue, TL-1).
- **Décision** : refuser tout de suite (réponse : « Refuser tout de suite »). Sur une instance en euros, `POST /orders` refuse une commande sans paiement (ancien format ou `payment` absent) avec une erreur 400, un message clair et le code `PAYMENT_REQUIRED`. Le client affiche alors un toast d'erreur qui invite à recharger la page. L'ancien format reste accepté sur les instances en jetons, qui n'enregistrent pas de paiement (D-033).
- **Options écartées** : accepter l'ancien format sans paiement de façon temporaire, jusqu'à la 1.4.0.
- **Impact** : `api/src/utils/payment.ts`, `api/src/services/order.service.ts`, `api/src/controllers/order.controller.ts`, `api/src/types/errors.ts`, `client/src/components/CartConfirmationModal`, `client/src/locales`, `deploy/README.md`, `MIGRATIONS.md`.

### D-036 — Conversion euros → jetons : la répartition espèces / carte est effacée

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : la conversion D-009 arrondit chaque montant séparément ; convertis en jetons, espèces + carte ne feraient plus forcément le total (1,50 € + 1,50 € → 2 + 2 jetons pour un total de 3). La première version de la PR refusait la conversion dans ce cas (relevé en revue, TL-2). L'utilisateur a d'abord demandé : « Et pourquoi pas convertir les 3 €, donc le total ? » ; il lui a été proposé de convertir le total, d'arrondir les espèces et de mettre le reste en carte. Réponse : « Pareil, mais effacer en jetons ».
- **Décision** : la conversion euros → jetons efface `cash_amount` et `card_amount` des commandes converties, puisqu'une instance en jetons n'enregistre pas de paiement (D-033). Les totaux des commandes sont convertis comme d'habitude (D-009). L'aperçu prévient : « N commandes : la répartition espèces / carte sera effacée ». Jetons → euros : il n'y a pas de paiement, rien à faire.
- **Options écartées** : refuser la conversion (code provisoire de la PR) ; convertir et garder les montants ; convertir le total puis en déduire la répartition (somme toujours juste) en la gardant.
- **Impact** : `api/src/db/currency.ts`, `api/src/db/scripts/convertCurrency.ts`, `deploy/README.md`, `MIGRATIONS.md`.

### D-037 — Une PR en cours de travail reste en brouillon

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : une PR sur laquelle un agent travaille encore pouvait être mergée par erreur (cas de #14, mergée pendant une correction, d'où la PR de suite #15).
- **Décision** : demande de l'utilisateur, « Il faudrait que le développeur fasse un truc pour que la PR ne soit pas mergeable s'il travaille dessus, que je ne merge pas par erreur ». Une PR est créée en brouillon et repasse en brouillon avant toute modification. Elle n'est mise en « prête » qu'une fois tout poussé, vert, et les réponses aux revues publiées (et, pour une modification d'interface, les captures validées par le designer). La mise en « prête » déclenche la revue du tech-lead.
- **Options écartées** : aucune autre option présentée (mécanisme natif de GitHub retenu directement) ; un label « WIP » avec un check obligatoire aurait demandé une protection de branche.
- **Impact** : `.claude/agents/developpeur.md`, `CLAUDE.md`.

### D-038 — Réduire le coût en tokens des revues, sans perdre en qualité

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : remarque de l'utilisateur : « ça marche super mais c'est ultra cher en token ». Le designer relisait la même feature jusqu'à 3 fois (PR de feature, PR de release, puis chaque push sur `develop`), en lisant à chaque fois des dizaines de captures en haute résolution. Tous les agents tournaient sur le modèle le plus cher.
- **Décision** :
  - le designer relit une feature **une seule fois, sur la PR de feature**, seulement les écrans touchés, en téléphone portrait et desktop, plus EUR si des montants sont concernés (réponse : « Sur la PR de feature, ciblée ») ;
  - sur les PR de release, un contrôle automatique **sans IA** (`check-report.mjs`) remplace la revue du designer ;
  - les 4 optimisations proposées sont retenues : `designer` et `tech-lead` en Sonnet, captures en résolution ×1, le développeur n'ouvre pas les captures, comptes rendus des agents de 30 lignes maximum.
- **Options écartées** : revue design seulement après le merge, sur la PR de release (problèmes découverts tard, PR de correction puis nouvelle revue complète) ; la même, mais ciblée sur les écrans de la release.
- **Impact** : `.github/workflows/design-review.yml`, `scripts/design-review/check-report.mjs`, `scripts/design-review/capture.mjs`, `.claude/agents/*.md`, `CLAUDE.md`.

### D-039 — Refonte de l'identité : « Caisse Claire »

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active (couleurs remplacées par D-051)
- **Domaine** : Autre
- **Contexte** : D-015 gardait « Token Register » en attendant une refonte de l'identité. Ce nom évoque les jetons alors qu'une instance peut être en euros, et l'appli sert aussi bien la nourriture que la boisson.
- **Décision** : l'appli s'appelle **« Caisse Claire »** (réponse : « Vas pour Caisse Claire »), avec l'accroche « Une caisse simple, claire et nette. ». Direction artistique E : moutarde + encre, police Manrope, logo en ticket de caisse sur un carré moutarde (charte dans `docs/design/`). Parcours de choix :
  - trois directions proposées : A Comptoir, B Tampon, C Tournée ;
  - « J'aime bien le jaune moutarde » : rangée D, sur la base de A ;
  - « J'aime beaucoup tout, sauf le vert » : structure D2, en encre ;
  - les noms Guinguette, Buvette et Tchin sont écartés (« C'est pas forcément pour la buvette, y'a de la nourriture aussi. C'est juste un logiciel de caisse simple ») ;
  - puis cinq noms neutres sont proposés, dont « Caisse Claire ».
- **Options écartées** : garder « Token Register » (D-015) ; directions B Tampon et C Tournée ; noms Guinguette, Buvette, Tchin ; variante verte.
- **Impact** : `docs/design/`, `client/src/assets/brand/`, `client/src/App.tsx` (thème), `client/src/styles/variables.css`, `client/src/config/version.ts` (`APP_NAME`), `client/index.html`, `client/src/components/Register`, `client/src/components/AboutModal`, `README.md`. Livraison en quatre étapes (socle, vente, encaissement, historique / édition / modales), voir D-042.

### D-040 — Nom de l'association : réglage de l'instance

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : demande de l'utilisateur : « dans l'appli, vers le logo, ça serait cool d'avoir le nom du client affiché aussi ». Les clients sont des associations. Il fallait décider où se règle ce nom, et quoi afficher sans nom.
- **Décision** : le nom vient de la configuration de l'instance (réponse : « Config de l'instance ») : variable d'environnement `CLIENT_NAME`, transmise au client par `/config.js` et réglée par l'admin, comme la monnaie (D-008). C'est le titre de l'en-tête, à côté du logo, et il n'est jamais tronqué. Sans nom configuré, l'en-tête n'affiche que le logo et « Caisse Claire ». Le titre de l'onglet est « Asso · Caisse Claire », ou « Caisse Claire » sans nom. « À propos » affiche Caisse Claire et la version, pas le nom de l'association.
- **Options écartées** : réglage modifiable dans l'appli.
- **Impact** : `api/src/utils/runtimeConfig.ts`, `api/src/server.ts`, `client/src/config/client.ts`, `client/src/main.tsx`, `client/src/components/Register`, `deploy/README.md`, `api/.env.example`, `client/.env.example`.

### D-041 — Thème clair ou sombre : suit le téléphone, bascule dans le menu ⚙️

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : la nouvelle charte a un thème clair et un thème sombre, au choix ; les instances actuelles sont en sombre.
- **Décision** : par défaut, l'appli suit le réglage du téléphone ou de l'ordinateur (réponse : « Suivre le téléphone »). Le menu ⚙️ propose Auto / Clair / Sombre (réponse : « Menu ⚙️ : Auto / Clair / Sombre ») ; le choix s'applique tout de suite et reste mémorisé sur l'appareil.
- **Options écartées** : clair forcé ; sombre forcé ; icône de bascule dans l'en-tête.
- **Impact** : `client/src/App.tsx`, `client/index.html`, `client/src/components/ColorSchemeControl`, `client/src/components/Register`.

### D-042 — Refonte : une seule mise en prod à la fin, en 2.0.0

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : la refonte est livrée en quatre étapes. Mettre chaque étape en prod montrerait un mélange de l'ancien et du nouveau visuel. D-027 demande de monter la version dans la PR de la feature.
- **Décision** : les étapes 1 à 4 sont mergées dans `develop`, puis partent en prod en une seule release après l'étape 4 (réponse : « Une seule fois, à la fin »). La version passe en **2.0.0 dans la PR de l'étape 4** (réponse : « 2.0.0 à la release finale ») ; les PR des étapes 1 à 3 ne la montent pas. Précision de D-027 pour cette refonte.
- **Options écartées** : une mise en prod par étape ; version 1.4.0.
- **Impact** : PR des étapes 1 à 4 de la refonte. Entre deux étapes, la démo montre le mélange ancien / nouveau.

### D-043 — Le nom technique reste « token-register »

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : le renommage en Caisse Claire (D-039) pouvait toucher le dépôt, l'image Docker, les conteneurs et les packages.
- **Décision** : on garde « token-register » pour le dépôt, l'image Docker `julesgrateau/token-register`, les conteneurs et les packages (réponse : « On garde token-register »). Seul ce que voient les utilisateurs passe à Caisse Claire : l'appli, `README.md`, `deploy/README.md` et les noms affichés. `specs/` et `.specify/` ne changent pas.
- **Options écartées** : renommer aussi le dépôt, l'image et les conteneurs.
- **Impact** : `README.md`, `deploy/README.md` ; aucun changement de CI ni de déploiement.

### D-044 — Une icône par produit sur la carte produit

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, précisée par D-046
- **Domaine** : Catalogue
- **Contexte** : la charte prévoit une pastille sur chaque carte produit ; il fallait choisir ce qu'elle contient.
- **Décision** : chaque produit a sa propre icône (réponse : « Une icône par produit »). La liste des icônes, l'icône par défaut et la façon de la choisir seront clarifiées à l'étape 2.
- **Options écartées** : l'initiale du produit ; pas de pastille.
- **Impact** : étape 2 de la refonte (carte produit, données produit).

### D-045 — Badge de quantité sur la carte produit

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active, précisée par D-048
- **Domaine** : Catalogue
- **Contexte** : la charte propose d'afficher sur la carte produit combien d'exemplaires sont déjà dans le panier.
- **Décision** : un badge affiche sur la carte du produit la quantité déjà dans le panier (réponse : « Oui »).
- **Options écartées** : pas de badge.
- **Impact** : étape 2 de la refonte (carte produit).

### D-046 — Icônes produit : facultatives, initiale par défaut, liste fermée

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active (précise D-044)
- **Domaine** : Catalogue
- **Contexte** : D-044 donne une icône à chaque produit, sans dire ce qu'affiche un produit qui n'en a pas (produits des instances de production existantes, nouveaux produits), si elle est obligatoire, ce que devient une consigne ni d'où viennent les icônes.
- **Décision** : un produit sans icône affiche son **initiale** (réponse : « Son initiale ») ; rien n'est écrit en base (`NULL`), aucune icône n'est attribuée aux produits existants. L'icône est **facultative** (réponse : « Non, facultatif ») : « Aucune » est présélectionnée dans le formulaire. Une consigne (prix négatif) garde l'icône choisie, et prend l'icône recyclage si aucune n'est choisie (réponse : « Celle choisie, recyclage par défaut »). Les icônes viennent d'une **liste fermée** de 29 clés (`docs/design/icons.md`, réponse : « Oui, ça suffit ») ; l'API refuse toute autre valeur.
- **Options écartées** : icône générique par défaut ; icône devinée d'après le nom lors de la migration ; icône obligatoire ; consigne toujours en recyclage ; icônes sur mesure (crêpe, frites, chips).
- **Impact** : `products.icon` (migration `api/src/db/catalogIcons.ts`), `api/src/utils/catalogIcons.ts`, `shared-ts` (`CatalogIconKey`), `client/src/config/catalogIcons.ts`, `client/src/components/CatalogIcon`, `ProductCard`, `ProductFormModal`, `docs/design/icons.md`, `MIGRATIONS.md`.

### D-047 — Icône facultative par catégorie, dans son onglet

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : avec une icône par produit (D-044, D-046), la question se posait d'en donner une aussi aux catégories.
- **Décision** : une catégorie peut avoir une icône (réponse : « Oui »), **facultative**, prise dans la même liste fermée que les produits, affichée **dans son onglet** avant le nom. Une catégorie sans icône n'affiche que son nom (pas d'initiale).
- **Options écartées** : pas d'icône de catégorie.
- **Impact** : `categories.icon` (même migration que D-046), `api/src/controllers/category.controller.ts`, `api/src/services/category.service.ts`, `client/src/components/Catalog`, `CategoryFormModal`, `docs/design/components.md`.

### D-048 — Badge de quantité : toute la quantité de la ligne, remise comprise

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active (précise D-045)
- **Domaine** : Catalogue
- **Contexte** : D-045 ajoute un badge de quantité sur la carte produit ; le panier n'a qu'une ligne par produit, remise comprise, et il fallait dire ce que le badge compte.
- **Décision** : le badge affiche la quantité totale de la ligne du produit dans le panier, **remise comprise** (réponse : « Oui, toute la quantité »). Il est masqué en mode édition.
- **Options écartées** : exclure les articles remisés.
- **Impact** : `client/src/components/Catalog/ProductList`, `ProductCard`, `docs/design/components.md`.

### D-049 — Nombre d'articles en minuscule, « Articles » en tête de ligne

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : la revue design de la PR #30 (DS-1) relevait « Total · 3 Articles » avec une majuscule, alors que la charte écrit « articles ». La clé `total_items` ne sert qu'au libellé seul en début de ligne du pied du panier (« Articles … 3 »), que la charte écrit avec une majuscule.
- **Décision** : le nombre d'articles s'écrit en minuscule après le nombre (réponse : « Counts lowercase (Recommended) ») : « 1 article », « 3 articles », et « 1 item », « 3 items » en anglais (`items_one`, `items_other`). Le libellé seul du pied du panier garde sa majuscule : « Articles » (`total_items`).
- **Options écartées** : tout mettre en minuscule, y compris le libellé du pied du panier (« articles … 3 »).
- **Impact** : `client/src/locales/fr.json`, `client/src/locales/en.json` (barre panier, encaissement, historique).

### D-050 — Confirmations : « Annuler » à gauche, suppression en rouge

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : dans les modales de confirmation, « Confirmer » était à gauche et « Annuler » à droite. La charte (« Modales hors encaissement ») place l'action principale à droite et une action destructive en rouge ; le changement casse l'habitude des utilisateurs actuels.
- **Décision** : on applique la charte (réponse : « Apply the design (Recommended) ») : « Annuler » à gauche, l'action à droite, dans toutes les confirmations et tous les formulaires. Pour une suppression (commande, produit, catégorie), le bouton d'action est rouge plein. Pour une commande, il s'appelle « Supprimer » au lieu de « Confirmer », comme pour les produits et les catégories (réponse : « Supprimer (Recommended) », après la revue design de la PR #31).
- **Options écartées** : garder « Confirmer » à gauche ; garder « Confirmer » comme libellé de la suppression d'une commande.
- **Impact** : `client/src/components/ConfirmationModal` (prop `destructive`), `client/src/components/OrderHistoryModal`, `client/src/components/ProductManagement`, `client/src/components/CategoryManagement`, `client/src/components/DiscountModal`.

### D-051 — Palette « Graphite + olive » et colonne des catégories « liseré + teinte »

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : après la mise en prod de la 2.0.0, l'utilisateur a voulu changer la palette moutarde + encre de D-039 et le style de la colonne des catégories. Il a choisi sur un comparatif visuel préparé par le designer.
- **Décision** : la palette devient **« Graphite + olive V3 »**. Les neutres graphite remplacent le crème. L'action, la sélection, le badge de quantité et le contour « dans le panier » passent à l'encre (`--color-primary` #26241F, crème #F2EFE8 en sombre). L'**olive** ne sert qu'aux pastilles-icônes produit et au logo, avec des tokens dédiés. Danger et succès sont inchangés. La colonne des catégories (tablette et desktop) prend l'« Option 2 : liseré + teinte » : lignes droites collées, séparées par un filet, ligne choisie en `--color-surface-2` avec un liseré encre de 3 px à gauche et un texte en 800. Les pilules en rangée (téléphone) gardent leur forme. Cette décision remplace **la partie couleurs** de D-039 ; le nom, la police et le logo en ticket restent ceux de D-039. Version : **MINOR, 2.1.0** (réponse : « MINOR, 2.1.0 (Recommended) »), à consigner dans une nouvelle décision (réponse : « New D-051 (Recommended) »). Valeurs et détails des composants : `docs/design/`.
- **Options écartées** : garder la moutarde (D-039) ; les autres palettes et options de colonne du comparatif ; une version PATCH ou MAJOR ; une simple mise à jour de D-039.
- **Impact** : `client/src/styles/variables.css`, `client/src/App.tsx` (palette Mantine `encre`), `client/src/components/BrandLogo`, `client/src/assets/brand/`, `client/index.html` (favicon clair / sombre), `client/src/components/Catalog`, `CatalogIcon`, `Cart`, `Register`, `docs/design/`.

### D-052 — Formulaires produit / catégorie : enregistrement direct, confirmation à la fermeture si modifié

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : retours d'un test utilisateur. Fermer un formulaire produit ou catégorie en cours de modification perdait la saisie sans prévenir ; sur un écran court (PC zoomé), le bouton « Enregistrer » n'était pas visible ; « Enregistrer » demandait toujours une confirmation, même sans modification.
- **Décision** :
  - « Enregistrer » enregistre tout de suite, sans confirmation (réponse : « Save at once (Recommended) »). En modification, si rien n'a changé, le formulaire se ferme sans appel à l'API.
  - Fermer un formulaire modifié ouvre « Enregistrer les modifications ? » avec 3 boutons (réponse : « 3 buttons (Recommended) ») : « Annuler » (retour au formulaire, saisie conservée), « Ne pas enregistrer » (ferme, modifications perdues), « Enregistrer » (enregistre ; si le formulaire est invalide, retour au formulaire avec les erreurs).
  - Toutes les façons de fermer passent par cette question (réponse : « All ways of closing (Recommended) ») : croix, Échap, « Annuler » et clic hors de la modale. Échap, la croix ou un clic hors du pop-up ramènent au formulaire.
  - La question est posée aussi en création, dès qu'une saisie a été faite (réponse : « Creation too (Recommended) »). Une valeur ramenée à sa valeur d'origine ne compte pas comme une modification.
  - Les boutons du formulaire restent visibles en bas, même sur un écran court.
  - La modale de remise n'est pas concernée.
  - Version : **2.2.0**, avec la refonte de l'encaissement (réponse : « We'll just do PR a and B in 2.2 ») ; la 2.1.0 ne contient que la palette (D-051).
- **Options écartées** : garder une confirmation à l'enregistrement quand quelque chose a changé ; un pop-up à 2 boutons (« Continuer la modification » / « Abandonner ») ; désactiver le clic hors de la modale ; ne demander qu'en modification ; une version 2.1.x pour ce correctif seul.
- **Impact** : `client/src/components/ProductManagement/ProductFormModal.tsx`, `client/src/components/CategoryManagement/CategoryFormModal.tsx`, `client/src/components/UnsavedChangesModal`, `client/src/styles/formModal.module.css`, `client/src/locales`, `scripts/design-review/capture.mjs`.

### D-053 — Encaissement : le moyen de paiement d'abord, une part par moyen

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : refonte du comportement de l'écran d'encaissement (PR B, avec la PR A de D-052, en 2.2.0). Remplace D-028, D-031 et D-033 ; amende D-029, D-030 et D-032.
- **Décision** :
  - Euros : le choix « Espèces | Carte » s'affiche en premier (le mode reste obligatoire et sans défaut, D-030 ; choisir un montant ne vaut plus choix « Espèces »).
  - Carte : le montant est prérempli avec le reste dû. Un paiement partiel est autorisé, le montant ne dépasse jamais le reste (une touche qui le ferait dépasser est sans effet).
  - Espèces : suggestions et pavé numérique. Le bouton « Appoint » est supprimé (réponse : « On le vire bouton appoint, c'est pas clair. Juste la première suggestion c'est le montant exact et voila ») : la première suggestion est le montant exact du reste dû, puis 3 montants supérieurs (algorithme de D-029, calculé sur le reste dû). Toucher une suggestion remplit le montant, sans enregistrer.
  - Paiement mixte : une seule part par moyen, chaque part peut être supprimée. Après une part, l'autre moyen est prérempli avec le reste. Seule la part en espèces peut donner lieu à un rendu, qui n'est jamais enregistré (D-034). Le dernier moyen restant doit couvrir le reste.
  - Bouton contextuel (réponse : « Bouton contextuel ») : sur l'écran du moyen, le bouton s'appelle « Encaisser » si la part complète le total, et enregistre la vente ; sinon « Ajouter », qui ajoute la part et revient au choix de l'autre moyen.
  - Total ≤ 0 (euros) : on choisit le moyen, puis on valide : « Rembourser » pour un total négatif, « Encaisser » pour un total à 0 €. Le moyen choisi porte le total (D-032).
  - Jetons : un récapitulatif et le bouton « Encaisser », rien d'autre (« Rembourser » pour un total négatif, « Encaisser » à 0). Aucun paiement enregistré ; l'API refuse toujours un paiement envoyé sur une instance en jetons.
  - Stockage inchangé : aucune migration, mêmes colonnes `cash_amount` / `card_amount` (D-034).
- **Options écartées** : un « Encaisser » final après une liste de parts (un toucher de plus) ; garder « Appoint » ; suggestions calculées sur le total plutôt que sur le reste dû ; « Rembourser » aussi pour un total à 0 €.
- **Impact** : `client/src/components/CartConfirmationModal`, `client/src/utils/payment.ts`, `client/src/locales`, `docs/design/components.md` (section « Encaissement »), `scripts/design-review/capture.mjs`.

### D-054 — Échec d'une insertion du catalogue d'exemple : journaliser et continuer

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Remplacée par D-055
- **Domaine** : Catalogue
- **Contexte** : issue #52. L'initialisation de la base fermait la connexion sans attendre explicitement les insertions du catalogue d'exemple, et un échec d'insertion passait inaperçu. Il fallait décider du comportement si une insertion échoue (le script tourne au démarrage du conteneur).
- **Décision** :
  - Le script d'initialisation attend la fin de toutes les insertions avant de fermer la base (réponse : « Fiabiliser + test (Recommandé) »).
  - Si une insertion du catalogue d'exemple échoue, l'erreur est journalisée, les insertions suivantes continuent et l'appli démarre quand même, avec un catalogue éventuellement partiel (réponse : « Journaliser et continuer (Recommandé) »).
  - Version : **2.2.2** (réponse : « PATCH 2.2.2 (Recommandé) »).
- **Options écartées** : arrêter le script en erreur (le conteneur ne démarre pas tant que la base n'est pas réparée) ; ajouter seulement un test sans toucher au script.
- **Impact** : `api/src/db/scripts/initDb.ts`, `api/src/db/scripts/__tests__/initDb.test.ts`.

### D-055 — Une base neuve démarre sans aucune donnée, les données existantes ne sont jamais modifiées

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Catalogue
- **Contexte** : en traitant l'issue #52 (PR #61), la question s'est posée de ce que fait l'initialisation quand elle ne peut pas lire le catalogue. Jusqu'ici, une base neuve en jetons recevait un catalogue d'exemple (D-014), et D-054 réglait le cas d'une insertion en échec.
- **Décision** :
  - Il n'y a plus de catalogue d'exemple, nulle part (réponse : « Mais personne en reçoit jamais de catalogue d'exemple. Ça existe pas ») : ni par défaut, ni en option, ni en euros.
  - L'initialisation ne crée que les tables (réponse : « Non mais si des données existes déjà, on les gardes et on y touches pas. Si c'est une initialisation a zero, on part sans aucune donnée ») : une base neuve est vide, en jetons comme en euros ; une base qui a déjà des données n'est jamais modifiée.
  - La démo n'est pas touchée : sa base actuelle reste telle quelle (réponse : « Ne rien changer (Recommandé) »).
  - Version : **2.3.0**, dans la PR #61 (réponse : « MINOR 2.3.0 dans #61 (Recommandé) »).
  - Ajout du 2026-11-21 : si la création des tables échoue, l'erreur est journalisée et le script sort en erreur, ce qui arrête le démarrage de l'appli (réponse : « Arrêter le démarrage (Recommandé) »).
- **Options écartées** : garder le catalogue d'exemple dans une commande manuelle ou derrière une variable d'environnement ; remettre la démo à zéro ; version PATCH 2.2.2 ; en cas d'échec de la création des tables, journaliser et laisser l'appli démarrer.
- **Impact** : `api/src/db/scripts/initDb.ts` et ses tests, `README.md`, `MIGRATIONS.md`, `deploy/README.md`. Remplace D-014 et D-054. Le script de capture ne trouve plus de catalogue sur une base locale neuve (issue #62).

### D-056 — Conversion de monnaie : une ligne d'historique sans prix reste sans prix

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : issue #33 (TL-2 de la PR #19). La commande de conversion (D-009) remplaçait sans prévenir un `order_items.product_price` vide par 0, puis écrivait ce 0 avec `--apply`. Ce cas ne se produit pas avec l'appli actuelle, mais peut exister dans une ancienne base (migration de l'historique incomplète, lignes écrites par une version antérieure, modification manuelle).
- **Décision** :
  - Avec `--apply`, le prix d'une telle ligne reste vide ; la remise et les autres montants sont convertis comme d'habitude (réponse : « Le laisser vide (Recommandé) »).
  - Ces lignes sont exclues du total de l'aperçu, qui le signale (réponse : « Non, exclues et comptées (Recommandé) »). Elles ne peuvent pas bloquer la conversion au titre de D-016.
  - L'aperçu affiche : « Warning: N ligne(s) de commande sans prix enregistré (commandes #x, #y) : prix inconnu, laissé vide », avec au plus 20 numéros de commande puis « … » (réponse : « Français (Recommandé) »).
  - Version : **2.3.1** (réponse : « PATCH 2.3.1 (Recommandé) »).
- **Options écartées** : refuser la conversion tant qu'il reste des lignes sans prix ; écrire 0 avec un simple avertissement ; compter ces lignes à 0 dans le total ; message en anglais.
- **Impact** : `api/src/db/currency.ts` et ses tests, `deploy/README.md`, `MIGRATIONS.md`.

### D-057 — Script de capture : jeu de test créé sur une instance sans catalogue, puis supprimé

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : issue #62. Depuis D-055, une base neuve est vide : le script de capture (`scripts/design-review/capture.mjs`) s'arrêtait, faute d'une catégorie avec 2 produits à prix positif et d'un produit à prix négatif. Il fallait décider de ce qu'il crée, sous quels noms, et ce qui se passe si le nettoyage échoue.
- **Décision** :
  - S'il manque une pièce (pas de catégorie avec 2 produits à prix positif, ou pas de produit à prix négatif), le script crée tout le jeu de test, dans sa propre catégorie, sans jamais modifier le catalogue existant (réponse : « Créer tout le jeu (Recommandé) »). Sur une instance qui a déjà tout (la démo), rien n'est créé.
  - Noms repérables : catégorie « Test capture », produits « Produit A », « Produit B » et « Retour consigne » (réponse : « Noms repérables (Recommandé) »). Prix : 3 / 2 / -1 jetons, ou 2,50 € / 1,50 € / -1,00 €.
  - Le jeu est supprimé à la fin du passage, après les commandes de test. S'il n'a pas pu être supprimé, le contrôle (`check-report.mjs`) échoue, comme pour les commandes (réponse : « Le contrôle échoue (Recommandé) »).
- **Options écartées** : ne rien créer et laisser l'étape « total ≤ 0 » échouer quand seul le produit négatif manque ; ajouter le produit négatif dans une catégorie existante ; noms réalistes (« Café », « Eco-cup ») ; simple avertissement dans le rapport si le nettoyage échoue.
- **Impact** : `scripts/design-review/capture.mjs`, `scripts/design-review/check-report.mjs`. Outil de revue seulement : pas de montée de version (D-027).

### D-058 — QA de release : tests fixes sur des instances neuves, qui bloquent la mise en prod

- **Date** : 2026-11-21
- **Confirmée par** : Jules (responsable produit), 2026-11-21
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : plusieurs features peuvent arriver ensemble sur `develop` sans avoir été testées ensemble. Le contrôle des releases (`design-review.yml`) ne parcourait que les écrans de la démo, dans sa seule monnaie : ni base neuve, ni commande admin, ni euros (exemple : la v2.3.1, avec une base neuve vide et la conversion d'une ligne sans prix, n'avait été testée que par Jest).
- **Décision** :
  - Toute PR vers `main` passe un QA de release fait de **tests fixes, sans IA** (réponse : « Tests fixes, sans IA (Recommandé) »), dans le runner, sur des instances temporaires construites depuis le commit de la PR. La démo n'est pas touchée.
  - Périmètre : les écrans, le démarrage sur une base neuve, les commandes admin `convert-currency` et `migrate`, **en jetons et en euros** (réponse : « Tout, jetons + EUR (Recommandé) »).
  - Le QA bloque la mise en prod : c'est un check obligatoire de `main` (réponse : « Oui, je le configure (Recommandé) »). Pour corriger : une PR vers `develop`, puis le QA se relance.
  - Fausse alerte : seul l'admin du dépôt peut passer outre, et l'exception est notée dans un commentaire de la PR (réponse : « Toi seul (Recommandé) »).
  - Chaque PR de feature ajoute son scénario (une étape de `capture.mjs` pour un écran, un fichier de `scripts/release-qa/scenarios/` pour le reste) ; le tech-lead le vérifie (réponse : « Oui, obligatoire (Recommandé) »).
  - Le rapport et le commentaire d'échec sont en français (réponse : « Français (Recommandé) »).
  - Outillage seulement : pas de montée de version (réponse : « Aucune montée (Recommandé) », D-027).
  - Ajout du 2026-11-23 : la release qui l'emporte touche `scripts/ci/app-changed.sh`, ce qui exige une montée de version (`version-check`). Version **2.3.2**, montée dans la PR qui corrige l'étape « order-history » de la capture, premier échec du QA de release sur la PR #71 (réponse : « PATCH 2.3.2 (Recommandé) »).
- **Options écartées** : un agent QA Claude qui déduit et exécute un plan de test à chaque release (coût en tokens, résultats variables) ; un mélange tests fixes + relecture par un agent ; écrans seulement ; jetons seulement ; scénario par feature simplement recommandé ; rapport en anglais ; montée PATCH.
- **Impact** : `.github/workflows/release-qa.yml`, `scripts/release-qa/`, `scripts/ci/app-changed.sh`, `.claude/agents/developpeur.md`, `.claude/agents/tech-lead.md`, `CLAUDE.md`. La protection de `main` est réglée par l'admin du dépôt.

### D-059 — Deux démos tenues à jour par le CI : une en jetons, une en euros

- **Date** : 2026-11-23
- **Confirmée par** : Jules (responsable produit), 2026-11-21 (deux démos) et 2026-11-23 (modalités)
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : issue #49. Seule la démo en jetons était redéployée par le CI ; l'instance en euros restait sur une ancienne version, et tester les montants en euros (encaissement, parts, rendu de monnaie) demandait une instance locale. Décision de principe du 2026-11-21 : deux démos toujours à jour, une en jetons et une en euros, chacune avec un catalogue adapté à sa monnaie. Restait à dire comment, sans revenir sur D-055.
- **Décision** :
  - La démo EUR est l'instance en euros qui existe déjà, redéployée par le CI à chaque déploiement de la démo, avec la même image (réponse : « L'existante (Recommandé) »).
  - Son catalogue est créé par un script hors de l'appli (`scripts/demo/seed-eur-catalog.mjs`), lancé par le CI après chaque déploiement, seulement si elle n'a aucune catégorie et aucun produit, sans jamais rien modifier (réponse : « Script auto CI (Recommandé) »). L'initialisation de l'appli reste celle de D-055.
  - Catalogue aux noms réalistes (réponse : « Noms réalistes (Recommandé) »), liste exacte soumise à validation dans la PR : Boissons (Bière pression 3,50 €, Verre de vin 3,00 €, Soda 2,00 €, Eau 1,00 €, Café 1,50 €), Restauration (Sandwich 4,50 €, Hot-dog 3,50 €, Chips 1,50 €, Part de gâteau 2,50 €), Consignes (Eco-cup 1,00 €, Retour eco-cup -1,00 €).
  - Les données actuelles de l'instance EUR sont gardées telles quelles : si elle a déjà un catalogue, rien n'est ajouté (réponse : « On les garde (Recommandé) »).
  - La démo en jetons n'est pas touchée : aucun catalogue créé par le CI (réponse : « On n'y touche pas (Recommandé) »).
  - Le contrôle automatique des releases (`design-review.yml`) parcourt aussi la démo EUR (réponse : « Oui, aussi EUR (Recommandé) »).
  - L'URL de la démo EUR, son service et ses identifiants sont des secrets GitHub, jamais écrits dans le dépôt (réponse : « Secret GitHub (Recommandé) »).
  - Si la démo EUR ne redémarre pas ou si son catalogue ne peut pas être créé, le déploiement échoue (réponse : « Le deploy échoue (Recommandé) »).
  - Version : **2.3.3** (réponse : « PATCH 2.3.3 (Recommandé) »).
  - Scénario de QA de release : `scripts/release-qa/scenarios/05-catalogue-demo.sh` (réponse : « Scénario 05 (Recommandé) »).
- **Options écartées** : une nouvelle instance EUR ; script lancé une seule fois à la main ; saisie du catalogue à la main ; copie du catalogue de la démo jetons ; remise à zéro de l'instance EUR ; catalogue aussi pour la démo jetons ; contrôle des releases sur la démo jetons seulement ; URL affichée comme environnement GitHub ; simple avertissement en cas d'échec ; aucune montée de version ; pas de scénario de QA.
- **Impact** : `.github/workflows/ci-cd.yml` (job `deploy`), `.github/workflows/design-review.yml`, `scripts/demo/seed-eur-catalog.mjs`, `scripts/release-qa/scenarios/05-catalogue-demo.sh`, `deploy/README.md`. Secrets à créer : `DEMO_EUR_SERVICE`, `DEMO_EUR_URL`, `DEMO_EUR_BASIC_AUTH_USER`, `DEMO_EUR_BASIC_AUTH_PASS`.

### D-060 — Workflow autonome sur GitHub : de l'issue à la PR de release

- **Date** : 2026-11-23
- **Confirmée par** : Jules (responsable produit), 2026-11-23
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : le responsable produit veut créer une issue, puis ne plus faire que répondre aux questions, relire et merger. Choix de départ : tout se passe sur GitHub (workflows Actions avec l'action Claude Code, sans session locale) ; un label sur l'issue lance la clarification, avec un seul commentaire groupé du développeur, du tech-lead et du designer (seulement si l'interface est touchée), qui contient toujours la montée de version et le scénario de QA (D-058) ; le commentaire de réponse relance le développeur, qui ne repose que ce qui manque, ou consigne les décisions, code et ouvre la PR en brouillon vers `develop` ; aucune question métier n'est tranchée par un agent ; boucle complète sur la PR, 🟡 corrigés ou ⏸️ ; le designer relit une seule fois (D-038) ; c'est toujours le responsable produit qui merge ; une PR de release `develop` → `main` est créée ou mise à jour à chaque merge dans `develop`.
- **Décision** :
  - Jeton : une GitHub App propre au dépôt, secrets `AUTOMATION_APP_ID` et `AUTOMATION_APP_PRIVATE_KEY` (réponse : « GitHub App (Recommandé) »). Les PR et commentaires créés avec `GITHUB_TOKEN` ne déclencheraient pas les workflows suivants.
  - Déclencheur : seul le propriétaire du dépôt déclenche. Un label ou un commentaire d'un autre auteur est ignoré, sans lancer d'IA, et le contenu de l'issue est traité comme une donnée (réponse : « Toi seul (Recommandé) »).
  - Plafonds, par issue ou par PR (réponse : « Par issue (Recommandé) ») : une exécution à la fois, sans annulation ; 60 tours pour le développeur, 25 pour les revues ; 45 minutes par job. Au-delà de 2 tours de correction ou de 3 relances de clarification : label `bloqué` et mention du responsable produit.
  - Modèles : développeur en Opus, tech-lead et designer en Sonnet (réponse : « Dev Opus, revues Sonnet (Recommandé) »).
  - Captures du designer prises dans le runner, sur des instances temporaires construites depuis le commit de la PR (réponse : « Dans le runner (Recommandé) »).
  - Boucle de correction : les points 🔴/🟠 du tech-lead et du designer suivent la même boucle, 2 tours au total, tech-lead et designer confondus (réponse : « Même boucle (Recommandé) »).
  - Version : aucune montée ; les nouveaux workflows et scripts d'automatisation sont hors appli (`scripts/ci/app-changed.sh`). Si la modification d'`app-changed.sh` impose quand même une montée, alors PATCH (réponse : « Aucune montée (Recommandé) »). C'est le cas : la release 2.3.3 est arrivée sur `main` avant ce changement, `version-check` l'exigera donc. Version **2.3.4**, montée dans la PR du socle.
  - PR de release automatique : titre `Release vX.Y.Z` (version de `develop`), créée « prête » ; son corps liste les PR incluses, recalculé à chaque merge, avec une alerte si la version de `develop` n'est pas au-dessus de celle de `main` (réponse : « Titre vX.Y.Z, prête (Recommandé) »).
  - Le déroulé local de `CLAUDE.md` est gardé en secours (réponse : « Gardé en secours (Recommandé) »).
  - 4 labels : `à-faire`, `en-clarification`, `en-cours`, `bloqué` (réponse : « 4 labels (Recommandé) »).
  - L'issue se ferme à la release, via `Closes #n` (réponse : « À la release (Recommandé) »).
- **Options écartées** : PAT fine-grained ; `GITHUB_TOKEN` avec des `workflow_dispatch` en chaîne ; déclenchement ouvert aux membres du dépôt ; plafond global par jour en plus ; tout en Sonnet ; une démo par PR pour les captures ; alerte directe après un ❌ du designer ; montée PATCH d'office ; titre générique de PR de release ; suppression du déroulé local ; un seul label ; fermeture de l'issue au merge dans `develop`.
- **Impact** : `.github/workflows/auto-*.yml`, `scripts/automation/`, `scripts/ci/app-changed.sh`, `.github/workflows/tech-lead-review.yml`, `docs/automation/README.md`, `CLAUDE.md`, `.claude/agents/*.md`. Mise en place par le propriétaire : `docs/automation/README.md`.

### D-061 — Journée de caisse : démarrer, terminer, total net espèces / carte

- **Date** : 2026-11-24
- **Confirmée par** : Jules (responsable produit), 2026-11-23 (réponses 1 à 19 de l'issue #81)
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : issue #81. Pouvoir démarrer et finir une journée de caisse, et consulter à tout moment ce qui a été encaissé sur la journée en cours, avec le détail espèces et carte. Les montants par moyen existent déjà sur chaque commande en euros (D-034) ; il manquait la notion de journée. Amende D-020 (suppression d'une commande) et l'historique des commandes.
- **Décision** :
  - Vente sans journée ouverte : refusée, en euros comme en jetons (réponse 1 : « Vente bloquée tant qu'aucune journée n'est ouverte : rien n'échappe au total, mais on peut perdre une vente pendant le rush. »). Le bouton de validation est désactivé, un bandeau « Aucune journée ouverte » s'affiche avec un bouton « Démarrer la journée », et l'API refuse aussi la commande (code `CASH_DAY_REQUIRED`) (réponse 19 : « a) Le bouton de validation est désactivé, avec un bandeau « Aucune journée ouverte » et un bouton « Démarrer la journée ». L'API refuse aussi la commande. Cela vaut en euros comme en jetons. »).
  - Journée jamais terminée : elle reste ouverte jusqu'à ce qu'on la termine ; ouverte un jour précédent, l'en-tête affiche « Journée ouverte depuis le JJ/MM » (réponse 2 : « Elle reste ouverte jusqu'à ce qu'on la termine. Si elle a été ouverte un jour précédent, un avertissement « Journée ouverte depuis le JJ/MM » s'affiche. »).
  - Ni fond de caisse ni comptage dans cette version (réponse 3 : « a) Rien de plus dans cette version : on démarre, on termine, et on obtient le total encaissé. »).
  - Synthèse : total net (remboursements et commandes négatives déduits), espèces, carte et nombre de commandes (réponse 4 : « a) Total net (les remboursements et les commandes négatives sont déduits), espèces, carte et nombre de commandes. »). Un paiement mixte compte dans les deux moyens (D-053), un total négatif est porté par le moyen choisi (D-032).
  - Jetons : la journée existe aussi, avec le total en jetons et le nombre de commandes, sans ligne espèces / carte (réponse 5 : « a) La journée existe aussi, avec le total en jetons et le nombre de commandes, sans ligne espèces / carte. »).
  - Journées terminées conservées et consultables (date, heures, total, espèces, carte), totaux figés à la fermeture (réponse 6 : « a) Les journées terminées sont conservées, avec une liste consultable (date, heures, total, espèces, carte). Leurs totaux sont figés à la fermeture, et la suppression d'une commande d'une journée terminée est refusée avec un message clair. […] Suppréssion possible dans un écran dédié, pas dans l'historique (Une fois la journées terminées, le commande sorte de l'historique. »). La liste montre les 50 dernières.
  - L'historique ne montre que les commandes de la journée ouverte ; sans journée ouverte, il est vide et affiche « Aucune journée ouverte » (réponse 15 : « a) Le bouton Historique ne montre que les commandes de la journée ouverte. Sans journée ouverte, il est vide et affiche « Aucune journée ouverte ». »). L'historique ne montre donc que des commandes supprimables (réponse 14 : « a) Oui. L'historique ne montre que des commandes supprimables. Une commande d'une journée terminée se supprime uniquement dans l'écran dédié (16). ») ; l'API refuse la suppression d'une commande d'une journée terminée par la route de l'historique (code `CASH_DAY_CLOSED`).
  - Écran dédié : dans « Journées passées », toucher une journée liste ses commandes, chacune avec « Supprimer » et la confirmation D-050 (réponse 16 : « a) Dans « Journées passées » : on touche une journée pour voir ses commandes, chacune avec « Supprimer » (confirmation D-050). »).
  - Après une suppression, le total annoncé à la fermeture est conservé et la journée affiche le total recalculé avec « Modifiée après la fermeture (total annoncé : X) » (réponse 17 : « a) Le total annoncé à la fermeture est conservé. Après une suppression, la journée affiche le total recalculé avec la mention « Modifiée après la fermeture (total annoncé : X) ». »).
  - Terminer : une confirmation qui montre la synthèse finale (« Annuler » à gauche, « Terminer la journée » à droite, D-050), puis un récapitulatif ; démarrer se fait d'un toucher, sans confirmation, et une seule journée peut être ouverte (réponse 7 : « a) Une confirmation qui montre la synthèse finale (« Annuler » à gauche, « Terminer la journée » à droite, D-050), puis un récapitulatif affiché après la fermeture. » et « Démarrer une journée se fait d'un toucher, sans confirmation. On ne peut pas en démarrer une nouvelle tant que la précédente est ouverte. »). La base garantit une seule journée ouverte.
  - Interface : une entrée « Journée de caisse » dans le menu ⚙️ ouvre une modale (démarrer, synthèse en cours, terminer, journées passées), avec un indicateur de l'état de la journée dans l'en-tête, rendu du designer (réponse 8 : « a) Une entrée « Journée de caisse » dans le menu ⚙️ ouvre une modale (démarrer / synthèse en cours / terminer / journées passées), avec un indicateur discret de l'état de la journée dans l'en-tête. […] Si aucune journée démarré, un bandeau permet de démarrer la journée. »).
  - Rattachement : une commande appartient à la journée ouverte au moment de la vente ; la synthèse ne compte que les commandes rattachées à cette journée (réponse 12 : « a) La commande est rattachée à la journée ouverte au moment de la vente. La synthèse ne compte que les commandes rattachées à cette journée. »).
  - Heures stockées en UTC, affichées à l'heure locale de l'appareil, JJ/MM et 24 h (réponse 13 : « a) Les heures sont stockées en UTC et affichées à l'heure locale de l'appareil (JJ/MM, 24 h). »).
  - Commandes existantes à la mise à jour : **supprimées automatiquement par la migration**, une seule fois ; une sauvegarde est conseillée avant la mise à jour (réponse 9 : « Peuvent être supprimées », précisée en réponse 18 : « b) Les commandes existantes sont supprimées automatiquement à la migration. Une sauvegarde est conseillée avant la mise à jour. »).
  - Conversion de monnaie : les totaux annoncés des journées terminées sont convertis avec l'historique ; vers les jetons, leur répartition espèces / carte est effacée, comme celle des commandes (D-036).
  - Version **2.4.0** (réponse 10 : « a) MINOR 2.4.0 : nouvelle fonction, avec une migration de schéma. »).
  - Scénario de QA de release (réponse 11 : « a) Deux ajouts. ») : étapes `cash-day-summary`, `cash-day-close-confirm`, `cash-day-history`, `cash-day-orders`, `cash-day-none` et `cash-day-start` dans `capture.mjs`, et `scripts/release-qa/scenarios/06-journee-caisse.sh` (EUR sur une base neuve, puis migration d'une ancienne base).
- **Options écartées** : vente possible sans journée, avec un bandeau ; ouverture automatique à la première vente ; fermeture automatique à minuit ; pas d'avertissement ; fond de caisse, comptage et écart ; ventes et remboursements séparés ; fonction réservée aux euros ; suppression libre avec recalcul sans mention ; totaux figés qui ignorent les suppressions ; pas d'historique des journées ; fermeture sans confirmation ; bouton dédié ou entrée dans l'historique ; écran séparé dans le menu ⚙️ pour les commandes des journées terminées ; rattachement par plage horaire ; heure du serveur ; anciennes commandes gardées sans journée ou dans l'historique ; vente bloquée en euros seulement ; bouton actif avec erreur à la validation ; PATCH ou MAJOR.
- **Impact** : `api/src/db/cashDays.ts`, `api/src/db/scripts/initDb.ts`, `api/src/db/scripts/migrateDb.ts`, `api/src/db/currency.ts`, `api/src/services/cashDay.service.ts`, `api/src/services/order.service.ts`, `api/src/controllers/cashDay.controller.ts`, `shared-ts/index.ts`, `client/src/components/CashDay/`, `client/src/components/Cart`, `client/src/components/OrderHistoryModal`, `client/src/components/Register`, `client/src/locales`, `docs/design/components.md`, `docs/design/icons.md`, `MIGRATIONS.md`, `deploy/README.md`, `scripts/design-review/capture.mjs`, `scripts/release-qa/scenarios/`.

### D-062 — Panier : une ligne à 0 disparaît, message d'erreur d'encaissement lisible

- **Date** : 2026-11-25
- **Confirmée par** : Jules (responsable produit), 2026-11-25 (réponses 1 à 4 de l'issue #92)
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : issue #92. Le bouton « − » d'une ligne du panier descendait jusqu'à 0 et la ligne restait ; l'API refuse une quantité inférieure à 1 (`Invalid product quantity`, 400), et la modale d'encaissement affichait « Erreur lors de l'ajout de la commande : [object Object] ».
- **Décision** :
  - « − » à quantité 1 : la ligne disparaît automatiquement du panier, avec sa remise (réponse 1 : « b) La ligne disparaît automatiquement quand sa quantité passe à 0, avec sa remise. »). Le panier n'a donc jamais de ligne à 0 ; un panier enregistré sur l'appareil avant le correctif ne restaure pas ses lignes à 0.
  - Échec de l'enregistrement pour une autre raison que les cas dédiés (D-035, D-061, inchangés) : le message « La commande n'a pas pu être enregistrée. Réessayez. », suivi du texte renvoyé par l'API quand il y en a un (réponse 2 : « b) Le message clair et traduit, suivi du texte renvoyé par l'API. On n'affiche jamais `[object Object]`. »). Sans texte de l'API (échec réseau, réponse sans corps), le message seul.
  - Version : pas de montée, le correctif part avec la 2.4.0 (réponse 3 : « a) Pas de montée de version : le correctif part avec la 2.4.0. »).
  - Scénario de QA de release (réponse 4 : « c) Les deux : l'étape de capture dans `capture.mjs` (qui vérifie que la ligne disparaît, en jetons et en euros) et le scénario de QA API (`POST /orders` à quantité 0 → 400 lisible). ») : étape `cart-quantity-zero` dans `capture.mjs` et `scripts/release-qa/scenarios/07-commande-quantite-nulle.sh`.
- **Options écartées** : « − » désactivé à 1 (retrait par « Supprimer ») ; ligne à 0 affichée mais non envoyée ; encaissement bloqué avec un message ; message générique seul, détail en console ; un message dédié par code d'erreur ; passage en 2.4.1 ; un seul des deux scénarios de QA.
- **Impact** : `client/src/redux/cartSlice.tsx`, `client/src/components/Cart/CartItem`, `client/src/utils/localStorageCart.ts`, `client/src/utils/extractApiError.ts`, `client/src/components/CartConfirmationModal`, `client/src/locales`, `docs/design/components.md`, `scripts/design-review/capture.mjs`, `scripts/release-qa/scenarios/07-commande-quantite-nulle.sh`.

### D-063 — Comptes utilisateurs, rôles et écran de connexion (remplace la BasicAuth)

- **Date** : 2026-11-27
- **Confirmée par** : Jules (responsable produit), 2026-11-26 (points 1 à 17 de l'issue #95) et 2026-11-27 (réponses 1 à 13 de la clarification)
- **Statut** : Active
- **Domaine** : Accès
- **Contexte** : issue #95. Toute l'appli était protégée par une seule BasicAuth partagée. Il faut de vrais comptes, avec un rôle, un écran de connexion dans l'appli, et des droits qui pourront distinguer les rôles plus tard (statistiques). Première des deux PR : comptes, sessions, migration, permissions, connexion et déconnexion, premier admin, scripts, CI et doc. L'écran admin des comptes et le changement de mot de passe viennent dans la seconde.
- **Décision** :
  - Rôles : **admin**, **gérant** et **caissier** (point 1 de l'issue). Les droits passent par une table rôle → permissions, relue en base à chaque requête : un changement de rôle s'applique immédiatement, même pour une session ouverte (point 15). Aujourd'hui, les trois rôles ont tout ce qui existe (vente, catalogue, journée, suppression de commandes) ; seule la gestion des comptes est réservée à l'admin (point 13). Un rôle ou une permission inconnus refusent l'accès.
  - La BasicAuth est retirée : on se connecte par l'écran de login. `BASIC_AUTH_*` n'est plus lu, avec un avertissement au démarrage s'il est encore défini (point 2). Le statique et `/config.js` sont publics, tout le reste de `/api` est protégé, sauf la connexion.
  - Premier admin : `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD`, lus dès que la table des comptes est vide, que la base ait des données ou non (réponse 10 : « a) La règle porte sur « aucun compte » : `INITIAL_ADMIN_*` est lu dès que la table `users` est vide, sinon refus de démarrer. »). Absentes ou invalides : refus de démarrer, avec un message qui nomme la variable (réponse 3 : « a) Refus de démarrer, avec un message qui nomme la variable manquante. »).
  - `reset-admin-password <nom>` : mot de passe lu dans l'environnement, compte réactivé et remis en admin, sessions fermées, admin créé s'il n'existe pas ; le mot de passe n'est **pas temporaire** dans cette PR, la colonne `must_change_password` est créée dès maintenant (réponse 4 : « a) [...] Le mot de passe n'est **pas temporaire** dans cette PR. La colonne `must_change_password` est créée dès maintenant. »).
  - Session : cookie httpOnly, SameSite=Strict, Secure en prod, stockée en base et révocable immédiatement (point 3) ; elle expire après 7 jours d'inactivité (point 4).
  - Identifiant : un nom d'utilisateur, pas d'e-mail (point 6), de 3 à 32 caractères (lettres, chiffres, `.`, `_`, `-`), espaces de début et de fin retirés, unique sans tenir compte de la casse (réponse 5 : « a) De 3 à 32 caractères (lettres, chiffres, `.`, `_`, `-`), espaces de début et de fin retirés, unique sans tenir compte de la casse. »). Les lettres sont les lettres **ASCII** seulement (`[A-Za-z0-9._-]`, pas de lettres accentuées), casse ignorée (réponse du 2026-11-27 : « ASCII seul »).
  - Mots de passe : 6 caractères minimum, sans règle de complexité (point 8).
  - Tentatives : après 5 échecs, 1 minute d'attente pour ce compte et cette IP (point 7). Message unique « Identifiant ou mot de passe incorrect » ; après 5 échecs : « Trop de tentatives, réessayez dans 1 minute » (réponse 6 : « a) Message unique « Identifiant ou mot de passe incorrect ». Après 5 échecs : « Trop de tentatives, réessayez dans 1 minute ». »).
  - Plafond par IP seule, en plus (TL-1 de la PR #97) : 50 échecs d'affilée depuis une même IP, quels que soient les identifiants, imposent 1 minute d'attente à cette IP, avec le même message (réponse du 2026-11-27 : « 50 échecs/min »).
  - Session expirée pendant l'utilisation : retour au login avec « Votre session a expiré, reconnectez-vous », le panier est conservé (réponse 7 : « a) Retour au login avec « Votre session a expiré, reconnectez-vous ». Le panier est conservé. »).
  - Menu ⚙️ : nom de l'utilisateur en tête, « Se déconnecter » en bas, sans confirmation ; le panier reste sur l'appareil (point 5, réponse 8 : « a) Nom de l'utilisateur en tête du menu ⚙️, « Se déconnecter » en bas, sans confirmation. »).
  - Écran de login : champ mot de passe masqué, avec le bouton œil (réponse 13 : « a) Champ masqué, avec le bouton œil. »).
  - Traçabilité : l'auteur de chaque commande et de l'ouverture et de la fermeture de chaque journée est enregistré, sans rien afficher pour l'instant (point 14). Les commandes et journées d'avant gardent un auteur vide (D-055).
  - Protection : les POST, PUT, PATCH et DELETE dont l'en-tête `Origin` est présent et diffère de `FRONTEND_URL` sont refusés en 403 (réponse 11 : « a) Refus en 403 des POST, PUT, PATCH et DELETE dont l'`Origin` est présent et diffère de `FRONTEND_URL`. »). Nombre de proxys de confiance `TRUST_PROXY_HOPS`, 0 par défaut (réponse 12 : « a) `TRUST_PROXY_HOPS` configurable, 0 par défaut, documenté dans `deploy/README.md`. »).
  - Démos et CI : pas de compte public (point 16). Un compte caissier dédié par démo, secrets `DEMO_LOGIN_USER` / `DEMO_LOGIN_PASS` et `DEMO_EUR_LOGIN_USER` / `DEMO_EUR_LOGIN_PASS` ; pour la QA et les captures des PR, un admin éphémère créé via `INITIAL_ADMIN_*` avec des valeurs générées à chaque run (réponse 9 : « a) Un compte caissier dédié par démo. [...] Pour la QA et auto-pr, un admin éphémère est créé via `INITIAL_ADMIN_*` avec des valeurs générées à chaque run. »). En attendant l'écran des comptes (PR 2), le compte de chaque démo est créé **admin** avec `reset-admin-password`, puis passé en caissier avec l'écran de la PR 2 (réponse du 2026-11-27 : « Admin puis caissier ») ; c'est décrit dans `deploy/README.md`.
  - Décidé pour la seconde PR : changement de son propre mot de passe depuis ⚙️ en saisissant l'ancien (point 9) ; réinitialisation par l'admin avec un mot de passe temporaire et fermeture des sessions (point 10) ; retrait d'un compte par désactivation seulement (point 11) ; un admin ne peut jamais désactiver ni rétrograder son propre compte (point 12).
  - Version **3.0.0**, montée dans cette PR (point 1, réponse 1 : « a) MAJOR 3.0.0. »). Découpage en deux PR vers `develop` (point 17).
  - Scénario de QA de release : `scripts/release-qa/scenarios/08-authentification.sh` en jetons et en EUR, étapes de capture `login` (et `login-error`), mise à jour de `settings-menu` ; les autres scénarios passent au login via `lib.sh` (réponse 2 : « a) Scénario `08-authentification.sh` en jetons et en EUR, capture `login` et mise à jour de `settings-menu`. Les autres scénarios passent au login via `lib.sh`. »).
- **Options écartées** : MINOR 2.5.0 ; lettres accentuées dans l'identifiant ; compte de démo caissier dès cette PR ; scénario API seul ; démarrage avec un simple avertissement sans admin ; reset du mot de passe seul ; mot de passe de reset temporaire dans cette PR ; texte libre sensible à la casse ; messages distincts (compte inconnu, désactivé, mauvais mot de passe) ; message d'erreur seul sans retour au login ; « Se déconnecter » sans le nom, ou avec confirmation ; compte admin de chaque démo pour la CI ; base existante sans compte démarrée sans admin ; SameSite=Strict seul ; nombre de proxys fixé à 1 ; champ toujours masqué sans œil.
- **Impact** : `api/src/db/auth.ts`, `api/src/db/accounts.ts`, `api/src/db/scripts/` (`migrateDb.ts`, `initDb.ts`, `resetAdminPassword.ts`), `api/src/services/auth.service.ts`, `api/src/middleware/auth.ts`, `api/src/controllers/`, `api/src/app.ts`, `api/src/server.ts`, `api/src/utils/` (`password.ts`, `username.ts`, `loginRateLimiter.ts`, `authConfig.ts`), `shared-ts/index.ts`, `client/src/components/Login`, `client/src/components/AuthGate`, `client/src/components/Register`, `client/src/redux/authSlice.ts`, `client/src/services/`, `client/src/locales`, `docs/design/components.md`, `docs/design/icons.md`, `scripts/design-review/capture.mjs`, `scripts/demo/seed-eur-catalog.mjs`, `scripts/release-qa/`, `.github/workflows/` (`ci-cd.yml`, `design-review.yml`, `release-qa.yml`, `auto-pr.yml`), `README.md`, `api/.env.example`, `deploy/README.md`, `MIGRATIONS.md`.

### D-064 — Écran admin des comptes, changement de mot de passe et mot de passe temporaire

- **Date** : 2026-11-28
- **Confirmée par** : Jules (responsable produit), 2026-11-28 (réponses 1 à 13 de la clarification de l'issue #96)
- **Statut** : Active
- **Domaine** : Accès
- **Contexte** : issue #96, seconde PR des comptes après D-063 (PR #97), qui a décidé les points 9 à 12 (changement de son mot de passe, réinitialisation temporaire avec fermeture des sessions, désactivation seulement, ni auto-désactivation ni auto-rétrogradation). Il restait à fixer l'écran, le mot de passe temporaire et les cas limites.
- **Décision** :
  - Écran : une entrée « Comptes » dans ⚙️, visible seulement par l'admin, qui ouvre une modale plein écran sur téléphone (réponse 1 : « a) Entrée « Comptes » dans ⚙️, visible seulement par l'admin, qui ouvre une modale (plein écran sur téléphone), comme « Journée de caisse ». »).
  - Réinitialisation : l'admin saisit lui-même le mot de passe temporaire, rien n'est réaffiché (réponse 2 : « a) L'admin saisit lui-même le mot de passe temporaire (6 caractères au moins, avec l'œil) et le transmet de vive voix. Rien n'est réaffiché ensuite. »).
  - Création : le mot de passe saisi est temporaire (réponse 3 : « a) Oui : le mot de passe saisi à la création est temporaire (`must_change_password` = 1), à changer à la première connexion. »).
  - Tant que le mot de passe est temporaire, l'API refuse tout (403 `PASSWORD_CHANGE_REQUIRED`) sauf `GET /auth/me`, la déconnexion et le changement de mot de passe ; l'appli montre l'écran imposé à la place de la caisse (issue #96, suites de la PR #97).
  - Changement de son mot de passe : les autres sessions sont fermées, la session en cours est gardée (réponse 4 : « a) Les autres sessions de l'utilisateur sont fermées, la session en cours est gardée. »). Après 5 mauvais mots de passe actuels pour ce compte et cette IP, 1 minute d'attente, comme la connexion (D-063, point 7), sans bloquer la connexion.
  - Nouveau mot de passe (réponse 5 : « a) Nouveau mot de passe saisi deux fois, avec l'œil, et différent de l'ancien ou du mot de passe temporaire. »).
  - Confirmations (réponse 6 : « a) Seule la désactivation demande une confirmation D-050 en rouge (« Désactiver »), qui ferme toutes les sessions du compte. La réactivation et le changement de rôle se font d'un toucher, sans confirmation. »). La réactivation garde le mot de passe du compte.
  - Liste (réponse 7 : « a) Nom, rôle et état (badge « Désactivé »), actifs d'abord puis triés par nom. Le compte de l'admin connecté porte « Vous », sans désactivation ni changement de rôle. »).
  - Dernier admin actif (réponse 8 : « a) Dernier admin actif : l'interface ne le permet pas, et l'API répond 409 « Il doit rester au moins un administrateur actif ». »). Vaut pour la désactivation et pour le changement de rôle ; la règle « son propre compte » est vérifiée avant.
  - Pas de renommage (réponse 9 : « a) Pas de renommage : le nom est fixé à la création. »).
  - Version (réponse 10 : « a) Aucune montée de version : cette PR part dans la même release 3.0.0. »).
  - Scénario de QA de release (réponse 11 : « a) Scénario `09-gestion-comptes.sh` en jetons et en EUR, plus les étapes de capture proposées et la mise à jour de `settings-menu`. ») : étapes `accounts-list`, `account-create-form`, `account-create-error`, `account-reset-password`, `account-deactivate-confirm`, `change-password`, `forced-password-change`, et `settings-menu`.
  - Son propre mot de passe ne se réinitialise pas depuis l'écran des comptes (réponse 12 : « a) Un admin ne peut pas réinitialiser son propre mot de passe depuis l'écran des comptes : l'interface ne le propose pas et l'API répond 409. Il passe par « Changer mon mot de passe » dans ⚙️. »).
  - Compte désactivé (réponse 13 : « b) Réinitialiser le mot de passe d'un compte désactivé est **refusé** : il faut d'abord le réactiver. L'interface ne propose pas « Réinitialiser le mot de passe » sur un compte désactivé, et l'API refuse (409). »).
- **Options écartées** : page séparée avec sa route ; mot de passe généré par l'appli et affiché une fois ; mot de passe de création définitif ; garder toutes les sessions, ou toutes les fermer y compris l'actuelle ; saisie unique sans autre règle ; une confirmation pour chaque action ; date de dernière connexion dans la liste ; autre règle pour le dernier admin ; renommage depuis l'écran ; MINOR 3.1.0 ; scénario API seul ; auto-réinitialisation permise ; réinitialisation d'un compte désactivé permise.
- **Impact** : `api/src/services/user.service.ts`, `api/src/services/auth.service.ts`, `api/src/controllers/user.controller.ts`, `api/src/controllers/auth.controller.ts`, `api/src/middleware/auth.ts`, `api/src/app.ts`, `shared-ts/index.ts`, `client/src/components/Accounts`, `client/src/components/ChangePassword`, `client/src/components/AuthGate`, `client/src/components/Register`, `client/src/services/users.ts`, `client/src/services/auth.ts`, `client/src/services/baseQuery.ts`, `client/src/redux/`, `client/src/locales`, `docs/design/components.md`, `docs/design/icons.md`, `deploy/README.md`, `scripts/design-review/capture.mjs`, `scripts/release-qa/lib.sh`, `scripts/release-qa/scenarios/09-gestion-comptes.sh`.
