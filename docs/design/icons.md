# Icônes — Caisse Claire

Bibliothèque unique : **`@tabler/icons-react`**, trait 2 px, bouts arrondis (style par défaut de Tabler). Pas d'icône sur mesure, sauf le logo (`client/src/assets/brand/`, voir [README.md](README.md#identité)). Le dossier `client/src/assets/icons/` reste réservé aux icônes sur mesure (format : viewBox 24, trait 2 px, `stroke="currentColor"`).

## Règles

- Taille : 20 px dans les boutons et menus, 22 px dans la barre d'édition des cartes, 24–28 px dans les en-têtes, 32 px (téléphone) / 48 px (desktop) sur « Nouveau produit ».
- `stroke` par défaut (2) ; 1.5 toléré pour les icônes ≥ 24 px des en-têtes.
- Couleur héritée (`currentColor`) ou token (`var(--color-…)`, voir [colors.md](colors.md)). Jamais de hex ni `"red"`.
- **Icône d'accent** (`--color-icon-accent`) : encre en clair, **moutarde en sombre**. La moutarde seule n'est jamais l'icône sur fond clair (2.1:1).
- Une icône seule = un `aria-label` obligatoire. Une action destructive ou ambiguë = icône **et** texte quand la place le permet.

## Pastille-icône

Le « visuel » d'un produit est une **pastille** : un carré arrondi teinté moutarde qui porte une icône ou une initiale.

| | Valeur |
| --- | --- |
| Forme | carré arrondi, `--radius-tile` (16 px) ; 48 × 48 (téléphone portrait, tablette, desktop), 32 × 32 en paysage (rayon 10) |
| Fond | `--color-primary-tint` (clair `#F6E2A8`, sombre `#3A2F12`) |
| Contenu | icône Tabler 26 px (paysage 20 px), `currentColor` ; **clair : encre** (`--color-text`, 13.5:1) ; **sombre : moutarde** (`--color-primary`, 7.3:1) |
| Sans icône choisie | **initiale** du produit, 22 / 800 (paysage 16), mêmes couleurs |
| Consigne (prix négatif) | pastille `--color-danger-tint`, icône `IconRecycle` en `--color-danger` ; bordure de carte **pointillée** `--color-danger`, prix en `--color-danger` avec signe « − » (pas de couleur seule) |
| Décoratif | `aria-hidden="true"` : le nom et le prix portent l'information |

Règles d'usage : une pastille par carte produit, jamais plusieurs couleurs de pastille (une seule teinte moutarde, pas d'arc-en-ciel) ; pas de pastille dans la ligne de panier ni l'historique ; l'icône n'est jamais le seul identifiant d'un produit (le nom est toujours affiché).

Bibliothèque de pastilles proposée (Tabler) : `IconBeer`, `IconGlassFull`, `IconCup`, `IconBottle`, `IconSandwich`, `IconCookie`, `IconIceCream`, `IconSoup`, `IconPizza`, `IconCoffee`, `IconRecycle`, `IconTicket`. Le choix d'une icône par produit demande un champ de données : voir les points à trancher du compte rendu de la refonte.

## Correspondance icône ↔ action

| Action | Icône | Couleur |
| --- | --- | --- |
| Réglages (menu ⚙️) | `IconSettings` ; le bouton des réglages porte aussi `aria-label` « Réglages » | `--color-text` |
| Historique des commandes | `IconHistory` | `--color-text` |
| Modifier (produit, catégorie) / mode édition | `IconEdit` (menu : `IconPencil`) | `--color-icon-accent` |
| Terminer l'édition | `IconCheck` | texte du bouton |
| Supprimer (produit, catégorie, ligne, commande) | `IconTrash` | `--color-danger` |
| **Vider le panier** | `IconTrash` | `--color-danger` |
| Ajouter / quantité + | `IconPlus` | `--color-text` (sur moutarde : encre) |
| Quantité − | `IconMinus` | `--color-text` |
| Remise | `IconDiscount` | `--color-success` |
| Plus d'actions (ligne de panier) | `IconDotsVertical` | `--color-text-2` |
| Ouvrir / fermer le panier (portrait) | `IconChevronUp` / `IconChevronDown` | `--color-on-bar` (barre) / `--color-text` |
| Monnaie verrouillée | `IconLock` | `--color-text-2` |
| À propos | `IconInfoCircle` | `--color-text` |
| Thème clair / sombre | `IconSun` / `IconMoon` (état courant, avec libellé) | `--color-text` |
| Consigne (pastille) | `IconRecycle` | `--color-danger` |

### Encaissement (voir [components.md](components.md#encaissement--cartconfirmationmodal))

| Action / information | Icône | Taille | Couleur |
| --- | --- | --- | --- |
| Payer par carte, « Tout en carte », « Reste en carte » | `IconCreditCard` | 24 (bouton Carte), 22 (pied) | texte du bouton |
| Espèces (libellé « Espèces reçues », bouton total ≤ 0) | `IconCash` | 20 (libellé), 24 (bouton) | `--color-text-2` (libellé), texte du bouton |
| Monnaie à rendre / à rendre au client (bloc de rendu) | `IconCoins` | 28 | `--color-icon-accent` |
| Il reste à payer par carte (bloc de rendu) | `IconCreditCard` | 28 | `--color-text` |
| Il manque (jetons) / rendu élevé | `IconAlertTriangle` | 28 (bloc), 20 (avertissement) | `--color-danger` (il manque), `--color-icon-accent` (rendu élevé) |
| Encaisser / Enregistrer / Rien à rendre / suggestion choisie | `IconCheck` | 22 (pied), 28 (bloc), 18 (suggestion) | texte du bouton / `--color-success` (bloc « Rien à rendre ») |
| Autre montant (ouvre le pavé) | `IconKeyboard` | 20 | texte du bouton |
| Retour aux montants | `IconArrowLeft` | 20 | texte du bouton |
| Effacer le dernier chiffre | `IconBackspace` | 24 | `--color-text` |
| Effacer le montant | `IconX` | 20 | `--color-text` |
| Badge de paiement (historique) | `IconCash` / `IconCreditCard` | 16 | texte du badge |
