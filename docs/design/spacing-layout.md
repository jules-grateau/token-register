# Espacements et mises en page (charte provisoire)

## Tokens (`client/src/styles/variables.css`)

| Token               | Valeur | Usage                                                                           |
| ------------------- | ------ | ------------------------------------------------------------------------------- |
| `--touch-min`       | 44px   | Taille minimale de toute zone interactive (largeur **et** hauteur)              |
| `--touch-comfort`   | 56px   | Actions fréquentes quand l'espace le permet (en-tête portrait/tablette/desktop) |
| `--cart-bar-height` | 72px   | Barre panier repliée (téléphone portrait), hors zone sûre                       |

Espacements : échelle Mantine (xs 10, sm 12, md 16, lg 20, xl 32 px). Rayons : `md` par défaut, `sm` pour les cartes, `xl` pour les onglets « pilule ». Ombres : `shadow="md"` pour menus, Drawer, barre panier ; rien d'autre.

## Zones tactiles

- Toute cible ≥ 44 × 44 px : `ActionIcon size={44}` (ou `w`/`h` explicites), `Button size="md"` minimum (42 px → forcer `h={44}`) ou `size="lg"` (50 px).
- Entre deux cibles adjacentes sans séparateur : 8 px minimum.
- Focus visible : conserver le focus ring Mantine, ne jamais le supprimer.

## Mises en page

### Critère de bascule

Un hook unique, `client/src/hooks/useLayoutMode.ts`, renvoie `'phone-portrait' | 'phone-landscape' | 'tablet' | 'desktop'`, évalué **dans cet ordre** avec `useMediaQuery` de `@mantine/hooks` (`{ getInitialValueInEffect: false }`) :

| Ordre | Mode              | Media query                                           | Exemples                                                 |
| ----- | ----------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| 1     | `phone-landscape` | `(orientation: landscape) and (max-height: 499.98px)` | iPhone 13 tourné 750×342, Pixel 915×412, Pro Max 932×430 |
| 2     | `phone-portrait`  | `(orientation: portrait) and (max-width: 575.98px)`   | 360×740, 390×664                                         |
| 3     | `desktop`         | `(min-width: 992px)`                                  | 1280×800, iPad paysage 1024+                             |
| 4     | `tablet`          | sinon                                                 | 768×1024, 600×960, 820×1180                              |

La largeur seule ne suffit pas : un téléphone en paysage fait 750–932 px de large mais moins de 500 px de haut. Toute la mise en page (Register, Catalog, Cart, position des toasts) lit ce hook ; pas de breakpoints Mantine `base/sm/md` mélangés pour la structure.

Racine : `height: 100dvh` (et non `100vh`), `padding-inline: env(safe-area-inset-left) env(safe-area-inset-right)`.

### Récapitulatif

|                 | Téléphone portrait                   | Téléphone paysage                                               | Tablette                                              | Desktop                       |
| --------------- | ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| En-tête         | 56 px                                | **44 px**                                                       | 56 px                                                 | inchangé                      |
| Catégories      | Onglets pilule en rangée (60 px)     | Onglets pilule en rangée (52 px)                                | Colonne **200 px fixe** (rangée si largeur < 768)     | Colonne actuelle, `miw={200}` |
| Grille produits | 2 colonnes                           | 3 colonnes (4 si largeur ≥ 920)                                 | 2 colonnes                                            | 3 (`md`) / 4 (`lg`), inchangé |
| `mih` carte     | 96                                   | 72                                                              | 120                                                   | 200                           |
| Marge grille    | `sm`                                 | `xs`                                                            | `sm`                                                  | `xl`                          |
| Panier          | **Barre repliée 72 px + Drawer bas** | **Colonne droite toujours visible** `clamp(260px, 38vw, 320px)` | Colonne droite, ratio actuel (catalogue 3 / panier 2) | inchangé                      |
| Historique      | Icône dans l'en-tête                 | Icône dans l'en-tête                                            | En-tête du panier                                     | En-tête du panier             |
| Vider le panier | En-tête du Drawer                    | Pied du panier                                                  | En-tête du panier                                     | En-tête du panier             |

