# Icônes — Caisse Claire

Bibliothèque unique : **`@tabler/icons-react`**, trait 2 px, bouts arrondis (style par défaut de Tabler). Pas d'icône sur mesure, sauf le logo (`client/src/assets/brand/`, voir [README.md](README.md#identité)). Le dossier `client/src/assets/icons/` reste réservé aux icônes sur mesure (format : viewBox 24, trait 2 px, `stroke="currentColor"`).

## Règles

- Taille : 20 px dans les boutons et menus, 22 px dans la barre d'édition des cartes, 24–28 px dans les en-têtes, 32 px (téléphone) / 48 px (desktop) sur « Nouveau produit ».
- `stroke` par défaut (2) ; 1.5 toléré pour les icônes ≥ 24 px des en-têtes.
- Couleur héritée (`currentColor`) ou token (`var(--color-…)`, voir [colors.md](colors.md)). Jamais de hex ni `"red"`.
- **Icône d'accent** (`--color-icon-accent`) : encre (`#26241F` en clair, `#F2EFE8` en sombre) pour « Modifier », « Ajouter », `IconCoins`. **Jamais d'olive** hors des pastilles (D-051).
- Une icône seule = un `aria-label` obligatoire. Une action destructive ou ambiguë = icône **et** texte quand la place le permet.

## Pastille-icône

Le « visuel » d'un produit est une **pastille** : un carré arrondi teinté **olive** (seule touche d'olive avec le logo, D-051) qui porte une icône ou une initiale.

|                         | Valeur                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forme                   | carré arrondi, `--radius-tile` (16 px) ; 48 × 48 (téléphone portrait, tablette, desktop), 32 × 32 en paysage (rayon 10)                                                                      |
| Fond                    | `--color-icon-tile` (clair `#EBEFC6`, sombre `#2B3012`) ; **pas** `--color-primary-tint`, qui reste neutre                                                                                   |
| Contenu                 | icône Tabler 26 px (paysage 20 px), `currentColor` = `--color-tile-icon` (clair `#5C7316`, 4.5:1 ; sombre `#B5CC55`, 7.6:1)                                                                  |
| Sans icône choisie      | **initiale** du produit, 22 / 800 (paysage 16), mêmes couleurs                                                                                                                               |
| Consigne (prix négatif) | pastille `--color-danger-tint`, icône `IconRecycle` en `--color-danger` ; bordure de carte **pointillée** `--color-danger`, prix en `--color-danger` avec signe « − » (pas de couleur seule) |
| Décoratif               | `aria-hidden="true"` : le nom et le prix portent l'information                                                                                                                               |

Règles d'usage : une pastille par carte produit, jamais plusieurs couleurs de pastille (une seule teinte olive, pas d'arc-en-ciel) ; pas de pastille dans la ligne de panier ni l'historique ; l'icône n'est jamais le seul identifiant d'un produit (le nom est toujours affiché).

## Icônes produit (D-044)

Chaque produit peut porter **une icône** choisie dans une **liste fermée de 29 icônes Tabler**. Le champ de données stocke la **clé stable** (`snake_case`, anglais), jamais le nom du composant : on peut changer le composant sans migration. Une clé inconnue (liste réduite plus tard) est traitée comme « aucune ». Tous les composants ci-dessous ont été vérifiés dans `@tabler/icons-react` installé. Attention : `IconSandwich` **n'existe pas** (ancienne proposition de ce document, retirée).

| Clé          | Composant Tabler    | Libellé FR              | Label EN              |
| ------------ | ------------------- | ----------------------- | --------------------- |
| `beer`       | `IconBeer`          | Bière                   | Beer                  |
| `wine`       | `IconGlass`         | Vin                     | Wine                  |
| `cocktail`   | `IconGlassCocktail` | Cocktail                | Cocktail              |
| `soft_drink` | `IconGlassFull`     | Soda / jus              | Soft drink            |
| `bottle`     | `IconBottle`        | Bouteille               | Bottle                |
| `water`      | `IconDroplet`       | Eau                     | Water                 |
| `coffee`     | `IconCoffee`        | Café                    | Coffee                |
| `hot_drink`  | `IconMug`           | Boisson chaude / thé    | Hot drink / tea       |
| `milk`       | `IconMilk`          | Lait                    | Milk                  |
| `cup`        | `IconCup`           | Gobelet                 | Cup                   |
| `sandwich`   | `IconBaguette`      | Sandwich                | Sandwich              |
| `burger`     | `IconBurger`        | Burger                  | Burger                |
| `hot_dog`    | `IconSausage`       | Hot-dog / saucisse      | Hot dog / sausage     |
| `pizza`      | `IconPizza`         | Pizza                   | Pizza                 |
| `salad`      | `IconSalad`         | Salade                  | Salad                 |
| `soup`       | `IconSoup`          | Soupe                   | Soup                  |
| `meat`       | `IconMeat`          | Viande                  | Meat                  |
| `grill`      | `IconGrill`         | Grillade / barbecue     | Grill                 |
| `cheese`     | `IconCheese`        | Fromage                 | Cheese                |
| `snack`      | `IconPackage`       | Chips / frites / paquet | Snack / chips / fries |
| `cookie`     | `IconCookie`        | Biscuit / crêpe         | Cookie / crepe        |
| `cake`       | `IconCake`          | Gâteau                  | Cake                  |
| `ice_cream`  | `IconIceCream`      | Glace                   | Ice cream             |
| `candy`      | `IconCandy`         | Bonbons                 | Candy                 |
| `fruit`      | `IconApple`         | Fruit                   | Fruit                 |
| `deposit`    | `IconRecycle`       | Consigne                | Deposit               |
| `ticket`     | `IconTicket`        | Ticket / entrée         | Ticket                |
| `tshirt`     | `IconShirt`         | T-shirt                 | T-shirt               |
| `goodies`    | `IconGift`          | Goodies / cadeau        | Goodies / gift        |

