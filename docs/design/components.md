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
- **Lecture seule** (historique D-023, récapitulatif de confirmation D-026) : une seule rangée, nom préfixé de la quantité « 2 × Café long » + prix.

## Panier

**Pied standard** (tablette, desktop, Drawer) : `Stack gap="sm" p="md"`, bordure haute. « Articles » 16 `dimmed` / nombre seul 16 / 500 (« Articles … 3 ») ; « Total » 24 / 800 et montant 24 / 800 `nowrap` ; `Button size="lg" fullWidth` « Valider ». Panier vide (tablette, desktop, Drawer) : message « Votre panier est vide » et pied masqué.

**En-tête du panier** (tablette, desktop) : historique et vider, `ActionIcon` 48×48. Vider : `IconTrash` red-6, `aria-label` « Vider le panier », désactivé si panier vide.

**Barre repliée** (portrait) : `Paper` en dernier élément de la colonne de la page (dans le flux, pas en `fixed` : il ne recouvre jamais la grille), `h` = `calc(var(--cart-bar-height) + env(safe-area-inset-bottom))`, `pb` = `env(safe-area-inset-bottom)`, `px="md"`, `shadow="md"`, bordure haute. Contenu `Group wrap="nowrap"` :

- zone gauche `UnstyledButton` (`flex: 1`, ouvre le Drawer, `aria-label` « Voir le panier ») : « N articles » 16 `dimmed` au-dessus du total 20 / 800 `nowrap` ; panier vide : « Panier vide » `dimmed` ;
- `ActionIcon size={44}` `IconChevronUp` (ouvre aussi) ;
- `Button size="lg"` « Valider » (désactivé si vide).

**Pulsation à l'ajout** (portrait) : quand le nombre d'articles augmente, le total passe en `scale(1.08)` puis revient (150 ms, `ease-out`). Rien avec `prefers-reduced-motion: reduce`.

**Drawer** (portrait) : `Drawer position="bottom" size="85%" radius="md"` (coins hauts), titre « Panier » 18 / 700, en-tête : vider (`ActionIcon` 44) + fermeture (44). Corps : lignes (seule zone qui défile) + pied standard. « Valider » ouvre la confirmation par-dessus ; après une vente réussie, le Drawer se referme (**le panier est replié après chaque vente**) ; si on annule la confirmation, on revient au Drawer.