### 1. Téléphone portrait

Pile verticale : en-tête 56 → onglets 60 → grille (**seule zone qui défile**) → barre panier `var(--cart-bar-height)` + `env(safe-area-inset-bottom)`, dernier élément de la colonne (dans le flux, pas en `fixed`).

```
+--------------------------------------+
| Token Register          [hist] [cfg] |  56   ActionIcon 56×56
+--------------------------------------+
| (Toutes) [Boissons] [Snacks] [Desse>|  60   onglets 44, défilement horizontal
+--------------------------------------+
| +----------------+ +----------------+ |
| |   Café long    | | Bière pression | |
| |    1,50 €      | |  25cl / 50cl   | |  le nom passe à la ligne,
| |                | |    3,00 €      | |  la rangée prend la hauteur
| +----------------+ +----------------+ |  de la plus haute carte
| +----------------+ +----------------+ |
| |   Thé          | |  Crêpe sucre   | |
| |    1,00 €      | |    2,50 €      | |
| +----------------+ +----------------+ |
+--------------------------------------+
| 3 articles      [^]  [   VALIDER   ] |  72   fixe, shadow md
| 4,50 €                               |
+--------------------------------------+
```

Panier déplié : `Drawer position="bottom" size="85%"`.

```
+--------------------------------------+
|  (catalogue assombri, overlay)       |
+==================--==================+
| Panier                  [vider] [X]  |  56   ActionIcon 44
+--------------------------------------+
| Café long                     3,00 € |
| [ - ]  2  [ + ]                  [:] |
|--------------------------------------|
| Bière pression 25cl /         2,50 € |
| 50cl               [%] −0,50 €       |
| [ - ]  1  [ + ]                  [:] |  lignes : seule zone qui défile
+--------------------------------------+
| Articles                           3 |
| Total                         5,50 € |  24 px / 800
| [             VALIDER              ] |  size="lg"
+--------------------------------------+
```

### 2. Téléphone paysage

En-tête compact 44 px sur toute la largeur. Dessous, deux colonnes : catalogue (onglets en haut + grille qui défile) à gauche, **panier toujours visible** à droite, pleine hauteur. Exemple 750 × 342 utiles : en-tête 44, onglets 52, grille 246 px de haut (≈ 3 rangées de cartes 72 px → 8–9 produits visibles), panier 285 × 298.

```
+------------------------------------------------------------------------------+
| Token Register                                              [hist]  [cfg]    |  44
+------------------------------------------------+-----------------------------+
| (Toutes) [Boissons] [Snacks] [Desserts] [Div> | Café long            3,00 € |
+------------------------------------------------+ [ - ]  2  [ + ]         [:] |
| +-------------+ +-------------+ +-------------+|-----------------------------|
| | Café long   | | Bière       | | Thé         || Crêpe sucre          2,50 € |
| |   1,50 €    | | pression    | |   1,00 €    ||        [%] −0,50 €          |
| +-------------+ | 25cl / 50cl | +-------------+| [ - ]  1  [ + ]         [:] |
| +-------------+ |   3,00 €    | +-------------+|    (lignes : défilement)    |
| | Crêpe sucre | +-------------+ | Gaufre      ||                             |
| |   2,50 €    | +-------------+ |   2,00 €    |+-----------------------------+
| +-------------+ | Cookie      | +-------------+| [vider] 3 articles [VALIDER]|  60
|                                                |         5,50 €              |
+------------------------------------------------+-----------------------------+
 <---------------- flex: 1 (≈ 465) ---------------><-- clamp(260,38vw,320) ≈ 285 -->
```

