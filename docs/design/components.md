# Composants (charte provisoire)

Mise en page et critères de bascule : [spacing-layout.md](spacing-layout.md). « Mode » = valeur de `useLayoutMode()`.

## En-tête global — `Register/index.tsx`

|            | Portrait                          | Paysage | Tablette / desktop             |
| ---------- | --------------------------------- | ------- | ------------------------------ |
| Hauteur    | 56                                | 44      | 56 (desktop inchangé)          |
| Titre      | `xl`, 700, orange, `nowrap`       | `lg`    | `xl`                           |
| Historique | `ActionIcon` 56×56, `IconHistory` | 44×44   | absent (dans le panier)        |
| Réglages   | `ActionIcon` 56×56                | 44×44   | inchangé (60 × pleine hauteur) |

**Mode édition** (tous modes) : l'icône historique disparaît ; un `Button` « Terminer » (`leftSection={<IconCheck size={20} />}`, `color="yellow"` filled → texte noir, `h={44}`) apparaît à gauche des réglages et quitte le mode édition en 1 toucher ; bordure basse de l'en-tête 2 px `var(--mantine-primary-color-filled)`. En tablette/desktop, ajouter avant le bouton un `Badge size="lg" color="yellow"` « Édition ». Le texte du bouton porte l'information, pas la couleur seule.

## Onglets catégorie — `Catalog/index.tsx`

On garde `Tabs` (sémantique, tests) dans tous les modes.

**Rangée pilule** (portrait, paysage, tablette < 768 px) : `Tabs orientation="horizontal" variant="pills"`, `Tabs.List` dans `ScrollArea scrollbars="x" type="never"` avec un dégradé de 24 px sur le bord droit (de transparent à la couleur de fond) pour signaler le défilement. Chaque `Tabs.Tab` : `h={44}`, `radius="xl"`, `px="md"`, texte 16 / 700 `nowrap`, jamais tronqué. Sélectionné : fond yellow-8, texte noir. Rangée : `py={8}` (portrait, 60 px) ou `py={4}` (paysage, 52 px), `px="sm"`, `gap="xs"`. L'onglet sélectionné est ramené dans la zone visible (`scrollIntoView({ inline: 'nearest' })`).

**Colonne** (tablette ≥ 768, desktop) : tablette `w={200}` fixe ; desktop ratio actuel avec `miw={200}`. Tab `mih={80}`, nom 16–18 / 700 qui passe à la ligne (supprimer `truncate`), `overflowWrap: 'anywhere'`.

**Édition des catégories :**

- Rangée pilule, portrait / tablette < 768 : barre d'outils de 52 px sous les onglets (`Group justify="space-between" px="sm"`) : nom de la catégorie sélectionnée (16 / 700, passe à la ligne) + `Button variant="light" h={44}` « Modifier » (`IconEdit`, couleur primaire) et « Supprimer » (`IconTrash`, `color="red"`). Masquée sur « Toutes ».
- Paysage : pas de barre ; deux `ActionIcon` 44×44 fixés à droite de la rangée d'onglets, hors défilement (voir maquette).
- Colonne (tablette ≥ 768, desktop) : icônes dans la ligne, chaque `ActionIcon` `w={44}` `flex: none` (remplace `w="50%"`).
- « + Nouvelle catégorie » : dernier onglet en pointillés (rangée) ; `NewCategoryButton` inchangé en bas (colonne).

## Carte produit — `ProductCard`

Structure (plus de `<button>` imbriqué) :

```tsx
<Card withBorder radius="sm" p={0} h="auto" mih={MIH[mode]}>   // 96 / 72 / 120 / 200
  <UnstyledButton onClick={isEditMode ? onEdit : onAdd} flex={1} p={PAD[mode]}  // sm / xs / sm / lg
                  aria-label={isEditMode ? 'Modifier <nom>' : 'Ajouter <nom>'}>
    <Stack gap="xs" align="center" justify="center" h="100%">
      <Text fw={700} size={mode === 'desktop' ? 'lg' : 'md'} ta="center"
            style={{ overflowWrap: 'anywhere' }}>{name}</Text>      // pas de lineClamp
      <Text fw={700} size="lg" style={{ whiteSpace: 'nowrap' }}>{price}</Text>
    </Stack>
  </UnstyledButton>
  {isEditMode && (
    <Group gap={0} grow h={48} style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <ActionIcon variant="subtle" radius={0} h={48} aria-label="Modifier">  <IconEdit size={22} color="var(--mantine-primary-color-filled)" />
      <ActionIcon variant="subtle" radius={0} h={48} aria-label="Supprimer"> <IconTrash size={22} color="var(--mantine-color-red-6)" />
    </Group>
  )}
</Card>
```

- **Toucher la carte en mode édition ouvre la modification** (même action que ✎).
- Le nom n'est jamais coupé : la carte grandit ; la grille (`SimpleGrid`) aligne la hauteur des cartes d'une même rangée.
- États : survol / appui = fond `var(--mantine-color-dark-5)` ; focus ring Mantine visible.

**Nouveau produit — `NewProductCard`** : même `Card`/`UnstyledButton`, `mih` identique à la carte produit (plus de `h` fixe), bordure pointillée, `IconPlus` 32 (téléphone, tablette) / 48 (desktop), libellé `md` (téléphone, tablette) / `lg` (desktop), 700, passe à la ligne.

## Ligne de panier — `Cart/CartItem`

Deux rangées, tous modes :

