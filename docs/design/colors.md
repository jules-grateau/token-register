# Couleurs (charte provisoire)

Schéma unique : **sombre** (`defaultColorScheme="dark"`). Pas de thème clair pour l'instant.
Palette Mantine v8 par défaut ; en sombre, `primaryShade` vaut 8 → le jaune « filled » est **yellow-8 #F59F00**.

## Réglages du thème (`client/src/App.tsx`)

```ts
const theme = createTheme({
  primaryColor: 'yellow',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  autoContrast: true, // texte noir sur fonds clairs (jaune, badges)
});

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: { '--mantine-color-dimmed': 'var(--mantine-color-dark-1)' }, // #B8B8B8
});
// <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="dark">
```

## Palette et usages

| Rôle                             | Valeur                             | Usage                                                              |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Fond appli / panier / Drawer     | dark-7 `#242424`                   | `body`, `Paper`, `Drawer`                                          |
| Fond surfaces                    | dark-6 `#2E2E2E`                   | En-tête, cartes produit, `Card`                                    |
| Fond sélection (liste verticale) | dark-5 `#3B3B3B`                   | Catégorie sélectionnée en colonne                                  |
| Bordure                          | dark-4 `#424242`                   | `--mantine-color-default-border`                                   |
| Texte principal                  | `#C9C9C9` / blanc                  | Texte Mantine par défaut                                           |
| **Texte secondaire** (`dimmed`)  | dark-1 **`#B8B8B8`**               | « Articles », date, libellés annexes                               |
| **Primaire**                     | yellow-8 `#F59F00`, texte **noir** | « Valider », onglet sélectionné, badge « Édition », icône modifier |
| Titre                            | `orange` Mantine (inchangé)        | Uniquement « Token Register » (≥ 18 px gras)                       |
| **Danger**                       | red-6 **`#FA5252`**                | Icônes supprimer / vider ; boutons `color="red"`                   |
| **Remise**                       | teal-4 **`#38D9A9`**               | Montant de remise (toujours avec `IconDiscount`)                   |

## États (toasts) — tokens `variables.css`

| État   | Fond                         | Texte                          | Contraste |
| ------ | ---------------------------- | ------------------------------ | --------- |
| Succès | `--color-success-bg` #81C995 | `--color-success-text` #1E3E23 | 6.1:1     |
| Erreur | `--color-danger-bg` #F28B82  | `--color-danger-text` #461A17  | 6.2:1     |
| Info   | `--color-info-bg` #89B4F8    | `--color-info-text` #172A4F    | 6.7:1     |

Branchés sur react-toastify via les variables `--toastify-*` (voir `variables.css`). Avant : succès #07BC0C / blanc 2.6:1, erreur #E74C3C / blanc 3.8:1 (échec AA).

## Contrastes vérifiés

| Paire                                                              | Ratio       | Exigence                               |
| ------------------------------------------------------------------ | ----------- | -------------------------------------- |
| Noir sur yellow-8 #F59F00 (« Valider »)                            | 9.8:1       | 4.5 ✔ (blanc : 2.1 ✘)                 |
| #B8B8B8 sur #242424 / #2E2E2E                                      | 7.8 / 6.8:1 | 4.5 ✔ (ancien #828282 : 4.0 / 3.5 ✘)  |
| teal-4 #38D9A9 sur #242424                                         | 8.6:1       | 4.5 ✔ (ancien teal-8 #099268 : 3.9 ✘) |
| red-6 #FA5252 sur #242424 / #2E2E2E (icône)                        | 4.7 / 4.1:1 | 3 ✔                                   |
| yellow-8 #F59F00 sur #2E2E2E (icône modifier)                      | 6.4:1       | 3 ✔                                   |
| red-4 #FF8787 sur fond `light` rouge (bouton Supprimer historique) | 5.3:1       | 4.5 ✔                                 |

## Règles

- Jamais de hex ni de nom CSS (`"red"`) dans un composant : couleur Mantine (`c="red.6"`, `var(--mantine-color-red-6)`) ou token `var(--color-…)`.
- Une information de couleur est toujours doublée : icône, texte ou forme (onglet sélectionné = fond plein **et** `aria-selected` ; remise = icône + signe « − »).
- La palette Google de `variables.css` (`--color-primary-*`, `--color-secondary-*`) n'est utilisée que par `ErrorBoundary` ; ne pas l'étendre. Elle sera fusionnée lors de la refonte.
