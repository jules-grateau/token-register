# Couleurs — Caisse Claire

Palette **« Graphite + olive »** (D-051, remplace la moutarde de D-039) : des neutres graphite, une **encre** pour l'action, le texte, la barre panier et les repères forts, et l'**olive en touches** seulement (pastilles-icônes et logo). Le succès et le danger sont fonctionnels. Schémas **clair** et **sombre**, au choix de l'utilisateur (`colorScheme`, voir « Bascule de thème » dans [components.md](components.md#bascule-clairsombre--menu-réglages)). Les ratios ci-dessous sont calculés (WCAG 2.x) ; le script de contraste du dépôt fait foi.

> **Règle d'or** : l'olive ne sert **qu'aux pastilles-icônes produit et au logo**, via leurs tokens dédiés (`--color-icon-tile`, `--color-tile-icon`, `--color-logo`, `--color-logo-glyph`). Jamais pour un bouton, un état, un texte ou une sélection. L'olive-tint est proche de `--color-success-tint` : ne pas les mélanger.

## Tokens

Variables CSS dans `client/src/styles/variables.css` : `:root` (clair) et `[data-mantine-color-scheme='dark']` (sombre).

| Rôle | Variable | Clair | Sombre | Usage |
| --- | --- | --- | --- | --- |
| Fond | `--color-bg` | `#F5F4F1` | `#141413` | `body`, zone catalogue, survol d'une ligne de la colonne |
| Surface | `--color-surface` | `#FFFFFF` | `#1E1D1B` | cartes, en-tête, modales, Drawer, colonne des catégories |
| Surface 2 | `--color-surface-2` | `#ECEAE5` | `#282725` | survol / appui, ligne choisie de la colonne, bloc de rendu, champ de saisie |
| Texte | `--color-text` | `#1C1B19` | `#F2EFE8` | tout le texte courant |
| Texte 2 | `--color-text-2` | `#57534E` | `#B3AFA6` | `dimmed` : « Articles », date, libellés annexes |
| Bordure | `--color-border` | `#DDDAD3` | `#3A3834` | séparateurs, filets de la colonne, contours de carte (décoratif) |
| Bordure forte | `--color-border-strong` | `#85817A` | `#7A766E` | contours **utiles** : carte « Nouveau produit » en pointillés, icônes sans fond |
| **Primaire (encre)** | `--color-primary` | `#26241F` | `#F2EFE8` | « Valider » (desktop, tablette, Drawer), pilule choisie, liseré de la ligne choisie, badge de quantité, contour « dans le panier », « Terminer » |
| Sur primaire | `--color-on-primary` | `#FFFFFF` | `#1C1B19` | texte et icônes sur primaire |
| Teinte primaire | `--color-primary-tint` | `#E7E4DC` | `#2E2D2A` | **neutre** : état « À rendre », bouton `−` de quantité, option choisie du sélecteur d'icône, variante `light` de Mantine |
| Primaire sur barre | `--color-primary-on-bar` | `#F5F4F1` | `#F2EFE8` | « Valider » dans la barre panier (téléphone) : l'encre ne se verrait pas sur la barre |
| Sur primaire sur barre | `--color-on-primary-on-bar` | `#1C1B19` | `#1C1B19` | texte de ce « Valider » |
| Barre (encre) | `--color-bar` | `#1C1B19` | `#0C0C0B` | barre panier repliée (portrait), pied de panier compact |
| Sur barre | `--color-on-bar` | `#F5F4F1` | `#F2EFE8` | total, texte dans la barre |
| Sur barre 2 | `--color-on-bar-2` | `#CFCCC4` | `#B3AFA6` | « N articles » dans la barre, survol de « Valider » sur la barre |
| Succès | `--color-success` | `#166534` | `#4ADE80` | remise (avec `IconDiscount`), « Rien à rendre » |
| Teinte succès | `--color-success-tint` | `#DDF3E2` | `#17301F` | fond de badge de succès |
| Danger | `--color-danger` | `#B91C1C` | `#F87171` | supprimer, vider, prix négatif (consigne), « Il manque » |
| Teinte danger | `--color-danger-tint` | `#FBE4E4` | `#3A2022` | pastille de la consigne, bouton « Supprimer » (historique) |
| Info (neutre) | `--color-info-bg` / `--color-info-text` | `#1C1B19` / `#F5F4F1` | `#F2EFE8` / `#141413` | toasts d'information (« Panier vidé »). **Pas de bleu** : l'info est l'encre inversée |
| Icône d'accent | `--color-icon-accent` | `#26241F` | `#F2EFE8` | encre : icônes « Modifier », « Ajouter », `IconCoins` du rendu |
| **Pastille (olive)** | `--color-icon-tile` | `#EBEFC6` | `#2B3012` | fond des pastilles-icônes produit et des options du sélecteur d'icône |
| Icône de pastille (olive) | `--color-tile-icon` | `#5C7316` | `#B5CC55` | icône et initiale dans la pastille |
| **Logo (olive)** | `--color-logo` | `#5C7316` | `#B5CC55` | carré du logo |
| Glyphe du logo | `--color-logo-glyph` | `#FFFFFF` | `#1C1B19` | ticket du logo |
| Focus | `--color-focus` | `#1C1B19` | `#F2EFE8` | anneau de focus 2 px + `outline-offset: 2px` |
| Focus sur barre | `--color-focus-on-bar` | `#F5F4F1` | `#F2EFE8` | anneau dans la barre panier (encre sur encre invisible) |

