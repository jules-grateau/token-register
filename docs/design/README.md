# Direction artistique — token-register

> **Charte provisoire.** Elle encadre l'ergonomie et l'accessibilité dans le thème actuel
> (Mantine sombre, primaire jaune, titre orange) en attendant la refonte de l'identité
> (logo, nom, DA) prévue par **D-015**. Pas de nouvelle identité ici : seulement des règles.
>
> Validée par Jules (responsable produit) le 2026-11-20.

## Fichiers

| Fichier                                | Contenu                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| [colors.md](colors.md)                 | Palette, usages, contrastes WCAG                                                             |
| [typography.md](typography.md)         | Police, tailles, graisses, règle « noms jamais coupés »                                      |
| [spacing-layout.md](spacing-layout.md) | Zones tactiles, espacements, **les 3 mises en page et leurs critères de bascule**, maquettes |
| [icons.md](icons.md)                   | Icônes Tabler, correspondance icône ↔ action                                                |
| [components.md](components.md)         | Carte produit, ligne de panier, barre / Drawer panier, onglets catégorie, historique, toasts |

Tokens : `client/src/styles/variables.css` + thème Mantine dans `client/src/App.tsx`.
**Doc et tokens doivent rester synchronisés** : toute modification de l'un met à jour l'autre dans la même PR.

## Principes

1. **Vendre vite** : l'action principale (ajouter un produit, « Valider ») est toujours visible sans scroll, en 1 toucher.
2. **Lisible à bout de bras** : texte ≥ 16 px dans le parcours de vente, prix en gras, total en très gros.
3. **Toucher d'abord** : toute zone interactive ≥ 44 × 44 px (`--touch-min`), 56 px si l'espace le permet (`--touch-comfort`).
4. **Un seul défilement vertical par zone** : jamais de scroll dans un scroll.
5. **Rien n'est coupé** : un prix n'est jamais tronqué ni renvoyé à la ligne ; un nom de produit n'est jamais tronqué (il passe à la ligne).
6. **Jetons ou euros** : toute mise en page doit tenir avec « 999,99 € » (pire cas).
7. **Accessibilité AA** : texte ≥ 4.5:1, icônes et bordures utiles ≥ 3:1, focus visible, jamais d'information portée par la seule couleur.

## Do / Don't

| Do                                                                | Don't                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Couleurs Mantine nommées (`red.6`, `teal.4`) ou tokens `var(--…)` | Couleur codée en dur (`"red"`, `#f00`, `#07bc0c`)             |
| `autoContrast` pour le texte sur fond jaune (texte noir)          | Texte blanc sur jaune (1.9–2.1:1)                             |
| Icône **et** texte ou aria-label pour chaque action               | Icône seule sans aria-label ; état porté par la seule couleur |
| `nowrap` sur les prix, `overflow-wrap: anywhere` sur les noms     | `truncate` / `lineClamp` sur un nom de produit                |
| Hauteur `auto` + `mih` pour les cartes                            | Hauteur fixe sur un conteneur dont le contenu varie           |
| Boutons frères dans une carte                                     | `<button>` dans un `<button>`                                 |

## Points de rupture (résumé)

Trois mises en page, détail et maquettes dans [spacing-layout.md](spacing-layout.md#mises-en-page) :

| Mode                   | Critère (évalué dans cet ordre)                       |
| ---------------------- | ----------------------------------------------------- |
| **Téléphone paysage**  | `(orientation: landscape) and (max-height: 499.98px)` |
| **Téléphone portrait** | `(orientation: portrait) and (max-width: 575.98px)`   |
| **Desktop**            | `(min-width: 992px)` (Mantine `md`)                   |
| **Tablette**           | tout le reste (576 – 991 px de large)                 |

Les deux orientations du téléphone sont prises en charge : pas d'écran « Tournez votre téléphone ».
Largeur minimale supportée : 360 px.