- En-tête : 44 px, titre 18 px, `ActionIcon` 44 × 44 (historique, réglages).
- Onglets : rangée de 52 px (onglets 44 + `py={4}`), au-dessus du catalogue uniquement.
- Grille : `cols` 3, 4 si `(min-width: 920px)` ; `spacing="xs"`, `p="xs"`, `mih={72}`, `p="xs"` dans la carte.
- Panier : `w="clamp(260px, 38vw, 320px)"`, bordure gauche, **sans en-tête** (historique dans l'en-tête global). Lignes en 2 rangées (même composant), seule zone qui défile. Pied compact d'une rangée de 60 px (`p="xs"`, `wrap="nowrap"`) : vider (`ActionIcon` 44) · pile « 3 articles » 16 px `dimmed` / total 20 px 800 · « Valider » `h={44}` `flex: 1` `miw={110}`.
- Mode édition : pas de panier ; catalogue pleine largeur, grille 4 colonnes ; actions de catégorie en bout de rangée d'onglets (voir maquette édition).

### 3. Tablette (576 – 991 px, hors téléphone paysage)

Disposition actuelle en ligne : catalogue à gauche (`flex: 3`), panier à droite (`flex: 2`).

- Catégories : colonne **200 px fixe** (`w={200}`, `flex: none`), au lieu du ratio 1/9. Si la largeur < 768 px (petites tablettes / pliables en portrait), onglets pilule en rangée au-dessus de la grille comme sur téléphone.
- Grille : 2 colonnes, `spacing="sm"`, `p="sm"`, `mih={120}`.
- Panier : en-tête (historique, vider, 48 × 48), lignes 2 rangées, pied standard (Articles 16, Total 24/800, « Valider » `size="lg"`).

### 4. Desktop (≥ 992 px)

Inchangé, sauf : colonne de catégories `miw={200}`, noms de catégorie qui passent à la ligne, icônes d'édition 44 px de large, tailles de texte du panier, couleurs, toasts.

### Mode édition — téléphone portrait

Pas de barre panier. Une barre d'outils de catégorie (52 px) sous les onglets agit sur la catégorie sélectionnée.

```
+--------------------------------------+
| Token Register   [✓ Terminer]  [cfg] |  56   bordure basse 2px jaune
+--------------------------------------+
| (Toutes) [Boissons] [Snacks] [+ Cat.>|  60   « + Nouvelle catégorie » = dernier onglet
+--------------------------------------+
| Boissons      [✎ Modifier] [🗑 Suppr.]|  52   masquée sur « Toutes »
+--------------------------------------+
| +- - - - - - - - + +----------------+ |
| :      (+)       : |   Café long    | |  toucher la carte = modifier
| :Nouveau produit : |    1,50 €      | |
| :                : |-------+--------| |
| +- - - - - - - - + |   ✎   |   🗑   | |  48
|                    +----------------+ |
+--------------------------------------+
```

### Mode édition — téléphone paysage

```
+------------------------------------------------------------------------------+
| Token Register                                       [✓ Terminer]   [cfg]    |  44
+------------------------------------------------------------------------------+
| (Toutes) [Boissons] [Snacks] [Desserts] [+ Catégorie]  >       |  [✎]  [🗑]  |  52
+------------------------------------------------------------------------------+
| +- - - - - - -+ +-------------+ +-------------+ +-------------+              |
| :    (+)      : | Café long   | | Bière       | | Thé         |              |
| :  Nouveau    : |   1,50 €    | | pression    | |   1,00 €    |              |
| :  produit    : |------+------| | 25cl / 50cl | |------+------|              |
| +- - - - - - -+ |  ✎   |  🗑  | |   3,00 €    | |  ✎   |  🗑  |              |
|                 +-------------+ |------+------| +-------------+              |
+------------------------------------------------------------------------------+
```

Les deux `ActionIcon` 44 × 44 (aria-label « Modifier la catégorie » / « Supprimer la catégorie ») sont fixes à droite de la rangée (hors défilement), séparés par une bordure gauche ; masqués sur « Toutes ».