Toasts (react-toastify, branchés via `--toastify-*`) :

| État | Fond clair / sombre | Texte clair / sombre | Ratio |
| --- | --- | --- | --- |
| Succès `--color-success-bg` / `-text` | `#166534` / `#4ADE80` | `#FFFFFF` / `#0B2A17` | 7.1 / 8.7 |
| Erreur `--color-danger-bg` / `-text` | `#B91C1C` / `#F87171` | `#FFFFFF` / `#3A0B0B` | 6.5 / 6.2 |
| Info `--color-info-bg` / `-text` | `#1C1B19` / `#F2EFE8` | `#F5F4F1` / `#141413` | 15.6 / 16.1 |

L'overlay des modales et les ombres utilisent l'encre `rgba(28, 27, 25, …)`.

## Contrastes attendus

Texte ≥ 4.5:1 ; icônes, bordures utiles, anneau de focus ≥ 3:1.

| Paire | Clair | Sombre | Exigence |
| --- | --- | --- | --- |
| `text` sur `bg` | 15.6 | 16.1 | 4.5 |
| `text` sur `surface` | 17.2 | 14.7 | 4.5 |
| `text` sur `surface-2` | 14.3 | 13.0 | 4.5 |
| `text-2` sur `bg` | 6.9 | 8.4 | 4.5 |
| `text-2` sur `surface` | 7.6 | 7.7 | 4.5 |
| `text-2` sur `surface-2` | 6.3 | 6.8 | 4.5 |
| `on-primary` sur `primary` | 15.5 | 15.0 | 4.5 |
| `text` sur `primary-tint` | 13.5 | 12.0 | 4.5 |
| `primary` (liseré) sur `surface-2` | 12.9 | 13.0 | 3 |
| `on-bar` sur `bar` | 15.6 | 17.0 | 4.5 |
| `on-bar-2` sur `bar` | 10.7 | 8.9 | 4.5 |
| `primary-on-bar` (« Valider ») sur `bar` | 15.6 | 17.0 | 3 |
| `on-primary-on-bar` sur `primary-on-bar` | 15.6 | 15.0 | 4.5 |
| `tile-icon` sur `icon-tile` (olive) | 4.5 | 7.6 | 3 (initiale : 4.5, 22 / 800) |
| `tile-icon` sur `primary-tint` (option choisie du sélecteur) | 4.2 | 7.7 | 3 |
| `logo-glyph` sur `logo` | 5.4 | 9.6 | 3 |
| `logo` sur `bg` / `surface` | 4.9 / 5.4 | 10.3 / 9.4 | 3 |
| `success` sur `surface` / `surface-2` | 7.1 / 5.9 | 9.7 / 8.6 | 4.5 |
| `danger` sur `surface` / `surface-2` | 6.5 / 5.4 | 6.1 / 5.4 | 4.5 |
| `danger` sur `danger-tint` | 5.3 | 5.4 | 4.5 |
| `border-strong` sur `surface` / `bg` / `surface-2` | 3.9 / 3.5 / 3.2 | 3.7 / 4.1 / 3.3 | 3 |
| `focus` sur `bg` / `surface` / `surface-2` | 15.6 / 17.2 / 14.3 | 16.1 / 14.7 / 13.0 | 3 |

**Option choisie du sélecteur d'icône** : l'icône reste olive (`--color-tile-icon`) sur `--color-primary-tint`, soit 4.2:1 en clair et 7.7:1 en sombre. Une icône n'exige que 3:1 ; le choix est aussi porté par le contour 2 px, la coche et `aria-pressed`.

