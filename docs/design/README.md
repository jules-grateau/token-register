# Direction artistique — Caisse Claire

> **Charte « Caisse Claire »** (refonte de l'identité, **D-015 levée**). Elle remplace la charte
> provisoire. Direction retenue par Jules (responsable produit) le 2026-11-20 : direction **E**,
> structure « Comptoir », police Manrope (D-039). Palette **« Graphite + olive »** et colonne des
> catégories « liseré + teinte » (D-051, remplace la moutarde de D-039). **Seul le visuel change** :
> toutes les règles d'ergonomie, d'accessibilité, de mise en page et d'encaissement déjà validées restent.

## Identité

| | |
| --- | --- |
| **Nom** | **Caisse Claire** (neutre : ni « token », ni « buvette » ; marche en jetons comme en euros) |
| **Accroche** | « Une caisse simple, claire et nette. » |
| **Logo** | Un ticket de caisse à bord dentelé, deux lignes de texte, sur carré arrondi **olive** : ticket blanc sur `#5C7316` en clair, encre sur `#B5CC55` en sombre. Dans l'appli : composant `BrandLogo` (SVG en ligne, tokens `--color-logo` / `--color-logo-glyph`). Fichiers : `client/src/assets/brand/` (`logo.svg` version claire, `logo-mark-mono.svg` une couleur `currentColor`, `favicon.svg` clair et `favicon-dark.svg` sombre choisis par `prefers-color-scheme`, lisibles dès 16 px) |
| **Couleurs** | Neutres **graphite**, **encre** pour l'action et le texte, **olive en touches** (pastilles-icônes et logo seulement), plus le succès et le danger, fonctionnels |
| **Police** | Manrope |
| **Thèmes** | Clair (graphite clair) **et** sombre (graphite), au choix de l'utilisateur |

### Ton

Sobre, aéré, sans fioritures. Formes généreuses (rayons 14 à 20 px, pilules), ombres très douces en clair, bordures fines graphite, pastilles-icônes teintées olive, aplats encre pour l'action. L'écran n'a **qu'une** couleur d'action : l'encre. L'olive n'est qu'une touche (pastilles, logo).

### Hiérarchie de l'en-tête : le client d'abord

L'appli sert des associations : **le nom de l'association est le titre de l'écran** (24 / 800, encre). « Caisse Claire » et le logo restent discrets (logo 28 px, nom 14 / 700 en texte secondaire). Détail dans [components.md](components.md#en-tête-global).

## Fichiers

| Fichier | Contenu |
| --- | --- |
| [colors.md](colors.md) | Tokens clair **et** sombre, contrastes, mapping Mantine (palette `encre` 10 nuances) |
| [typography.md](typography.md) | Manrope, échelle, chiffres tabulaires, règle « noms jamais coupés » |
| [spacing-layout.md](spacing-layout.md) | Zones tactiles, espacements, rayons, ombres, **4 mises en page et critères de bascule**, maquettes |
| [icons.md](icons.md) | Icônes Tabler, pastilles-icônes, correspondance icône ↔ action |
| [components.md](components.md) | En-tête, onglets, carte produit, panier, historique, encaissement, modales, toasts, « À propos », bascule de thème |

Tokens : `client/src/styles/variables.css` + thème Mantine dans `client/src/App.tsx`.
**Doc et tokens doivent rester synchronisés** : toute modification de l'un met à jour l'autre dans la même PR.

## Principes

1. **Vendre vite** : l'action principale (ajouter un produit, « Valider ») est toujours visible sans scroll, en 1 toucher.
2. **Lisible à bout de bras** : texte ≥ 16 px dans le parcours de vente, prix en gras, total en très gros.
3. **Toucher d'abord** : toute zone interactive ≥ 44 × 44 px (`--touch-min`), 56 px si l'espace le permet (`--touch-comfort`).
4. **Un seul défilement vertical par zone** : jamais de scroll dans un scroll.
5. **Rien n'est coupé** : un prix n'est jamais tronqué ni renvoyé à la ligne ; un nom de produit (D-021) ni un nom d'association ne sont jamais tronqués (ils passent à la ligne).
6. **Jetons ou euros** : toute mise en page doit tenir avec « 999,99 € » (pire cas).
7. **Accessibilité AA** : texte ≥ 4.5:1, icônes et bordures utiles ≥ 3:1, focus visible, jamais d'information portée par la seule couleur.
8. **Une seule couleur d'action** : l'encre (`--color-primary`, crème en sombre). Sur la barre panier encre, « Valider » passe en crème (`--color-primary-on-bar`). L'olive ne sert jamais à une action, un état ou une sélection.

## Do / Don't

| Do | Don't |
| --- | --- |
| Tokens `var(--…)` ou couleurs Mantine nommées (`color="encre"`, `red.5`) | Couleur codée en dur (`"red"`, `#f00`, `#5C7316` dans un composant) |
| `autoContrast` : texte blanc sur l'encre (clair), encre sur le crème (sombre) | Olive hors des pastilles-icônes et du logo |
| Icône **et** texte ou `aria-label` pour chaque action | Icône seule sans `aria-label` ; état porté par la seule couleur |
| `nowrap` sur les prix, `overflow-wrap: anywhere` sur les noms | `truncate` / `lineClamp` sur un nom de produit ou d'asso |
| Hauteur `auto` + `mih` pour les cartes | Hauteur fixe sur un conteneur dont le contenu varie |
| Boutons frères dans une carte | `<button>` dans un `<button>` |
| Ombre douce (`--shadow-card`) ou bordure fine, jamais les deux sur la même carte en sombre | Dégradés, bordure d'accent sur un seul côté (sauf le liseré de la colonne des catégories), ombres dures |
| Fond graphite (`--color-bg`, `--color-surface`) | Gris froid Mantine par défaut, noir pur en fond |

## Points de rupture (résumé)

Quatre mises en page, détail et maquettes dans [spacing-layout.md](spacing-layout.md#mises-en-page) :

| Mode | Critère (évalué dans cet ordre) |
| --- | --- |
| **Téléphone paysage** | `(orientation: landscape) and (max-height: 499.98px)` |
| **Téléphone portrait** | `(orientation: portrait) and (max-width: 575.98px)` |
| **Desktop** | `(min-width: 992px)` (Mantine `md`) |
| **Tablette** | tout le reste (576 – 991 px de large) |

Les deux orientations du téléphone sont prises en charge : pas d'écran « Tournez votre téléphone ».
Largeur minimale supportée : 360 px.
