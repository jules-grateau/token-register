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
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : D-002 prévoyait de monter la version dans la PR `develop` → `main`. Comme cette PR part de `develop` et qu'on ne commite jamais directement sur `develop`, il fallait une PR de bump séparée à chaque release (#18, #21).
- **Décision** : la version est montée **dans la PR de la feature** qui partira en prod (réponse : « Bah oui, dans la PR de la feature c'est mieux »). S'il y a plusieurs PR dans une même release, seule la première la monte, sauf si une PR suivante change la catégorie (correctif → nouveauté : PATCH → MINOR) : elle remonte alors la version. Le type de montée (PATCH / MINOR / MAJOR) est demandé au responsable produit pendant la clarification de la feature. Une PR qui ne touche pas l'appli (docs, agents, CI de revue) ne monte pas la version. La règle de D-002 est inchangée sur le reste : montée à la main, et `version-check` fait échouer la PR vers `main` si la version n'est pas supérieure à celle de `main`.
- **Options écartées** : PR de bump séparée vers `develop` avant chaque release ; branche `release/x.y.z` puis report de `main` dans `develop` ; calcul automatique de la version par la CI.
- **Impact** : `README.md` (section Versioning), `.claude/agents/developpeur.md`, `CLAUDE.md`. Conséquence : la démo affiche le nouveau numéro dès le merge de la feature dans `develop`, avant la mise en prod.

### D-028 — Encaissement dans la modale de confirmation, enregistrement dès le toucher

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : l'aide au paiement (mode, montant reçu, monnaie à rendre) devait s'insérer dans la validation d'une commande sans ralentir la caisse. Avant de choisir, l'utilisateur a demandé une comparaison avec d'autres caisses (Shopify POS, Square, Loyverse).
- **Décision** : tout se passe dans la modale de confirmation, qui devient « Encaissement » (réponse : « Enregistrer dès le toucher »). « Carte » et « Appoint » enregistrent la vente immédiatement. S'il y a de la monnaie à rendre, « À rendre » s'affiche en grand, puis on touche « Encaisser ». Un montant tapé au pavé attend toujours « Encaisser », même s'il est égal au total. La modale se ferme par la croix ou Échap, le panier restant intact.
- **Options écartées** : « Toujours confirmer avec « Encaisser » » (Carte et Appoint ne font que sélectionner, puis « Encaisser » : un toucher de plus par vente).
- **Impact** : `client/src/components/CartConfirmationModal`, `docs/design/components.md` (section « Encaissement »).

### D-029 — Montants rapides suggérés selon le total, pavé pour la saisie libre

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Prix & jetons
- **Contexte** : il fallait choisir les raccourcis de montant reçu.
- **Décision** : les montants rapides sont suggérés selon le total (réponse : « Suggérés selon le total »), avec l'algorithme `suggestAmounts` de `docs/design/components.md` : « Appoint » plus 4 montants croissants, tous supérieurs au total. Un pavé intégré permet de saisir un montant libre (2 décimales au plus en euros, entiers en jetons).
- **Options écartées** : « Billets fixes + Appoint (5/10/20/50 €) » ; « Les deux (Appoint + suggestions + billets fixes 10/20/50) ».
- **Impact** : `client/src/utils/payment.ts` (`suggestAmounts`, saisie au pavé), `client/src/components/CartConfirmationModal`.

### D-030 — Mode de paiement obligatoire, sans défaut : Espèces ou Carte

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : il fallait décider si le mode de paiement est obligatoire, et quels moyens proposer.
- **Décision** : sur une instance en euros, le mode de paiement est obligatoire et n'a pas de valeur par défaut (réponse : « Obligatoire, sans défaut »). Il n'y a que deux moyens, Espèces et Carte (réponse : « Espèces et Carte »). Choisir un montant d'espèces vaut choix « Espèces ». L'API refuse une nouvelle commande en euros sans mode.
- **Options écartées** : « Facultatif (bouton « Enregistrer sans préciser ») » ; « Dernier mode présélectionné ». Pour les moyens : « + « Autre » (chèque, virement, Lydia…) ».
- **Impact** : `api/src/utils/payment.ts`, `api/src/services/order.service.ts`, `client/src/components/CartConfirmationModal`.

### D-031 — Paiement mixte : espèces d'abord, le reste en carte

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : il fallait décider quoi faire quand les espèces reçues sont inférieures au total.
- **Décision** : le paiement mixte espèces + carte est possible (réponse : « Paiement mixte espèces + carte »). Si les espèces reçues sont inférieures au total, l'écran affiche « Il reste X € » et le bouton « Reste en carte (X €) » enregistre la vente. Seule la part en espèces peut donner lieu à un rendu ; la carte est débitée du montant exact. On part toujours des espèces : pas de saisie d'une part carte d'abord (choix du designer).
- **Options écartées** : « « Il manque X € », bloqué (pas de paiement mixte) » ; « Avertir mais laisser passer ».
- **Impact** : `client/src/utils/payment.ts` (`splitCashPayment`), `client/src/components/CartConfirmationModal`, `api/src/utils/payment.ts`.

### D-032 — Total à 0 € ou négatif : le mode est demandé aussi

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
- **Domaine** : Commandes
- **Contexte** : avec la consigne (D-013), une commande peut avoir un total nul ou négatif (remboursement).
- **Décision** : le mode est demandé aussi (réponse : « Demander le mode aussi ») : Espèces ou Carte, y compris pour un remboursement. Sans suggestion ni pavé, l'écran affiche « Rien à encaisser » ou « À rendre au client X € », puis les boutons Espèces et Carte qui enregistrent immédiatement. Le mode choisi porte le total (0 ou négatif).
- **Options écartées** : « 0 € : enregistrer sans mode ; négatif : rendre en espèces ».
- **Impact** : `client/src/components/CartConfirmationModal`, `api/src/utils/payment.ts`.

### D-033 — Instances en jetons : aide en jetons, rien d'enregistré

- **Date** : 2026-11-20
- **Confirmée par** : Jules (responsable produit), 2026-11-20
- **Statut** : Active
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
