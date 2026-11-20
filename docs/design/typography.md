# Typographie — Caisse Claire

Police unique : **Manrope** (titres et corps), graisses **400, 600, 700, 800**. Repli : `system-ui, -apple-system, sans-serif`.

- Chargement : auto-hébergée (`@fontsource-variable/manrope` ou fichiers `woff2` dans l'appli), **pas** de requête vers Google Fonts à l'exécution : une caisse doit s'ouvrir sans réseau. `font-display: swap`.
- Chiffres : `font-variant-numeric: tabular-nums` sur **tous les montants et quantités** (prix, totaux, pavé, saisie) pour que les colonnes s'alignent. Si la police auto-hébergée n'expose pas `tnum`, le développeur le signale (le rendu proportionnel reste acceptable).
- Thème Mantine : `fontFamily` et `headings.fontFamily` = Manrope, `headings.fontWeight` = 800 (voir [colors.md](colors.md#mapping-mantine-clientsrcapptsx)). Échelle Mantine inchangée : xs 12, sm 14, md 16, lg 18, xl 20 px.

## Règles générales

- **Minimum 16 px (`md`)** pour tout texte du parcours de vente : catégories, noms, prix, quantités, libellés de boutons, menus.
- **14 px (`sm`)** autorisé uniquement pour une information annexe (date d'une commande, montant de remise sous un prix, nom « Caisse Claire » de l'en-tête), avec un contraste ≥ 4.5:1.
- **12 px (`xs`)** : interdit dans le parcours de vente.
- Interlignage : 1.15 pour les titres et noms d'association, 1.3 pour le corps. Espacement des lettres : `-0.02em` sur les gros chiffres et titres (≥ 24 px), neutre ailleurs.

## Échelle d'usage

| Élément | Taille | Graisse | Remarque |
| --- | --- | --- | --- |
| **Nom de l'association** (en-tête) | 24 px portrait / tablette / desktop ; 16 px paysage | 800 | Encre, **jamais coupé** : passe à la ligne, l'en-tête grandit (saisie limitée à 80 caractères) |
| Nom de l'appli « Caisse Claire » (en-tête) | 14 px | 700 | `--color-text-2` ; masqué en paysage (logo seul) |
| Onglet catégorie | 16 px | 700 (800 sélectionné) | |
| Nom produit (carte) | 16 px (`md`) ; 18 px (`lg`) en desktop | 600 | Jamais coupé, aligné à gauche |
| **Prix produit (carte)** | **20 px** | **800** | `nowrap`, tabulaire |
| Initiale de la pastille | 22 px | 800 | encre sur moutarde-tint |
| Nom ligne panier | 16 px | 600 | Jamais coupé |
| Prix ligne panier | 16 px | 700 | `nowrap` |
| Quantité (sélecteur) | 18 px | 800 | `miw={32}`, centré |
| Pastille de quantité sur carte | 14 px | 800 | |
| Remise sous le prix | 14 px | 600 | `--color-success` + `IconDiscount` |
| « Articles » + nombre (pied panier) | 16 px | 400 / 600 | `--color-text-2` pour le libellé |
| **Total panier** | **24 px** | **800** | `nowrap` |
| Total barre panier (portrait) / pied compact (paysage) | 26 px portrait / 20 px paysage | 800 | `nowrap`, `--color-on-bar` |
| « Valider » | 18 px | 800 | |
| Titre de modale | 18 px | 700 | |
| Titre commande (historique) | 16 px | 700 | |
| Date commande | 14 px | 400 | `--color-text-2` |
| Total commande | 18 px | 800 | `nowrap` |
| Encaissement : montant de rendu / saisie | 40 / 32 px | 800 | voir [components.md](components.md#encaissement--cartconfirmationmodal) |

## Règle « rien n'est coupé » (D-021)

- **Prix et totaux** : jamais tronqués, jamais renvoyés à la ligne → `style={{ whiteSpace: 'nowrap' }}` et conteneur `flex: none`. Pire cas à tester : « 999,99 € ».
- **Noms de produits** (cartes, lignes de panier, historique) : **jamais tronqués**. Pas de `truncate`, pas de `lineClamp`. Le nom passe à la ligne autant qu'il faut et le conteneur grandit (`h="auto"`). Ajouter `style={{ overflowWrap: 'anywhere' }}`. Cas de test : « Sandwich jambon-beurre », « Bière pression 25cl / 50cl ».
- **Nom de l'association** : même règle. Cas de test : « Comité des fêtes de Saint-Aubin-sur-Loire », « Amicale des pompiers de Val-de-Sèvre-en-Gâtine ».
- **Noms de catégories** : jamais tronqués non plus. En onglets « pilule », le texte reste sur une ligne (`nowrap`) et c'est la rangée qui défile horizontalement ; en colonne verticale, le nom passe à la ligne.
- Dans une même rangée nom + prix : le prix est `flex: none`, le nom `flex: 1; min-width: 0` et passe à la ligne.
