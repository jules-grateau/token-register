# Couleurs — Caisse Claire

Deux couleurs : **moutarde** (l'action) et **encre** (le texte, la barre panier, les repères forts). Le succès et le danger sont fonctionnels. Schémas **clair** et **sombre**, au choix de l'utilisateur (`colorScheme`, voir « Bascule de thème » dans [components.md](components.md#bascule-clairsombre--menu-réglages)). Les ratios ci-dessous sont calculés (WCAG 2.x) ; le script de contraste du dépôt fait foi.

> **Règle d'or** : en clair, la moutarde est un **fond** (texte encre dessus), jamais un texte ni un trait seul (2.1:1 sur blanc). En sombre, elle peut être texte, icône, trait ou fond.

## Tokens

Variables CSS dans `client/src/styles/variables.css` : `:root` (clair) et `[data-mantine-color-scheme='dark']` (sombre).

| Rôle | Variable | Clair | Sombre | Usage |
| --- | --- | --- | --- | --- |
| Fond | `--color-bg` | `#FBF5E6` | `#16130C` | `body`, zone catalogue |
| Surface | `--color-surface` | `#FFFFFF` | `#211C12` | cartes, en-tête, modales, Drawer |
| Surface 2 | `--color-surface-2` | `#F4ECD6` | `#2A2418` | survol / appui, bloc de rendu, champ de saisie |
| Texte | `--color-text` | `#1F1A0F` | `#F6EFDC` | tout le texte courant, l'« encre » |
| Texte 2 | `--color-text-2` | `#5E5644` | `#B7AD93` | `dimmed` : « Articles », date, libellés annexes |
| Bordure | `--color-border` | `#EADFC4` | `#3A3220` | séparateurs, contours de carte (décoratif) |
| Bordure forte | `--color-border-strong` | `#8A7F66` | `#7C7358` | contours **utiles** : carte « Nouveau produit » en pointillés, icônes sans fond |
| **Primaire (moutarde)** | `--color-primary` | `#E2A831` | `#F0B93A` | « Valider », onglet sélectionné, « Terminer », logo |
| Sur primaire | `--color-on-primary` | `#1F1A0F` | `#1F1A0F` | texte et icônes sur moutarde (toujours encre) |
| Teinte moutarde | `--color-primary-tint` | `#F6E2A8` | `#3A2F12` | pastille-icône, bouton `−` de quantité, état « À rendre » |
| Barre (encre) | `--color-bar` | `#1F1A0F` | `#0E0C07` | barre panier repliée (portrait), pied de panier compact |
| Sur barre | `--color-on-bar` | `#FBF5E6` | `#F6EFDC` | total, texte dans la barre |
| Sur barre 2 | `--color-on-bar-2` | `#D9CFB4` | `#B7AD93` | « N articles » dans la barre |
| Succès | `--color-success` | `#166534` | `#4ADE80` | remise (avec `IconDiscount`), « Rien à rendre » |
| Teinte succès | `--color-success-tint` | `#DDF3E2` | `#17301F` | fond de badge de succès |
| Danger | `--color-danger` | `#B91C1C` | `#F87171` | supprimer, vider, prix négatif (consigne), « Il manque » |
| Teinte danger | `--color-danger-tint` | `#FBE4E4` | `#3A2022` | pastille de la consigne, bouton « Supprimer » (historique) |
| Info (neutre) | `--color-info-bg` / `--color-info-text` | `#1F1A0F` / `#FBF5E6` | `#F6EFDC` / `#16130C` | toasts d'information (« Panier vidé »). **Pas de bleu** : l'info est l'encre inversée |
| Icône d'accent | `--color-icon-accent` | `#1F1A0F` | `#F0B93A` | icône « Modifier », `IconCoins` du rendu : encre en clair, moutarde en sombre |
| Focus | `--color-focus` | `#1F1A0F` | `#F0B93A` | anneau de focus 2 px + `outline-offset: 2px` |
| Focus sur barre | `--color-focus-on-bar` | `#FBF5E6` | `#F0B93A` | anneau dans la barre panier (encre sur encre invisible) |

Toasts (react-toastify, branchés via `--toastify-*`) :

| État | Fond clair / sombre | Texte clair / sombre | Ratio |
| --- | --- | --- | --- |
| Succès `--color-success-bg` / `-text` | `#166534` / `#4ADE80` | `#FFFFFF` / `#0B2A17` | 7.1 / 8.7 |
| Erreur `--color-danger-bg` / `-text` | `#B91C1C` / `#F87171` | `#FFFFFF` / `#3A0B0B` | 6.5 / 6.2 |
| Info `--color-info-bg` / `-text` | `#1F1A0F` / `#F6EFDC` | `#FBF5E6` / `#16130C` | 15.9 / 15.1 |

Les anciennes variables `--color-primary-*` / `--color-secondary-*` (palette Google) sont **supprimées** : `ErrorBoundary` passe sur les tokens ci-dessus.

## Contrastes attendus

Texte ≥ 4.5:1 ; icônes, bordures utiles, anneau de focus ≥ 3:1.

| Paire | Clair | Sombre | Exigence |
| --- | --- | --- | --- |
| `text` sur `bg` | 15.9 | 16.2 | 4.5 |
| `text` sur `surface` | 17.3 | 14.8 | 4.5 |
| `text` sur `surface-2` | 14.7 | 13.7 | 4.5 |
| `text-2` sur `bg` | 6.7 | 8.3 | 4.5 |
| `text-2` sur `surface` | 7.3 | 7.6 | 4.5 |
| `text-2` sur `surface-2` | 6.2 | 6.9 | 4.5 |
| `on-primary` (encre) sur `primary` | 8.1 | 9.7 | 4.5 |
| `text` sur `primary-tint` | 13.5 | 11.6 (crème) | 4.5 |
| `primary` sur `primary-tint` (icône, sombre) | n/a (clair : icône encre) | 7.3 | 3 |
| `primary` sur `surface` / `bg` (sombre : texte, trait) | **interdit** (2.1) | 9.5 / 10.3 | 3 / 4.5 |
| `on-bar` sur `bar` | 15.9 | 17 | 4.5 |
| `on-bar-2` sur `bar` | 11.2 | 8 | 4.5 |
| `primary` (bouton « Valider ») sur `bar` | 8.1 | 10.8 | 3 |
| `success` sur `surface` / `surface-2` | 7.1 / 6.1 | 9.7 / 8.8 | 4.5 |
| `danger` sur `surface` / `surface-2` | 6.5 / 5.5 | 6.1 / 5.6 | 4.5 |
| `danger` sur `danger-tint` | 5.2 | 5.4 | 4.5 |
| `border-strong` sur `surface` / `bg` / `surface-2` | 4.0 / 3.6 / 3.4 | 3.6 / 3.9 / 3.3 | 3 |
| `focus` sur `bg` / `surface` | 15.9 / 17.3 | 10.3 / 9.5 | 3 |

`--color-border` (`#EADFC4` / `#3A3220`) est **décoratif** (< 3:1) : il ne doit jamais être la seule marque d'un élément interactif sans libellé. Un bouton avec texte, une carte avec nom et prix n'ont pas besoin d'un contour à 3:1.

## Mapping Mantine (`client/src/App.tsx`)

### Palette `moutarde` (10 nuances)

| Index | Hex | Rôle |
| --- | --- | --- |
| 0 | `#FDF7E4` | fond très clair |
| 1 | `#F9EBC0` | état « À rendre » (clair) |
| 2 | `#F6E2A8` | `--color-primary-tint` (clair) |
| 3 | `#F2D27C` | survol des fonds teintés |
| 4 | `#F0B93A` | **primaire sombre** |
| 5 | `#E2A831` | **primaire clair** |
| 6 | `#C48F1F` | appui (clair) |
| 7 | `#9C7016` | |
| 8 | `#6F500F` | |
| 9 | `#3A2F12` | `--color-primary-tint` (sombre) |

Trick : `primaryShade: { light: 5, dark: 4 }` donne `#E2A831` en clair et `#F0B93A` en sombre. La même astuce vaut pour `red` et `green` (danger et succès aux index 5 en clair / 4 en sombre) : `color="red"` donne ainsi `#B91C1C` en clair et `#F87171` en sombre.

```ts
const moutarde: MantineColorsTuple = ['#FDF7E4','#F9EBC0','#F6E2A8','#F2D27C','#F0B93A','#E2A831','#C48F1F','#9C7016','#6F500F','#3A2F12'];
const red: MantineColorsTuple    = ['#FEF2F2','#FBE4E4','#FBCACA','#F9A8A8','#F87171','#B91C1C','#991B1B','#7F1D1D','#5F1515','#3A0B0B'];
const green: MantineColorsTuple  = ['#F0FDF4','#DDF3E2','#BBE8C8','#8FD9A8','#4ADE80','#166534','#14532D','#0F3D22','#0B2A17','#071A0E'];
// Neutres sombres chauds : index 0 = texte, 1 = texte 2, 4 = bordure, 5 = surface 2, 6 = surface, 7 = fond, 8 = barre
const dark: MantineColorsTuple   = ['#F6EFDC','#B7AD93','#7C7358','#5A523F','#3A3220','#2A2418','#211C12','#16130C','#0E0C07','#0A0905'];

const theme = createTheme({
  primaryColor: 'moutarde',
  primaryShade: { light: 5, dark: 4 },
  colors: { moutarde, red, green, dark },
  black: '#1F1A0F',            // texte sur moutarde (autoContrast)
  white: '#FFFFFF',
  autoContrast: true,          // texte encre sur moutarde, blanc sur danger / succès clair
  fontFamily: 'Manrope, system-ui, sans-serif',
  headings: { fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: '800' },
  defaultRadius: 'md',
  radius: { xs: '8px', sm: '12px', md: '14px', lg: '20px', xl: '999px' },
});

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#FBF5E6',
    '--mantine-color-text': '#1F1A0F',
    '--mantine-color-dimmed': '#5E5644',
    '--mantine-color-default': '#FFFFFF',
    '--mantine-color-default-hover': '#F4ECD6',
    '--mantine-color-default-color': '#1F1A0F',
    '--mantine-color-default-border': '#EADFC4',
  },
  dark: {
    '--mantine-color-body': '#16130C',
    '--mantine-color-text': '#F6EFDC',
    '--mantine-color-dimmed': '#B7AD93',
    '--mantine-color-default': '#211C12',
    '--mantine-color-default-hover': '#2A2418',
    '--mantine-color-default-color': '#F6EFDC',
    '--mantine-color-default-border': '#3A3220',
  },
});
// <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="light">
```

Les hex ci-dessus sont dans le **thème** (une seule source) ; dans les composants, on n'écrit jamais de hex : `var(--color-…)` ou `moutarde.5`, `red.5`.

- `autoContrast: true` + `black: '#1F1A0F'` : tout fond moutarde reçoit un texte encre (8.1 / 9.7:1). Vérifier que le seuil par défaut (luminance 0.3) l'applique bien à `#E2A831` (luminance 0.44) ; sinon forcer `c="var(--color-on-primary)"`.
- `defaultColorScheme` : voir « points à trancher » (README du compte rendu) ; la bascule persiste le choix de l'utilisateur.
- Valeurs de `variables.css` et du thème **identiques** ; si l'une change, l'autre change dans la même PR.

## Règles

- Jamais de hex ni de nom CSS (`"red"`) dans un composant : `c="red.5"`, `var(--mantine-color-red-5)` ou `var(--color-danger)`.
- Une information de couleur est toujours doublée : icône, texte ou forme (onglet sélectionné = fond plein **et** `aria-selected` ; remise = `IconDiscount` + signe « − » ; consigne = signe « − » + icône recyclage + bordure pointillée).
- Anneau de focus : jamais supprimé ; `outline: 2px solid var(--color-focus)` avec `outline-offset: 2px`, `--color-focus-on-bar` dans la barre panier.
- Pas de dégradé, pas de bordure d'accent sur un seul côté, pas de couleur par mode de paiement.