```
Rangée 1 :  [Nom (16/600, flex:1, minWidth:0, passe à la ligne)]   [Prix (16/700, nowrap, flex:none)]
            sous le prix, si remise : [IconDiscount 16] −0,50 €  (14/600, teal-4)
Rangée 2 :  [ − ] 2 [ + ]   (ActionIcon size={44} variant="outline", icônes 20 ; quantité 18/700 miw 32)      [⋮ 44×44]
```

- Ligne : `Stack gap="xs" py="xs"` ; séparateur `Divider` entre lignes.
- Menu ⋮ : `ActionIcon size={44} aria-label="Plus d'actions"` ; `Menu width={220} position="bottom-end"` ; items `py="md"` 16 px : « Appliquer une remise » (`IconDiscount`), « Supprimer » (`IconTrash`, `color="red"`).
- **Lecture seule** (historique, sans handlers) : une seule rangée, nom préfixé de la quantité « 2 × Café long » + prix.

## Panier

**Pied standard** (tablette, desktop, Drawer) : `Stack gap="sm" p="md"`, bordure haute. « Articles » 16 `dimmed` / nombre 16 / 500 ; « Total » 24 / 800 et montant 24 / 800 `nowrap` ; `Button size="lg" fullWidth` « Valider » (désactivé si panier vide).

**En-tête du panier** (tablette, desktop) : historique et vider, `ActionIcon` 48×48. Vider : `IconTrash` red-6, `aria-label` « Vider le panier », désactivé si panier vide.

**Barre repliée** (portrait) : `Paper` fixé en bas, `h` = `calc(var(--cart-bar-height) + env(safe-area-inset-bottom))`, `pb` = `env(safe-area-inset-bottom)`, `px="md"`, `shadow="md"`, bordure haute. Contenu `Group wrap="nowrap"` :

- zone gauche `UnstyledButton` (`flex: 1`, ouvre le Drawer, `aria-label` « Voir le panier ») : « N articles » 16 `dimmed` au-dessus du total 20 / 800 `nowrap` ; panier vide : « Panier vide » `dimmed` ;
- `ActionIcon size={44}` `IconChevronUp` (ouvre aussi) ;
- `Button size="lg"` « Valider » (désactivé si vide).

**Pulsation à l'ajout** (portrait) : quand le nombre d'articles augmente, le total passe en `scale(1.08)` puis revient (150 ms, `ease-out`). Rien avec `prefers-reduced-motion: reduce`.

**Drawer** (portrait) : `Drawer position="bottom" size="85%" radius="md"` (coins hauts), titre « Panier » 18 / 700, en-tête : vider (`ActionIcon` 44) + fermeture (44). Corps : lignes (seule zone qui défile) + pied standard. « Valider » ouvre la confirmation par-dessus ; après une vente réussie, le Drawer se referme (**le panier est replié après chaque vente**) ; si on annule la confirmation, on revient au Drawer.

**Colonne droite compacte** (paysage) : voir [spacing-layout.md](spacing-layout.md#2-téléphone-paysage). Pas d'en-tête ; pied d'une rangée de 60 px : vider 44 · « N articles » / total 20 / 800 · « Valider » `h={44}` `flex: 1`.

## Vider le panier + toast « Annuler »

1. Toucher « vider » vide **immédiatement** le panier (pas de confirmation).
2. Toast `toast.info` (style info, `toastId: 'cart-cleared'`, un seul à la fois) : « Panier vidé » + `Button variant="outline" h={44}` « Annuler », couleur `var(--color-info-text)` (texte et bordure, 6.7:1).
3. Options du toast : `autoClose: 5000`, `closeOnClick: false`, `pauseOnHover: true`.
4. « Annuler » remet l'ancien panier (lignes, quantités, remises), puis ferme le toast sans autre message.
5. Si le panier est modifié pendant ces 5 s (ajout d'un produit), le toast reste et « Annuler » **fusionne** (D-019) : l'ancien panier revient et les produits ajoutés entre-temps restent, après les anciennes lignes. Un produit présent dans les deux paniers voit ses quantités additionnées. Cas d'un tel produit avec une remise : en attente d'une décision métier.
6. Un nouveau vidage pendant que le toast est affiché remplace l'offre d'annulation précédente (un seul toast à la fois).

## Historique — `OrderHistoryModal`

- `Modal fullScreen` en téléphone (portrait et paysage), `size="lg" centered` sinon.
- Carte de commande `Card withBorder` :
  - en-tête : « Commande #12 » 16 / 700, date en dessous 14 `dimmed` ; **aucun bouton** ;
  - lignes en lecture seule (16 px) ;
  - pied `Group justify="space-between" wrap="nowrap"` : total 18 / 700 `nowrap` + « N articles » 16 `dimmed` ; à droite `Button color="red" variant="light" h={44} leftSection={<IconTrash size={20} />}` « Supprimer ».
- La **confirmation existante est conservée** (`ConfirmationModal`) ; ses boutons ≥ 44 px.

## Toasts — `ToastContainer` dans `App.tsx`

| Prop                              | Valeur                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `theme`                           | `"colored"` (couleurs surchargées par `variables.css`)                                                               |
| `position`                        | `"bottom-left"` en téléphone paysage (au-dessus du catalogue, ne recouvre pas « Valider ») ; `"bottom-center"` sinon |
| `autoClose`                       | 3000 ; erreurs `toast.error(msg, { autoClose: 5000 })` ; toast « Annuler » 5000                                      |
| `limit`                           | 3                                                                                                                    |
| `hideProgressBar`, `closeOnClick` | `true`, `true` (sauf toast « Annuler »)                                                                              |

Décalage bas : `--toastify-toast-bottom` dans `variables.css` (au-dessus de la barre panier en portrait, 16 px ailleurs). Ne recouvre jamais l'en-tête ni le titre / la croix des modales.
