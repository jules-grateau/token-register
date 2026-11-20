# Typographie (charte provisoire)

Police : `system-ui, -apple-system, sans-serif` (thème Mantine). Échelle Mantine : xs 12, sm 14, md 16, lg 18, xl 20 px.

## Règles générales

- **Minimum 16 px (`md`)** pour tout texte du parcours de vente : catégories, noms, prix, quantités, libellés de boutons, menus.
- **14 px (`sm`)** autorisé uniquement pour une information annexe (date d'une commande, montant de remise sous un prix), avec un contraste ≥ 4.5:1.
- **12 px (`xs`)** : interdit dans le parcours de vente.

## Échelle d'usage

| Élément                                                | Taille                                           | Graisse   | Remarque                 |
| ------------------------------------------------------ | ------------------------------------------------ | --------- | ------------------------ |
| Titre appli                                            | 20 px (`xl`) ; 18 px (`lg`) en téléphone paysage | 700       | Orange, `nowrap`         |
| Onglet catégorie                                       | 16 px                                            | 700       |                          |
| Nom produit (carte)                                    | 16 px (`md`) ; 18 px (`lg`) en desktop           | 700       | Jamais coupé             |
| **Prix produit (carte)**                               | **18 px (`lg`)**                                 | **700**   | `nowrap`                 |
| Nom ligne panier                                       | 16 px                                            | 600       | Jamais coupé             |
| Prix ligne panier                                      | 16 px                                            | 700       | `nowrap`                 |
| Quantité (sélecteur)                                   | 18 px                                            | 700       | `miw={32}`, centré       |
| Remise sous le prix                                    | 14 px                                            | 600       | teal-4 + `IconDiscount`  |
| « Articles » + nombre (pied panier)                    | 16 px                                            | 400 / 500 | `dimmed` pour le libellé |
| **Total panier**                                       | **24 px**                                        | **800**   | `nowrap`                 |
| Total barre panier (portrait) / pied compact (paysage) | 20 px                                            | 800       | `nowrap`                 |
| Titre commande (historique)                            | 16 px                                            | 700       |                          |
| Date commande                                          | 14 px                                            | 400       | `dimmed`                 |
| Total commande                                         | 18 px                                            | 700       | `nowrap`                 |

## Règle « rien n'est coupé »

- **Prix et totaux** : jamais tronqués, jamais renvoyés à la ligne → `style={{ whiteSpace: 'nowrap' }}` et conteneur `flex: none`. Pire cas à tester : « 999,99 € ».
- **Noms de produits** (cartes, lignes de panier, historique) : **jamais tronqués**. Pas de `truncate`, pas de `lineClamp`. Le nom passe à la ligne autant qu'il faut et le conteneur grandit (`h="auto"`). Ajouter `style={{ overflowWrap: 'anywhere' }}` pour qu'un mot très long ne déborde pas. Cas de test : « Bière pression 25cl / 50cl ».
- **Noms de catégories** : jamais tronqués non plus. En onglets « pilule », le texte reste sur une ligne (`nowrap`) et c'est la rangée qui défile horizontalement ; en colonne verticale, le nom passe à la ligne.
- Dans une même rangée nom + prix : le prix est `flex: none`, le nom `flex: 1; min-width: 0` et passe à la ligne.