`--color-border` (`#DDDAD3` / `#3A3834`, 1.4:1) est **décoratif** : il ne doit jamais être la seule marque d'un élément interactif sans libellé. Un bouton avec texte, une carte avec nom et prix n'ont pas besoin d'un contour à 3:1.

## Mapping Mantine (`client/src/App.tsx`)

### Palette `encre` (10 nuances)

| Index | Hex | Rôle |
| --- | --- | --- |
| 0 | `#F7F6F3` | fond très clair |
| 1 | `#F2EFE8` | **primaire sombre** |
| 2 | `#E7E4DC` | `--color-primary-tint` (clair) ; survol du primaire en sombre |
| 3 | `#CFCCC4` | |
| 4 | `#A8A49C` | |
| 5 | `#85817A` | |
| 6 | `#57534E` | |
| 7 | `#3A3834` | |
| 8 | `#26241F` | **primaire clair** |
| 9 | `#1C1B19` | survol du primaire en clair |

`primaryShade: { light: 8, dark: 1 }` donne `#26241F` en clair et `#F2EFE8` en sombre. `red` et `green` gardent leurs index 5 en clair / 4 en sombre via `color="red"` / `color="green"`.

```ts
const encre: MantineColorsTuple = ['#F7F6F3','#F2EFE8','#E7E4DC','#CFCCC4','#A8A49C','#85817A','#57534E','#3A3834','#26241F','#1C1B19'];
// Neutres sombres graphite : 0 texte, 1 texte 2, 2 bordure forte, 4 bordure, 5 surface 2, 6 surface, 7 fond, 8 barre
const dark: MantineColorsTuple  = ['#F2EFE8','#B3AFA6','#7A766E','#5A5751','#3A3834','#282725','#1E1D1B','#141413','#0C0C0B','#080807'];

const theme = createTheme({
  primaryColor: 'encre',
  primaryShade: { light: 8, dark: 1 },
  colors: { encre, red, green, dark },
  black: '#1C1B19',   // texte sur le primaire clair du schéma sombre (autoContrast)
  white: '#FFFFFF',   // texte sur le primaire encre du schéma clair (autoContrast)
  autoContrast: true,
  // ...
});
```

Le `cssVariablesResolver` d'`App.tsx` fixe `body`, `text`, `dimmed`, `default*` et `error` sur les tokens ci-dessus, et les variantes `light` / `subtle` / `outline` de la primaire : fond `light` = `--color-primary-tint` (`#E7E4DC` / `#2E2D2A`), texte et contour encre (`#1C1B19` / `#26241F` en clair, `#F2EFE8` en sombre). **Jamais d'olive** dans ces variantes.

- `autoContrast: true` ne suffit pas : Mantine choisit la couleur du texte d'après la nuance du schéma **clair** et laisserait du blanc sur le crème du sombre (1.2:1). Les `Button` et `ActionIcon` pleins de la primaire et la page active de `Pagination` reçoivent donc `--color-on-primary` (blanc en clair, encre en sombre) via les `vars` du thème (`client/src/styles/primaryContrast.ts`). Les boutons rouges (suppression), gris ou verts gardent le contraste de Mantine.
- `defaultColorScheme="auto"` (D-041) ; la bascule persiste le choix de l'utilisateur.
- Valeurs de `variables.css` et du thème **identiques** ; si l'une change, l'autre change dans la même PR.
- Dans les composants, jamais de hex : `var(--color-…)` ou `color="encre"`, `red.5`.

## Règles

- Jamais de hex ni de nom CSS (`"red"`) dans un composant : `c="red.5"`, `var(--mantine-color-red-5)` ou `var(--color-danger)`.
- Une information de couleur est toujours doublée : icône, texte, graisse ou forme (ligne choisie de la colonne = fond `surface-2` + liseré **et** texte 800 + `aria-selected` ; remise = `IconDiscount` + signe « − » ; consigne = signe « − » + icône recyclage + bordure pointillée).
- Anneau de focus : jamais supprimé ; `outline: 2px solid var(--color-focus)` avec `outline-offset: 2px` (ou `-2px` sur les lignes de la colonne), `--color-focus-on-bar` dans la barre panier.
- Pas de dégradé, pas de couleur par mode de paiement. Seule bordure d'accent sur un côté : le liseré 3 px de la ligne choisie de la colonne des catégories (D-051).