Il n'y a pas d'icône Tabler fiable pour crêpe, frites ni chips : ils partagent `cookie` et `snack`. Ajouter une icône = ajouter une ligne ici, une clé dans la liste du code et rien en base.

### Icône par défaut

Un produit sans icône affiche son **initiale** (règle de la pastille ci-dessus, 22 / 800), confirmé par **D-046** : l'initiale distingue deux produits sans icône côte à côte, alors qu'une icône identique partout ressemble à un état d'erreur. L'icône est facultative. La consigne (prix négatif) prend `deposit` si aucune icône n'est choisie, et garde l'icône choisie sinon (D-046).

### Affichage dans la pastille

|                         | Valeur                                                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Taille de l'icône       | 26 px dans la pastille 48 × 48 (téléphone portrait, tablette, desktop) ; 20 px dans la pastille 32 × 32 (téléphone paysage) ; `stroke` 2                                                                                                                    |
| Clair                   | fond `--color-icon-tile` `#EBEFC6`, icône `--color-tile-icon` `#5C7316` : **4.5:1**                                                                                                                                                                         |
| Sombre                  | fond `--color-icon-tile` `#2B3012`, icône `--color-tile-icon` `#B5CC55` : **7.6:1**                                                                                                                                                                         |
| Seuil                   | contraste icône / fond ≥ 3:1 (graphique non textuel, WCAG 1.4.11) ; l'initiale (22 / 800) atteint aussi 4.5:1                                                                                                                                               |
| Consigne (prix négatif) | pastille `--color-danger-tint`, icône (`deposit` par défaut, ou l'icône choisie) en `--color-danger` (5.3:1 en clair, 5.4:1 en sombre) ; **bordure de carte pointillée** et **signe « − »** devant le prix : le marqueur ne repose pas sur la couleur seule |
| Accessibilité           | `aria-hidden="true"` sur l'icône, le nom et le prix portent l'information                                                                                                                                                                                   |

### Sélecteur d'icône (formulaire produit)

- Champ « Icône » dans le formulaire produit, après le nom : un aperçu de la pastille courante et un bouton qui déplie la grille (inline dans la modale, pas de second niveau de modale).
- Grille de **boutons de 44 × 44 px minimum** (pastille 48 recommandée), écart `--space-2`, 5 colonnes sur téléphone portrait, 6 à 8 ailleurs ; ordre = ordre du tableau ci-dessus (boissons, plats, desserts, divers).
- **Pas de recherche** : 29 icônes tiennent sur 5 à 6 lignes ; la recherche n'apporte rien et ouvre le clavier sur mobile. À revoir au-delà de 40 icônes.
- Chaque bouton : `IconX` 26 px dans la pastille, `aria-label` = libellé FR (EN selon la langue), `aria-pressed` pour l'état. Info-bulle (`title`) sur desktop.
- Non sélectionné : pastille olive (`--color-icon-tile`, icône `--color-tile-icon`), contour 1 px `--color-border`.
- **État sélectionné non porté par la seule couleur** : fond `--color-primary-tint` (neutre) + contour 2 px `--color-text` + `aria-pressed` + coche `IconCheck` 14 px `--color-text` en coin haut droit (pastille ronde 18 px `--color-primary-tint`). Focus visible : anneau habituel de la charte.
- « Aucune » est un libellé, pas une pastille : fond `--color-surface`, texte `--color-text`.
- Premier élément : bouton **« Aucune »** (`IconBan`, présent dans `@tabler/icons-react`) avec libellé visible « Aucune », sur 2 colonnes ; sélectionné par défaut à la création. Il remet le produit à l'initiale (D-046), la catégorie à son nom seul (D-047).
- Le même sélecteur sert au formulaire catégorie (D-047), sans aperçu de pastille tant qu'aucune icône n'est choisie.

## Correspondance icône ↔ action

| Action                                          | Icône                                                                         | Couleur                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| Réglages (menu ⚙️)                              | `IconSettings` ; le bouton des réglages porte aussi `aria-label` « Réglages » | `--color-text`                                           |
| Historique des commandes                        | `IconHistory`                                                                 | `--color-text`                                           |
| Modifier (produit, catégorie) / mode édition    | `IconEdit` (menu : `IconPencil`)                                              | `--color-icon-accent`                                    |
| Terminer l'édition                              | `IconCheck`                                                                   | texte du bouton                                          |
| Supprimer (produit, catégorie, ligne, commande) | `IconTrash`                                                                   | `--color-danger`                                         |
| **Vider le panier**                             | `IconTrash`                                                                   | `--color-danger`                                         |
| Ajouter / quantité +                            | `IconPlus`                                                                    | `--color-icon-accent` (sur encre : `--color-on-primary`) |
| Quantité −                                      | `IconMinus`                                                                   | `--color-text`                                           |
| Remise                                          | `IconDiscount`                                                                | `--color-success`                                        |
| Plus d'actions (ligne de panier)                | `IconDotsVertical`                                                            | `--color-text-2`                                         |
| Ouvrir / fermer le panier (portrait)            | `IconChevronUp` / `IconChevronDown`                                           | `--color-on-bar` (barre) / `--color-text`                |
| Monnaie verrouillée                             | `IconLock`                                                                    | `--color-text-2`                                         |
| À propos                                        | `IconInfoCircle`                                                              | `--color-text`                                           |
| Thème clair / sombre                            | `IconSun` / `IconMoon` (état courant, avec libellé)                           | `--color-text`                                           |
| Consigne (pastille)                             | `IconRecycle`                                                                 | `--color-danger`                                         |

### Journée de caisse (D-061, voir [components.md](components.md#journée-de-caisse--cashday))

| Action / information                                                               | Icône                         | Taille                    | Couleur                            |
| ---------------------------------------------------------------------------------- | ----------------------------- | ------------------------- | ---------------------------------- |
| Entrée du menu ⚙️, indicateur « Journée ouverte »                                  | `IconCalendarEvent`           | 20                        | texte                              |
| Indicateur « Aucune journée ouverte » / « Ouverte depuis le … », bandeau du panier | `IconAlertTriangle`           | 20                        | texte (jamais de couleur d'alerte) |
| Démarrer la journée                                                                | `IconPlayerPlay`              | 22 (modale), 20 (bandeau) | texte du bouton                    |
| Terminer la journée                                                                | `IconPlayerStop`              | 22                        | texte du bouton                    |
| Lignes Espèces / Carte de la synthèse, badges des journées passées                 | `IconCash` / `IconCreditCard` | 20 (synthèse), 16 (badge) | texte                              |
| Journée terminée (récapitulatif)                                                   | `IconCheck`                   | 28                        | `--color-success`                  |

### Encaissement (voir [components.md](components.md#encaissement--cartconfirmationmodal))

| Action / information                                         | Icône                         | Taille                                | Couleur                                                           |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Payer par carte, « Tout en carte », « Reste en carte »       | `IconCreditCard`              | 24 (bouton Carte), 22 (pied)          | texte du bouton                                                   |
| Espèces (libellé « Espèces reçues », bouton total ≤ 0)       | `IconCash`                    | 20 (libellé), 24 (bouton)             | `--color-text-2` (libellé), texte du bouton                       |
| Monnaie à rendre / à rendre au client (bloc de rendu)        | `IconCoins`                   | 28                                    | `--color-icon-accent`                                             |
| Il reste à payer par carte (bloc de rendu)                   | `IconCreditCard`              | 28                                    | `--color-text`                                                    |
| Il manque (jetons) / rendu élevé                             | `IconAlertTriangle`           | 28 (bloc), 20 (avertissement)         | `--color-danger` (il manque), `--color-icon-accent` (rendu élevé) |
| Encaisser / Enregistrer / Rien à rendre / suggestion choisie | `IconCheck`                   | 22 (pied), 28 (bloc), 18 (suggestion) | texte du bouton / `--color-success` (bloc « Rien à rendre »)      |
| Rembourser (total négatif, D-053)                            | `IconArrowBackUp`             | 22 (pied)                             | texte du bouton                                                   |
| Ajouter une part (D-053)                                     | `IconPlus`                    | 22 (pied)                             | texte du bouton                                                   |
| Supprimer une part (D-053)                                   | `IconTrash`                   | 20, zone 44 × 44                      | `--color-danger`                                                  |
| Autre montant (ouvre le pavé)                                | `IconKeyboard`                | 20                                    | texte du bouton                                                   |
| Retour aux montants                                          | `IconArrowLeft`               | 20                                    | texte du bouton                                                   |
| Effacer le dernier chiffre                                   | `IconBackspace`               | 24                                    | `--color-text`                                                    |
| Effacer le montant                                           | `IconX`                       | 20                                    | `--color-text`                                                    |
| Badge de paiement (historique)                               | `IconCash` / `IconCreditCard` | 16                                    | texte du badge                                                    |
