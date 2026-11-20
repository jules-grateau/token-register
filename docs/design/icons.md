# Icônes (charte provisoire)

Bibliothèque unique : **`@tabler/icons-react`**. Pas d'icône sur mesure pour l'instant (dossier `client/src/assets/icons/` réservé ; format imposé : viewBox 24, trait 2 px, `stroke="currentColor"`).

## Règles

- Taille : 20 px dans les boutons et menus, 22 px dans la barre d'édition des cartes, 24–28 px dans les en-têtes, 32 px (téléphone) / 48 px (desktop) sur « Nouveau produit ».
- `stroke` par défaut (2) ; 1.5 toléré pour les icônes ≥ 24 px des en-têtes.
- Couleur héritée (`currentColor`) ou couleur Mantine nommée (voir [colors.md](colors.md)). Jamais de hex ni `"red"`.
- Une icône seule = un `aria-label` obligatoire. Une action destructive ou ambiguë = icône **et** texte quand la place le permet.

## Correspondance icône ↔ action

| Action                                          | Icône                                   | Couleur                                        |
| ----------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Réglages                                        | `IconSettings`                          | défaut                                         |
| Historique des commandes                        | `IconHistory`                           | défaut                                         |
| Modifier (produit, catégorie) / mode édition    | `IconEdit` (menu : `IconPencil`)        | primaire `var(--mantine-primary-color-filled)` |
| Terminer l'édition                              | `IconCheck`                             | texte du bouton                                |
| Supprimer (produit, catégorie, ligne, commande) | `IconTrash`                             | red-6                                          |
| **Vider le panier**                             | **`IconTrash`** (remplace `IconCancel`) | red-6 (remplace `"red"`)                       |
| Ajouter / quantité +                            | `IconPlus`                              | défaut                                         |
| Quantité −                                      | `IconMinus`                             | défaut                                         |
| Remise                                          | `IconDiscount`                          | teal-4                                         |
| Plus d'actions (ligne de panier)                | `IconDotsVertical`                      | gray                                           |
| Ouvrir / fermer le panier (portrait)            | `IconChevronUp` / `IconChevronDown`     | défaut                                         |
| Monnaie verrouillée                             | `IconLock`                              | dimmed                                         |
| À propos                                        | `IconInfoCircle`                        | défaut                                         |

### Encaissement (voir [components.md](components.md#encaissement--cartconfirmationmodal))

| Action / information                                     | Icône               | Taille                         | Couleur                                  |
| -------------------------------------------------------- | ------------------- | ------------------------------ | ---------------------------------------- |
| Payer par carte, « Tout en carte », « Reste en carte »   | `IconCreditCard`    | 24 (bouton Carte), 22 (pied)   | texte du bouton                          |
| Espèces (libellé « Espèces reçues », bouton total ≤ 0)   | `IconCash`          | 20 (libellé), 24 (bouton)      | `dimmed` (libellé), texte du bouton      |
| Monnaie à rendre / à rendre au client (bloc de rendu)    | `IconCoins`         | 28                             | yellow-8                                 |
| Il reste à payer par carte (bloc de rendu)               | `IconCreditCard`    | 28                             | `var(--color-info-bg)`                   |
| Il manque (jetons) / rendu élevé                         | `IconAlertTriangle` | 28 (bloc), 20 (avertissement)  | red-6 (il manque), yellow-8 (rendu élevé)|
| Encaisser / Enregistrer / Rien à rendre / suggestion choisie | `IconCheck`     | 22 (pied), 28 (bloc), 18 (suggestion) | texte du bouton / défaut          |
| Autre montant (ouvre le pavé)                            | `IconKeyboard`      | 20                             | texte du bouton                          |
| Retour aux montants                                      | `IconArrowLeft`     | 20                             | texte du bouton                          |
| Effacer le dernier chiffre                               | `IconBackspace`     | 24                             | défaut                                   |
| Effacer le montant                                       | `IconX`             | 20                             | défaut                                   |
| Badge de paiement (historique)                           | `IconCash` / `IconCreditCard` | 16                   | texte du badge                           |