**Colonne droite compacte** (paysage) : voir [spacing-layout.md](spacing-layout.md#2-téléphone-paysage). Pas d'en-tête ; pied d'une rangée de 60 px : vider 44 · « N articles » / total 20 / 800 · « Valider » `h={44}` `flex: 1` `miw={110}`.

## Vider le panier + toast « Annuler »

1. Toucher « vider » vide **immédiatement** le panier (pas de confirmation).
2. Toast `toast.info` (style info, `toastId: 'cart-cleared'`, un seul à la fois) : « Panier vidé » + `Button variant="outline" h={44}` « Annuler », couleur `var(--color-info-text)` (texte et bordure, 6.7:1).
3. Options du toast : `autoClose: 5000`, `closeOnClick: false`, `pauseOnHover: true`, `closeButton: false` (la croix chevauchait « Annuler »).
4. « Annuler » remet l'ancien panier (lignes, quantités, remises), puis ferme le toast sans autre message.
5. Si le panier est modifié pendant ces 5 s (ajout d'un produit), le toast reste et « Annuler » **fusionne** (D-019) : l'ancien panier revient et les produits ajoutés entre-temps restent, après les anciennes lignes. Un produit présent dans les deux paniers voit ses quantités **et** ses montants de remise additionnés (D-024 : 2 × Bière −1 € + 1 × Bière −0,50 € → 3 × Bière −1,50 €).
6. Dès qu'une commande est validée, le toast se ferme et l'annulation n'est plus possible (D-025).
7. Un nouveau vidage pendant que le toast est affiché remplace l'offre d'annulation précédente (un seul toast à la fois).

## Historique — `OrderHistoryModal`

- `Modal fullScreen` en téléphone (portrait et paysage), `size="lg" centered` sinon.
- Carte de commande `Card withBorder` :
  - en-tête : « Commande #12 » 16 / 700, date en dessous 14 `dimmed` ; **aucun bouton** ;
  - lignes en lecture seule (16 px) ;
  - pied `Group justify="space-between" wrap="nowrap"` : total 18 / 700 `nowrap` + « N articles » 16 `dimmed` ; à droite `Button color="red" variant="light" h={44} leftSection={<IconTrash size={20} />}` « Supprimer ».
- La **confirmation existante est conservée** (`ConfirmationModal`) ; ses boutons ≥ 44 px, « Annuler » en `variant="default"` (action non destructive).
- **Paiement** (instances en euros, commandes passées par l'écran « Encaissement ») : entre les lignes et le pied, `Group gap="xs"` de `Badge size="lg" variant="default" tt="none" fz={14} fw={600}`, un par mode dont le montant est non nul, ou le seul mode choisi si le total est ≤ 0 :
  - « Espèces 5,00 € », `leftSection={<IconCash size={16} />}` ;
  - « Carte 2,50 € », `leftSection={<IconCreditCard size={16} />}`.
  - Montant `nowrap`. Le libellé porte l'information (pas de couleur par mode). Aucun badge pour les anciennes commandes (pas de données de paiement) ni pour les instances en jetons.

## Encaissement — `CartConfirmationModal`

Remplace l'ancien « Récapitulatif de confirmation ». Décisions de l'utilisateur du 2026-11-20 (à consigner dans `docs/business/decisions.md`). Version 1.3.0.

La modale ne passe plus par `ConfirmationModal` : plus de boutons « Confirmer / Annuler ». On ferme avec la croix (44 × 44) ou Échap ; le panier reste intact.

### Principe

1. Le vendeur touche « Valider » : la modale « Encaissement » s'ouvre avec le récapitulatif (lignes « 2 × Nom », D-026), le total, puis le choix du paiement.
2. **Rien à rendre → enregistrement dès le toucher** : « Carte » et « Appoint » enregistrent la vente immédiatement.
3. **Monnaie à rendre** : toucher un montant (suggestion ou pavé) affiche « À rendre » en grand **dans le même écran**. Le vendeur rend la monnaie, **puis** touche « Encaisser ». L'enregistrement vient après le rendu, pour que le montant reste affiché pendant qu'on compte.
4. Un montant saisi au pavé égal au total affiche « Rien à rendre » et attend « Encaisser » : on n'enregistre jamais pendant la frappe (taper « 7,5 » pour « 7,55 » enregistrerait trop tôt).
5. Le mode de paiement est **obligatoire, sans valeur par défaut**. Moyens : **Espèces** et **Carte** seulement. Choisir un montant d'espèces vaut choix « Espèces » : il n'y a pas de bouton « Espèces » à toucher avant (sauf total ≤ 0, voir plus bas).
6. **Paiement mixte** : si les espèces reçues sont inférieures au total, l'écran affiche « Il reste 2,50 € » et le bouton principal devient « Reste en carte (2,50 €) », qui enregistre. Seule la part en espèces peut donner lieu à un rendu ; la carte est toujours débitée du montant exact.
7. Après l'enregistrement : la modale se ferme, toast succès « Commande n°12 enregistrée · Espèces » (ou « · Carte », « · Espèces + Carte »), le Drawer du panier se referme en portrait (inchangé). En cas d'erreur API, la modale reste ouverte avec la saisie conservée et un toast d'erreur s'affiche (inchangé).

**Inverse (carte partielle, puis espèces avec rendu) : non proposé.** Il faudrait saisir d'abord un montant carte (un pavé et un toucher de plus) pour un cas rare en buvette. Si le client paie une partie en espèces, on part toujours des espèces : le vendeur tape la part d'espèces qu'il garde, puis « Reste en carte ».

**Ce qui est enregistré** (euros) : montant payé en espèces et montant payé en carte, la somme valant le total. Ni le montant reçu, ni la monnaie rendue.

| Cas                               | Espèces enregistrées | Carte enregistrée |
| --------------------------------- | -------------------- | ----------------- |
| Carte / « Tout en carte »         | 0                    | total             |
| Appoint, ou reçu ≥ total          | total                | 0                 |
| Reçu R < total, « Reste en carte »| R                    | total − R         |
| Total ≤ 0, Espèces choisi         | total (0 ou négatif) | 0                 |
| Total ≤ 0, Carte choisi           | 0                    | total (0 ou négatif) |

### Nombre de touchers

| Cas (total 7,50 €)                         | Téléphone                                   | Tablette / desktop |
| ------------------------------------------ | ------------------------------------------- | ------------------ |
| Carte                                      | Valider, Carte = **2**                      | 2                  |
| Espèces, appoint                           | Valider, Appoint = **2**                    | 2                  |
| Espèces, billet suggéré (20 €)             | Valider, 20 €, Encaisser = **3**            | 3                  |
| Espèces, montant libre (18,50 €)           | Valider, Autre montant, 1, 8, « , », 5, Encaisser = **7** | 6 (pavé toujours visible) |
| Mixte : 5 € en espèces, reste en carte     | Valider, Autre montant, 5, Reste en carte = **4** | 3            |
| Jetons, appoint / jeton suggéré            | 2 / 3                                       | 2 / 3              |

### Montants suggérés

Toujours **5 boutons** : « Appoint » + **4 suggestions**, pour que la grille ne saute jamais. Fonction pure, à tester unitairement, commune aux euros et aux jetons :

```
suggestAmounts(total, unit) → 4 montants, croissants, tous > total
  unit = 100 (euros, montants en centimes) ou 1 (jetons)
  1. candidats = {}
  2. si total n'est pas un multiple de unit (centimes non nuls) :
       ajouter l'unité supérieure : (floor(total / unit) + 1) × unit      // « euro supérieur »
  3. pour pas dans [5, 10, 20, 50, 100] :
       ajouter le multiple de pas × unit strictement supérieur au total
  4. dédoublonner, trier par ordre croissant
  5. tant qu'il y a moins de 4 candidats : ajouter le plus petit multiple de 10 × unit
     strictement supérieur au total qui n'est pas déjà présent
  6. garder les 4 plus petits
```

- « Strictement supérieur » : le montant exact est déjà couvert par « Appoint ».
- Appelée seulement si total > 0. Total ≤ 0 : ni suggestions ni pavé (voir plus bas).

| Total     | Candidats (étapes 2-3)                      | Suggestions affichées        |
| --------- | ------------------------------------------- | ---------------------------- |
| 0,80 €    | 1, 5, 10, 20, 50, 100                       | 1 € · 5 € · 10 € · 20 €      |
| 7,50 €    | 8, 10, 10, 20, 50, 100                      | 8 € · 10 € · 20 € · 50 €     |
| 12,00 €   | 15, 20, 20, 50, 100                         | 15 € · 20 € · 50 € · 100 €   |
| 18,50 €   | 19, 20, 20, 20, 50, 100                     | 19 € · 20 € · 50 € · 100 €   |
| 47,00 €   | 50, 50, 60, 50, 100 → 50, 60, 100 ; + 70    | 50 € · 60 € · 70 € · 100 €   |
| 120,00 €  | 125, 130, 140, 150, 200                     | 125 € · 130 € · 140 € · 150 €|
| 3 jetons  | 5, 10, 20, 50, 100                          | 5 · 10 · 20 · 50 Jetons      |

Affichage des suggestions : entier sans centimes (« 20 € », « 8 € ») pour la lisibilité du bouton ; l'`aria-label` et le bloc de rendu utilisent le format complet D-011 (« 20,00 € »). « Appoint » affiche le montant complet sur sa 2e ligne (« 7,50 € »).

### Pavé numérique

Pavé intégré, jamais le clavier natif (`NumberInput` / `inputmode` exclus : il masque la moitié de l'écran et fait sauter la mise en page).

- Touches euros : `7 8 9 / 4 5 6 / 1 2 3 / , 0 ⌫`. Jetons : la touche « , » est remplacée par une case vide non interactive (D-012).
- Règles de saisie : 4 chiffres maximum avant la virgule (plafond 9 999,99 € ou 9 999 jetons), 2 après (une 3e décimale est ignorée, D-010), un seul séparateur, « , » en premier donne « 0, », les zéros de tête sont supprimés. Une touche qui violerait une règle est sans effet (pas de message).
- Affichage de la saisie : texte brut tapé suivi de « € » (« 18,5 € »), 32 / 800, `nowrap`, aligné à droite ; vide : « 0 € » en `dimmed`. Le bloc de rendu affiche, lui, le montant formaté (« Reçu 18,50 € »).
- `[✕]` à droite de l'affichage (`ActionIcon size={44}`, `IconX`, `aria-label` « Effacer le montant ») remet la saisie à vide.
- Toucher une suggestion **remplace** la saisie (l'affichage montre « 20 ») ; la touche suivante du pavé recommence une nouvelle saisie. Toucher une autre suggestion remplace la précédente : on n'additionne jamais.
- Saisie « 0 » ou vide = aucun montant (état « vide » du bloc de rendu).

### États du bloc de rendu

Toujours au même endroit, `Paper radius="md" p="md" mih={96}` (hauteur réservée : l'écran ne saute pas), `role="status" aria-live="polite"`. Fond dark-6. Montants `nowrap`.

| État | Quand | Contenu | Bordure / icône |
| --- | --- | --- | --- |
| **Vide** | aucun montant | « Choisissez Carte ou le montant reçu » (jetons : « Choisissez le nombre de jetons reçus ») 16 `dimmed` | 1 px `default-border`, pas d'icône |
| **À rendre** | reçu > total | ligne 1 : « Reçu » 16 `dimmed` + « 20,00 € » 18 / 700 ; ligne 2 : « À rendre » 20 / 700 + montant **40 / 800** blanc | 2 px yellow-8 ; `IconCoins` 28 yellow-8 |
| **À rendre élevé** | rendu > 100 € (euros seulement) | idem + ligne « Rendu élevé : vérifiez le montant reçu » 16 / 600, `IconAlertTriangle` 20 yellow-8. Non bloquant | 2 px yellow-8 |
| **Rien à rendre** | reçu = total (pavé) | « Reçu 7,50 € » + « Rien à rendre » 24 / 800 | 2 px `default-border` ; `IconCheck` 28 |
| **Il reste** (euros) | 0 < reçu < total | « Espèces reçues 5,00 € » + « Il reste » 20 / 700 + montant **32 / 800** blanc | 2 px `var(--color-info-bg)` ; `IconCreditCard` 28 `var(--color-info-bg)` |
| **Il manque** (jetons) | 0 < reçu < total | « Reçu 5 Jetons » + « Il manque » 20 / 700 + montant 32 / 800 red-4 | 2 px red-6 ; `IconAlertTriangle` 28 red-6 |
| **À rendre au client** | total < 0 | « À rendre au client » 20 / 700 + montant (valeur absolue) **40 / 800** | 2 px yellow-8 ; `IconCoins` 28 yellow-8 |
| **Rien à encaisser** | total = 0 | « Rien à encaisser » 20 / 700 | 1 px `default-border` |

Contrastes : red-4 #FF8787 sur dark-6 5,9:1 ; bordures yellow-8 6,4:1, info #89B4F8 6,4:1, red-6 4,1:1 (≥ 3:1 pour un élément graphique). Chaque état se lit par son texte et son icône, jamais par la seule couleur.

### Bouton principal (pied)

Un seul bouton principal en bas, toujours présent, `Button fullWidth` filled (yellow-8, texte noir), 18 / 700 :

| État du bloc | Bouton | Action |
| --- | --- | --- |
| Vide | « Encaisser » **désactivé**, `IconCheck` | — |
| À rendre / À rendre élevé / Rien à rendre | « Encaisser », `IconCheck` | enregistre (espèces = total) |
| Il reste (euros) | « Reste en carte (2,50 €) », `IconCreditCard` | enregistre (mixte) |
| Il manque (jetons) | « Encaisser » désactivé | — |
| Total ≤ 0 | pas de bouton principal (voir plus bas) | — |

Pendant l'enregistrement (`isLoading`), **tous** les boutons de la modale sont désactivés et « Encaisser » / « Carte » / « Appoint » portent `loading` (anti double toucher).

### Bouton « Carte »

- Aucun montant d'espèces saisi : « Carte » (`IconCreditCard`).
- Un montant d'espèces est saisi : le libellé devient « Tout en carte (7,50 €) ». Le toucher enregistre tout en carte et ignore la saisie (correction d'un mauvais choix en 1 toucher).

### Total à 0 € ou négatif

- Euros : pas de suggestions, pas de pavé, pas de bouton principal. Bloc « Rien à encaisser » (0) ou « À rendre au client 2,00 € » (négatif), puis deux boutons côte à côte, `SimpleGrid cols={2}`, qui enregistrent immédiatement : « Espèces » (`IconCash`) et « Carte » (`IconCreditCard`). Le montant enregistré sur le mode choisi est le total (0 ou négatif).
- Jetons : même bloc (« Jetons à rendre au client 3 Jetons » si négatif), puis un seul bouton « Enregistrer » (`IconCheck`, filled, `fullWidth`) qui enregistre.

### Instances en jetons

Même écran, simplifié : pas de « Carte », pas de paiement mixte, rien d'enregistré en plus de la commande.

- Titre de la zone : « Jetons reçus » ; suggestions entières (algorithme ci-dessus, `unit = 1`) ; « Appoint » enregistre immédiatement.
- Pavé sans virgule ; rendu « Jetons à rendre » ; insuffisant : état « Il manque » et « Encaisser » désactivé.
- Montants au format existant (« 3 Jetons »).
- Toast inchangé : « Commande n°12 enregistrée ».

### Maquettes

Légende des icônes : `▭` `IconCreditCard`, `≡` `IconCash`, `◎` `IconCoins`, `✓` `IconCheck`, `⌨` `IconKeyboard`, `←` `IconArrowLeft`, `⌫` `IconBackspace`, `[✕]` `IconX` / croix de la modale.

**Téléphone portrait** — `Modal fullScreen`. Corps en colonne flex sur toute la hauteur : seul le récapitulatif rétrécit (`ScrollArea` `flex: 1`, `mih={64}`) ; le pied est collé en bas, `pb` = `env(safe-area-inset-bottom)`.

Vue « Montants » (euros, total 7,50 €, après toucher « 20 € ») :
```
┌──────────────────────────────────┐
│ Encaissement                [✕]  │ 56, titre 18/700
├──────────────────────────────────┤
│ 2 × Bière                 5,00 € │ récapitulatif, défile
│ 1 × Crêpe                 2,50 € │
│ Total · 3 articles        7,50 € │ 24/800
├──────────────────────────────────┤
│ [▭ Carte       ][Appoint        ]│ 56, SimpleGrid cols=2
│ [              ][ 7,50 €        ]│
│ Espèces reçues                   │ 16 dimmed
│ [ 8 € ][ 10 € ][✓20 €][ 50 € ]   │ 56, SimpleGrid cols=4
│ [⌨ Autre montant               ] │ 48
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ◎ Reçu               20,00 € ┃ │ bloc de rendu
│ ┃   À rendre         12,50 €   ┃ │ 40/800, bordure yellow-8
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────┤
│ [ ✓ Encaisser                  ] │ 56
└──────────────────────────────────┘
```
Après « 20 € », « Carte » devient « Tout en carte (7,50 €) ».

Vue « Pavé » (après « Autre montant », état mixte) : le récapitulatif se replie en une ligne, la rangée Carte / Appoint et les suggestions sont masquées.
```
┌──────────────────────────────────┐
│ Encaissement                [✕]  │ 56
├──────────────────────────────────┤
│ 3 articles · Total        7,50 € │ 44, 16 / total 20/800
│ [← Montants]        5 €     [✕]  │ 44 ; saisie 32/800 à droite
│ [  7  ][  8  ][  9  ]            │
│ [  4  ][  5  ][  6  ]            │ 56, 24/700, SimpleGrid cols=3
│ [  1  ][  2  ][  3  ]            │
│ [  ,  ][  0  ][  ⌫  ]            │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ▭ Espèces reçues      5,00 € ┃ │ bordure info
│ ┃   Il reste            2,50 € ┃ │ 32/800
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────┤
│ [ ▭ Reste en carte (2,50 €)    ] │ 56
└──────────────────────────────────┘
```
« ← Montants » (`Button variant="subtle" h={44}`, `IconArrowLeft`) revient à la vue « Montants » en gardant la saisie.

**Téléphone paysage** — `Modal fullScreen`, en-tête 44, deux colonnes `Group align="stretch" wrap="nowrap"` : gauche 40 % (récapitulatif qui défile, total, bloc de rendu avec montant **32 / 800** au lieu de 40), droite 60 %. Boutons h 48 (pavé h 44).
```
┌────────────────────────────────────────────────────────────┐
│ Encaissement                                          [✕]  │ 44
├──────────────────────────┬─────────────────────────────────┤
│ 2 × Bière         5,00 € │ [▭ Carte      ][Appoint 7,50 €] │ 48
│ 1 × Crêpe         2,50 € │ [ 8 € ][ 10 € ][✓20 €][ 50 € ]  │ 48
│ Total            7,50 €  │ [⌨ Autre montant              ] │ 48
│ ┏━━━━━━━━━━━━━━━━━━━━━━┓ │                                 │
│ ┃ Reçu        20,00 €  ┃ │                                 │
│ ┃ À rendre    12,50 €  ┃ │ [ ✓ Encaisser                 ] │ 48
│ ┗━━━━━━━━━━━━━━━━━━━━━━┛ │                                 │
└──────────────────────────┴─────────────────────────────────┘
```
Vue « Pavé » en paysage : colonne droite = `[← Montants]  saisie  [✕]` (44) + pavé `SimpleGrid cols={4}` sur 3 rangées de 44 : `[7][8][9][⌫] / [4][5][6][,] / [1][2][3][0]` (jetons : la case « , » est vide) + bouton principal 48.

**Tablette et desktop** — `Modal size={720} centered`, deux colonnes égales, pavé toujours visible (pas de bouton « Autre montant », pas de vue « Pavé »). Boutons 56, touches du pavé 64.
```
┌───────────────────────────────────────────────────────────────┐
│ Encaissement                                             [✕]  │
├──────────────────────────────┬────────────────────────────────┤
│ 2 × Bière             5,00 € │ [▭ Carte      ][Appoint 7,50 €]│ 56
│ 1 × Crêpe             2,50 € │ Espèces reçues                 │
│                              │ [ 8 € ][ 10 € ][ 20 € ][ 50 € ]│ 56
│ Total · 3 articles    7,50 € │ Reçu              5 €     [✕]  │ 44
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ [  7  ][  8  ][  9  ]          │
│ ┃ ▭ Espèces reçues  5,00 € ┃ │ [  4  ][  5  ][  6  ]          │ 64
│ ┃   Il reste        2,50 € ┃ │ [  1  ][  2  ][  3  ]          │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ [  ,  ][  0  ][  ⌫  ]          │
│                              │ [ ▭ Reste en carte (2,50 €)  ] │ 56
└──────────────────────────────┴────────────────────────────────┘
```

**Jetons, téléphone portrait** (total 7 Jetons, après « 10 ») :
```
┌──────────────────────────────────┐
│ Encaissement                [✕]  │
├──────────────────────────────────┤
│ 2 × Bière                4 Jetons│
│ 1 × Crêpe                3 Jetons│
│ Total · 3 articles       7 Jetons│ 24/800
├──────────────────────────────────┤
│ Jetons reçus                     │
│ [Appoint 7 Jetons              ] │ 56, fullWidth
│ [ 10 ][ 20 ][ 50 ][ 100 ]        │ 56 (libellé « 10 », aria « Reçu 10 Jetons »)
│ [⌨ Autre montant               ] │ 48
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ◎ Reçu             10 Jetons ┃ │
│ ┃   Jetons à rendre   3 Jetons ┃ │ 40/800
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────┤
│ [ ✓ Encaisser                  ] │ 56
└──────────────────────────────────┘
```
Tablette / paysage en jetons : mêmes grilles qu'en euros, la place de « Carte » est prise par « Appoint » en pleine largeur.

**Total négatif, euros** (toutes tailles, colonne unique sous le récapitulatif) :
```
│ Total · 2 articles       -2,00 € │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ◎ À rendre au client  2,00 € ┃ │ 40/800
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ [ ≡ Espèces   ][ ▭ Carte      ]  │ 56, enregistrent
```

### Composants Mantine et tailles

| Élément | Composant | Portrait / tablette-desktop / paysage |
| --- | --- | --- |
| Modale | `Modal` `fullScreen` (téléphone), `size={720} centered` (sinon) ; `closeButtonProps={{ size: 44, 'aria-label': t('close') }}` ; titre 18 / 700 | — |
| Lignes | `CartItem` lecture seule « 2 × Nom » (D-026) dans `ScrollArea` | — |
| Total | `Group justify="space-between" wrap="nowrap"` : « Total · N articles » 16 + montant 24 / 800 `nowrap` (20 / 800 sur la ligne repliée) | — |
| Carte | `Button variant="default"`, `leftSection={<IconCreditCard size={24} />}`, 18 / 700 | h 56 / 56 / 48 |
| Appoint | `Button variant="default"`, contenu `Stack gap={0}` : « Appoint » 16 / 600 + montant 18 / 700 `nowrap` (paysage : une ligne « Appoint 7,50 € ») | h 56 / 56 / 48 |
| Libellé « Espèces reçues » / « Jetons reçus » | `Text` 16 `dimmed`, `leftSection` visuel `IconCash` 20 | — |
| Suggestions | `SimpleGrid cols={4} spacing="xs"` de `Button variant="default"` 20 / 700 `nowrap`, `px={0}` ; sélectionnée : `variant="filled"` (yellow-8, texte noir 9,8:1) + `leftSection={<IconCheck size={18} />}` + `aria-pressed` | h 56 / 56 / 48 |
| Autre montant | `Button variant="default" fullWidth`, `leftSection={<IconKeyboard size={20} />}`, 16 / 700 | h 48 / absent / 48 |
| Pavé | `SimpleGrid cols={3}` (paysage `cols={4}`) `spacing="xs"` de `Button variant="default"` 24 / 700 ; ⌫ = `IconBackspace` 24 | h 56 / 64 / 44 |
| Bloc de rendu | voir « États du bloc de rendu » | montant 40 / 40 / 32 |
| Bouton principal | `Button fullWidth` filled, 18 / 700, icône 22 | h 56 / 56 / 48 |
| Espacements | `Stack gap="sm"` ; 8 px minimum entre cibles | — |

Aucune nouvelle couleur ni nouveau token : yellow-8, red-4 / red-6, `--color-info-bg`, `default-border`, dark-6.

### Clavier physique (desktop, et toute taille si un clavier est branché)

Écouteur `keydown` sur le contenu de la modale, actif seulement si total > 0 :

| Touche | Effet |
| --- | --- |
| `0`–`9` (rangée et pavé numérique) | ajoute le chiffre (règles du pavé) ; ouvre la vue « Pavé » en téléphone |
| `,` ou `.` (et `Decimal` du pavé numérique) | séparateur (euros seulement) |
| `Backspace` | efface le dernier chiffre |
| `Delete` | efface le montant |
| `Enter` | déclenche le bouton principal s'il est actif (« Encaisser » / « Reste en carte ») ; sans effet sinon. Ne déclenche **jamais** « Carte » ni « Appoint ». Si le focus est sur un bouton, on laisse le comportement natif (le bouton focalisé est activé) |
| `Escape` | ferme la modale (Mantine), panier intact |

Focus initial : sur l'affichage de la saisie (`tabIndex={-1}`, `data-autofocus`) et pas sur « Carte », pour qu'un `Enter` réflexe n'enregistre pas une vente par carte.

### Accessibilité

- Bloc de rendu `role="status" aria-live="polite"` : les lecteurs d'écran annoncent « À rendre 12,50 € », « Il reste 2,50 € »…
- Suggestions : `aria-label` « Reçu 20,00 € » (format complet), `aria-pressed`. Appoint : `aria-label` « Appoint, 7,50 € ».
- Touches du pavé : ⌫ `aria-label` « Effacer le dernier chiffre » ; [✕] « Effacer le montant ». La case vide du pavé jetons est `aria-hidden`.
- Toutes les cibles ≥ 44 px, 8 px entre cibles, focus ring Mantine conservé.
- Aucune information portée par la seule couleur : chaque état a un texte et une icône ; la suggestion sélectionnée a l'icône ✓ et `aria-pressed`.
- Textes ≥ 16 px, montants jamais coupés (`nowrap`, pire cas « 9 999,99 € »).

### Libellés (i18n)

| Clé | FR | EN |
| --- | --- | --- |
| `cart_confirmation` (valeur changée) | Encaissement | Payment |
| `payment_card` | Carte | Card |
| `payment_cash` | Espèces | Cash |
| `payment_all_card` | Tout en carte ({{amount}}) | All by card ({{amount}}) |
| `payment_exact` | Appoint | Exact amount |
| `payment_exact_aria` | Appoint, {{amount}} | Exact amount, {{amount}} |
| `payment_cash_received` | Espèces reçues | Cash received |
| `payment_tokens_received` | Jetons reçus | Tokens received |
| `payment_other_amount` | Autre montant | Other amount |
| `payment_back_to_amounts` | Montants | Amounts |
| `payment_received` | Reçu | Received |
| `payment_received_aria` | Reçu {{amount}} | Received {{amount}} |
| `payment_change_due` | À rendre | Change due |
| `payment_tokens_change_due` | Jetons à rendre | Tokens to return |
| `payment_no_change` | Rien à rendre | No change |
| `payment_remaining` | Il reste | Remaining |
| `payment_rest_by_card` | Reste en carte ({{amount}}) | Rest by card ({{amount}}) |
| `payment_missing` | Il manque | Missing |
| `payment_refund_due` | À rendre au client | Refund to customer |
| `payment_tokens_refund_due` | Jetons à rendre au client | Tokens to return to customer |
| `payment_nothing_due` | Rien à encaisser | Nothing to collect |
| `payment_placeholder` | Choisissez Carte ou le montant reçu | Choose Card or the amount received |
| `payment_placeholder_tokens` | Choisissez le nombre de jetons reçus | Choose the number of tokens received |
| `payment_large_change` | Rendu élevé : vérifiez le montant reçu | Large change: check the amount received |
| `payment_collect` | Encaisser | Complete sale |
| `payment_save` | Enregistrer | Save |
| `payment_clear_amount` | Effacer le montant | Clear amount |
| `payment_backspace` | Effacer le dernier chiffre | Delete last digit |
| `payment_cash_and_card` | Espèces + Carte | Cash + Card |
| `order_placed_with_payment` | Commande n°{{id}} enregistrée · {{payment}} | Order #{{id}} placed · {{payment}} |
| `payment_badge` | {{mode}} {{amount}} | {{mode}} {{amount}} |

## Toasts — `ToastContainer` dans `App.tsx`

| Prop                              | Valeur                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `theme`                           | `"colored"` (couleurs surchargées par `variables.css`)                                                               |
| `position`                        | `"bottom-left"` en téléphone paysage (au-dessus du catalogue, ne recouvre pas « Valider ») ; `"bottom-center"` sinon |
| `autoClose`                       | 3000 ; erreurs `toast.error(msg, { autoClose: 5000 })` ; toast « Annuler » 5000                                      |
| `limit`                           | 3                                                                                                                    |
| `hideProgressBar`, `closeOnClick` | `true`, `true` (sauf toast « Annuler »)                                                                              |

Décalage bas : `--toastify-toast-bottom` dans `variables.css` (au-dessus de la barre panier en portrait, 16 px ailleurs). Ne recouvre jamais l'en-tête ni le titre / la croix des modales.
