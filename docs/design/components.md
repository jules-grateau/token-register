# Composants — Caisse Claire

Mise en page et critères de bascule : [spacing-layout.md](spacing-layout.md). « Mode » = valeur de `useLayoutMode()`. Couleurs : tokens de [colors.md](colors.md) (`var(--color-…)`). Rayons, ombres : [spacing-layout.md](spacing-layout.md#tokens-clientsrcstylesvariablescss). Seul l'aspect change par rapport à la charte provisoire ; comportements, tailles tactiles, textes ≥ 16 px et règles « rien n'est coupé » sont conservés.

**Réglages par composant** : l'aspect global des composants Mantine (Paper, Card, Modal, Drawer, Menu, Popover, champs de saisie, croix de fermeture des modales) est défini dans `client/src/styles/theme.module.css`, branché par `classNames` dans le thème d'`App.tsx`. C'est la source de ces réglages ; un composant n'y déroge que si cette page le précise.

## En-tête global — `Register/index.tsx`

Le **nom de l'association est le titre** ; le logo et « Caisse Claire » restent discrets. Fond `--color-surface` (clair) / `--color-bg` (sombre), bordure basse `--color-border` ; pas d'ombre.

|  | Portrait | Paysage | Tablette / desktop |
| --- | --- | --- | --- |
| Structure | rangée 56 (logo + « Caisse Claire » à gauche, actions à droite) **puis** bandeau du nom d'asso (hauteur auto, `px` 16, `pb` 8) | une rangée 44 : logo 24 · nom d'asso · actions | une rangée 64 : logo 28 + « Caisse Claire » · nom d'asso · actions |
| Logo | `BrandLogo` (SVG en ligne, tokens `--color-logo` / `--color-logo-glyph`) 28 px, `aria-hidden` | 24 px | 28 px |
| Nom de l'appli | « Caisse Claire » 14 / 700 `--color-text-2` | masqué (logo seul, `aria-label` « Caisse Claire ») | 14 / 700 |
| **Nom de l'asso** | 24 / 800, `--color-text`, passe à la ligne, jamais coupé | 16 / 800 sur 1-2 lignes | 20 / 800 sur 1-2 lignes |
| Historique | `ActionIcon` 44×44 (`variant="subtle"`, `radius` 14), `IconHistory` | 44×44 | absent (dans le panier) |
| Réglages | `ActionIcon` 44×44, `IconSettings` | 44×44 | 44×44 (`IconSettings`) |

- **Sans nom d'asso configuré** : « Caisse Claire » prend la place du nom d'asso (24 / 800 portrait, 20 tablette-desktop, 16 paysage) et la ligne « Caisse Claire » 14 px disparaît ; le logo reste.
- Le nom d'asso n'est ni un lien ni un bouton ; il est dans un `<h1>`. Longueur maximale conseillée : 80 caractères.
- Cas de test : « Comité des fêtes de Saint-Aubin-sur-Loire », « Amicale des pompiers de Val-de-Sèvre-en-Gâtine », 360 px de large, paysage inclus.

**Menu réglages** (⚙️, `Menu` ou page) : voir « Bascule clair/sombre » et « À propos » plus bas ; éléments `py="md"` (16 px), icône + texte.

**Mode édition** (tous modes) : l'icône historique disparaît ; un `Button` « Terminer » (`leftSection={<IconCheck size={20} />}`, encre filled → texte `--color-on-primary`, `h={44}`, `radius={14}`) apparaît à gauche des réglages et quitte le mode édition en 1 toucher ; bordure basse de l'en-tête 2 px `--color-text`. En tablette/desktop, ajouter avant le bouton un `Badge size="lg"` « Édition » : clair fond `--color-primary` texte `--color-on-primary`, sombre fond `--color-surface` contour 1 px `--color-primary` texte `--color-text`, `variant` custom, `tt="none"`. Le texte du bouton et du badge porte l'information, pas la couleur seule.

## Onglets catégorie — `Catalog/index.tsx`

On garde `Tabs` (sémantique, tests) dans tous les modes.

**Rangée pilule** (portrait, paysage, tablette < 768 px) : `Tabs orientation="horizontal" variant="pills"`, `Tabs.List` dans `ScrollArea scrollbars="x" type="never"` avec un dégradé de 24 px sur le bord droit (de transparent à la couleur de fond) pour signaler le défilement. Chaque `Tabs.Tab` : `h={44}`, `radius="xl"` (pilule), `px="md"` (18 px), texte 16 `nowrap`, jamais tronqué. Non sélectionné : fond `--color-surface`, contour 1 px `--color-border`, texte `--color-text`, 600. **Sélectionné : fond encre `--color-primary`, texte `--color-on-primary`, 800** (en plus de `aria-selected` : la graisse et le fond portent l'information, pas la couleur seule). Rangée : `py={8}` (portrait, 60 px) ou `py={4}` (paysage, 52 px), `px="sm"`, `gap="xs"`. L'onglet sélectionné est ramené dans la zone visible (`scrollIntoView({ inline: 'nearest' })`).

**Icône de catégorie** (D-047, facultative) : icône Tabler de la liste fermée ([icons.md](icons.md#icônes-produit)) **20 px avant le nom**, `stroke` 2, `aria-hidden`, couleur du texte de l'onglet (`currentColor`, sans pastille : rangée pilule, `--color-text` non sélectionné et `--color-on-primary` sélectionné ; colonne, `--color-text` toujours), dans les deux thèmes. Rendu identique dans la rangée pilule (`leftSection` du `Tabs.Tab`) et dans la colonne (`Group gap={8}` icône + nom). Sans icône : le nom seul, pas d'initiale ; « Toutes » n'a pas d'icône.

**Colonne** (tablette ≥ 768, desktop) : tablette `w={200}` fixe ; desktop ratio actuel avec `miw={200}`. Option « liseré + teinte » (D-051) : fond de colonne `--color-surface`, bordure droite 1 px `--color-border`, liste pleine hauteur, sans `padding` ni écart. Tab : ligne **droite** (sans arrondi), lignes collées, filet 1 px `--color-border` sous chaque ligne (la dernière aussi), `mih={56}` (80 si le nom tient sur 2 lignes), nom 16–18 / 700 en `--color-text` qui passe à la ligne (supprimer `truncate`), `overflowWrap: 'anywhere'`. Non sélectionnée : sans fond. **Sélectionnée : fond `--color-surface-2`, liseré 3 px `--color-primary` à gauche (`box-shadow: inset 3px 0 0`), texte 800** (avec `aria-selected`). Survol `--color-bg` ; appui `--color-surface-2`. Focus : `outline: 2px solid var(--color-focus)`, `outline-offset: -2px`, sans arrondi. En mode édition, `IconEdit` en `--color-icon-accent` et `IconTrash` en `--color-danger`, sélectionnée ou non.

**Édition des catégories :**

- Rangée pilule, portrait / tablette < 768 : barre d'outils de 52 px sous les onglets (`Group justify="space-between" px="sm"`) : nom de la catégorie sélectionnée (16 / 700, passe à la ligne) + `Button variant="light" h={44}` « Modifier » (`IconEdit`, couleur primaire) et « Supprimer » (`IconTrash`, `color="red"`). Masquée sur « Toutes ».
- Paysage : pas de barre ; deux `ActionIcon` 44×44 fixés à droite de la rangée d'onglets, hors défilement (voir maquette).
- Colonne (tablette ≥ 768, desktop) : icônes dans la ligne, chaque `ActionIcon` `w={44}` `flex: none` (remplace `w="50%"`).
- « + Nouvelle catégorie » : dernier onglet en pointillés (rangée) ; `NewCategoryButton` inchangé en bas (colonne).

## Carte produit — `ProductCard`

Structure (plus de `<button>` imbriqué) :

```tsx
<Card withBorder radius="lg" p={0} h="auto" mih={MIH[mode]}>   // 144 / 72 / 144 / 160
  <UnstyledButton onClick={isEditMode ? onEdit : onAdd} flex={1} p={PAD[mode]}  // 12 (xs 8 en paysage)
                  aria-label={isEditMode ? 'Modifier <nom>' : 'Ajouter <nom>'}>
    <Stack gap="xs" align="flex-start" justify="space-between" h="100%">   // paysage : Group en ligne
      <Tile />                                                    // pastille-icône, voir icons.md
      <Stack gap={2}>
        <Text fw={600} size={mode === 'desktop' ? 'lg' : 'md'}
              style={{ overflowWrap: 'anywhere' }}>{name}</Text>  // pas de lineClamp
        <Text fw={800} fz={20} style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{price}</Text>
      </Stack>
    </Stack>
  </UnstyledButton>
  {isEditMode && (
    <Group gap={0} grow h={48} style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <ActionIcon variant="subtle" radius={0} h={48} aria-label="Modifier">  <IconEdit size={22} color="var(--color-icon-accent)" />
      <ActionIcon variant="subtle" radius={0} h={48} aria-label="Supprimer"> <IconTrash size={22} color="var(--color-danger)" />
    </Group>
  )}
</Card>
```

- **Toucher la carte en mode édition ouvre la modification** (même action que ✎).
- Le nom n'est jamais coupé : la carte grandit ; la grille (`SimpleGrid`) aligne la hauteur des cartes d'une même rangée.
- **Aspect** : fond `--color-surface`, contour 1 px `--color-border`, rayon 20 (`--radius-card`), `--shadow-card` en clair (en sombre : contour seul, pas d'ombre). Texte aligné à gauche : pastille en haut, nom (16 / 600) puis prix (20 / 800 `nowrap`, tabulaire) en bas.
- **Pastille** : voir [icons.md](icons.md#pastille-icône). Contenu décoratif (`aria-hidden`).
- **Pastille de quantité** (D-045, D-048 ; masquée en mode édition) : quantité de la ligne du produit dans le panier, remise comprise ; si le produit est déjà dans le panier, une pastille ronde 28 px (`min-width`, 14 / 800) en haut à droite de la carte affiche la quantité (fond `--color-primary`, texte `--color-on-primary`) et la carte prend un contour 2 px `--color-primary`. L'`aria-label` devient « Ajouter <nom>, 2 dans le panier ». Dérivée du panier, aucun nouvel état.
- **Consigne (prix négatif)** : contour **pointillé** 1.5 px `--color-danger` (2 px pointillé `--color-danger` quand elle est dans le panier, en clair comme en sombre), pastille `--color-danger-tint` + `IconRecycle`, prix en `--color-danger` avec le signe « − » : trois signaux, pas la couleur seule.
- États : survol / appui = fond `--color-surface-2` ; focus : anneau `--color-focus` 2 px (offset 2), jamais supprimé.

**Nouveau produit — `NewProductCard`** : même `Card`/`UnstyledButton`, `mih` identique à la carte produit (plus de `h` fixe), fond `--color-bg`, contour **pointillé** 1.5 px `--color-border-strong`, `IconPlus` 32 (téléphone, tablette) / 48 (desktop) en `--color-icon-accent`, libellé `md` (téléphone, tablette) / `lg` (desktop), 700, passe à la ligne.

## Ligne de panier — `Cart/CartItem`

Deux rangées, tous modes :

```
Rangée 1 :  [Nom (16/600, flex:1, minWidth:0, passe à la ligne)]   [Prix (16/700, nowrap, flex:none)]
            sous le prix, si remise : [IconDiscount 16] −0,50 €  (14/600, `--color-success`)
Rangée 2 :  [ − ] 2 [ + ]   (ActionIcon size={44}, radius 14, icônes 20 ; quantité 18/800 miw 32)      [⋮ 44×44]
```

- Ligne : `Stack gap="xs" py="xs"` ; séparateur `Divider` (`--color-border`) entre lignes.
- Boutons de quantité : **−** = `variant="light"` (fond `--color-primary-tint`, icône `--color-text`) ; **+** = filled encre, icône `--color-on-primary`. Prix en tabulaire.
- Menu ⋮ : `ActionIcon size={44} variant="subtle" aria-label="Plus d'actions"` ; `Menu width={220} position="bottom-end"` (fond `--color-surface`, `--shadow-pop`, rayon 14) ; items `py="md"` 16 px : « Appliquer une remise » (`IconDiscount`), « Supprimer » (`IconTrash`, `color="red"`).
- **Lecture seule** (historique D-023, récapitulatif de confirmation D-026) : une seule rangée, nom préfixé de la quantité « 2 × Café long » + prix.

## Panier

**Panneau du panier** (tablette, desktop, Drawer) : fond `--color-surface`, bordure gauche `--color-border` (tablette, desktop).

**Pied standard** (tablette, desktop, Drawer) : `Stack gap="sm" p="md"`, bordure haute `--color-border`. « Articles » 16 `--color-text-2` / nombre seul 16 / 600 (« Articles … 3 ») ; « Total » 24 / 800 et montant 24 / 800 `nowrap` tabulaire ; `Button size="lg" fullWidth` « Valider » (encre `--color-primary`, texte `--color-on-primary`, `h` 56, rayon `--radius-action`, 18 / 800, `IconArrowRight` 22 à droite du texte). Panier vide (tablette, desktop, Drawer) : message « Votre panier est vide » (`--color-text-2`) et pied masqué.

**En-tête du panier** (tablette, desktop) : historique et vider, `ActionIcon` 48×48 `variant="subtle"`. Vider : `IconTrash` `--color-danger`, `aria-label` « Vider le panier », désactivé si panier vide.

**Barre repliée** (portrait) : `Paper` **encre** (`--color-bar`) en dernier élément de la colonne de la page (dans le flux, pas en `fixed` : il ne recouvre jamais la grille), `h` = `calc(var(--cart-bar-height) + env(safe-area-inset-bottom))` (80 + zone sûre), `pb` = `env(safe-area-inset-bottom)`, `px="md"`, `--shadow-bar`, pas de bordure (encre sur crème) en clair, bordure haute `--color-border` en sombre. Contenu `Group wrap="nowrap"` :

- zone gauche `UnstyledButton` (`flex: 1`, ouvre le Drawer, `aria-label` « Voir le panier ») : « N articles » 14-16 `--color-on-bar-2` au-dessus du total 26 / 800 `--color-on-bar` `nowrap` ; panier vide : « Panier vide » `--color-on-bar-2` ;
- `ActionIcon size={44}` `IconChevronUp` `--color-on-bar` (ouvre aussi) ;
- `Button` « Valider » **crème sur la barre** (`--color-primary-on-bar`, texte `--color-on-primary-on-bar`, survol `--color-on-bar-2`, `h={56}`, `radius` 18, 18 / 800, `IconArrowRight`), désactivé si vide (`disabled`, `opacity: 0.45` ; un contrôle désactivé est exempté de contraste, l'état est aussi porté par « Panier vide »).
- Focus dans la barre : `--color-focus-on-bar`.

**Pulsation à l'ajout** (portrait) : quand le nombre d'articles augmente, le total passe en `scale(1.08)` puis revient (150 ms, `ease-out`). Rien avec `prefers-reduced-motion: reduce`.

**Drawer** (portrait) : `Drawer position="bottom" size="85%" radius="lg"` (coins hauts 20), fond `--color-surface`, `--shadow-pop`, poignée 40 × 4 `--color-border-strong`, titre « Panier » 18 / 700, en-tête : vider (`ActionIcon` 44) + fermeture (44). Corps : lignes (seule zone qui défile) + pied standard. « Valider » ouvre la confirmation par-dessus ; après une vente réussie, le Drawer se referme (**le panier est replié après chaque vente**) ; si on annule la confirmation, on revient au Drawer.

**Colonne droite compacte** (paysage) : voir [spacing-layout.md](spacing-layout.md#2-téléphone-paysage). Pas d'en-tête ; pied d'une rangée de 60 px, fond encre `--color-bar` (comme la barre portrait) : vider 44 (`--color-on-bar`, icône danger interdite sur encre : `IconTrash` `--color-on-bar`) · « N articles » `--color-on-bar-2` / total 20 / 800 `--color-on-bar` · « Valider » `--color-primary-on-bar` `h={44}` `flex: 1` `miw={110}`.

## Vider le panier + toast « Annuler »

1. Toucher « vider » vide **immédiatement** le panier (pas de confirmation).
2. Toast `toast.info` (style info, `toastId: 'cart-cleared'`, un seul à la fois) : « Panier vidé » + `Button variant="outline" h={44}` « Annuler », couleur `var(--color-info-text)` (texte et bordure ; le toast info est l'encre inversée, 15.9:1 en clair, 15.1:1 en sombre).
3. Options du toast : `autoClose: 5000`, `closeOnClick: false`, `pauseOnHover: true`, `closeButton: false` (la croix chevauchait « Annuler »).
4. « Annuler » remet l'ancien panier (lignes, quantités, remises), puis ferme le toast sans autre message.
5. Si le panier est modifié pendant ces 5 s (ajout d'un produit), le toast reste et « Annuler » **fusionne** (D-019) : l'ancien panier revient et les produits ajoutés entre-temps restent, après les anciennes lignes. Un produit présent dans les deux paniers voit ses quantités **et** ses montants de remise additionnés (D-024 : 2 × Bière −1 € + 1 × Bière −0,50 € → 3 × Bière −1,50 €).
6. Dès qu'une commande est validée, le toast se ferme et l'annulation n'est plus possible (D-025).
7. Un nouveau vidage pendant que le toast est affiché remplace l'offre d'annulation précédente (un seul toast à la fois).

## Historique — `OrderHistoryModal`

- `Modal fullScreen` en téléphone (portrait et paysage), `size="lg" centered` sinon.
- Fond de la modale `--color-bg` ; carte de commande `Card withBorder radius="lg"` fond `--color-surface`, `--shadow-card` en clair :
  - en-tête : « Commande #12 » 16 / 700, date en dessous 14 `--color-text-2` ; **aucun bouton** ;
  - lignes en lecture seule (16 px) ;
  - pied `Group justify="space-between" wrap="nowrap"` : total 18 / 800 `nowrap` + « N articles » 16 `--color-text-2` ; à droite `Button color="red" variant="light" h={44} leftSection={<IconTrash size={20} />}` « Supprimer » (fond `--color-danger-tint`, texte `--color-danger`).
- La **confirmation existante est conservée** (`ConfirmationModal`) ; ses boutons ≥ 44 px, « Annuler » en `variant="default"` (action non destructive).
- **Paiement** (instances en euros, commandes passées par l'écran « Encaissement ») : entre les lignes et le pied, `Group gap="xs"` de `Badge size="lg" variant="default" tt="none" fz={14} fw={600}`, un par mode dont le montant est non nul, ou le seul mode choisi si le total est ≤ 0 :
  - « Espèces 5,00 € », `leftSection={<IconCash size={16} />}` ;
  - « Carte 2,50 € », `leftSection={<IconCreditCard size={16} />}`.
  - Montant `nowrap`. Le libellé porte l'information (pas de couleur par mode). Aucun badge pour les anciennes commandes (pas de données de paiement) ni pour les instances en jetons.

## Encaissement — `CartConfirmationModal`

Remplace l'ancien « Récapitulatif de confirmation ». Décisions de l'utilisateur du 2026-11-20 (à consigner dans `docs/business/decisions.md`). Version 1.3.0.

La modale ne passe plus par `ConfirmationModal` : plus de boutons « Confirmer / Annuler ». On ferme avec la croix (44 × 44) ou Échap ; le panier reste intact.

### Depuis la 2.2.0 : moyen d'abord, une part par moyen (D-053)

Ce bloc **prime** sur les sous-sections suivantes (écrites pour la 1.3.0, D-028 à D-033) partout où elles diffèrent. Les maquettes ASCII plus bas sont celles de la 1.3.0 : à redessiner par le designer.

- **Euros, total > 0** : deux boutons « Espèces » (`IconCash`) | « Carte » (`IconCreditCard`), `SimpleGrid cols={2}`, en premier. Rien n'est sélectionné à l'ouverture (bloc de rendu : « Choisissez Espèces ou Carte »). Le moyen choisi est `variant="filled"` + `aria-pressed`. Un moyen qui a déjà sa part est désactivé, avec un `title` « Ce moyen a déjà une part : supprimez-la pour la modifier » (DS-3 de la PR #47).
- **Carte** : montant prérempli avec le reste dû, pavé visible. Téléphone portrait (DS-1 de la PR #47) : vue pavé avec la rangée « Espèces | Carte » toujours visible (h 48), libellé « Montant carte », touches h 44, bloc de rendu `mih` 96, espacement `xs` ; la ligne repliée du total est masquée quand une part existe (la liste des parts et « Il reste » la remplacent). Téléphone paysage : bouton « ← Moyens » `variant="default"` h 44, 16 / 700. Le retour « ← Montants » des espèces a le même style. Jamais au-dessus du reste : une touche qui le ferait dépasser est sans effet. La première touche remplace le montant prérempli.
- **Espèces** : « Espèces reçues », 4 suggestions dont la **première est le montant exact du reste dû** (avec ses centimes, « 7,50 € »), puis 3 montants supérieurs (`suggestAmounts` sur le reste dû) ; pavé (téléphone : « Autre montant »). **Plus de bouton « Appoint »**. Toucher une suggestion remplit le montant, sans enregistrer. Si une part carte existe déjà, la première suggestion est préremplie.
- **Bouton principal contextuel** : « Encaisser » (`IconCheck`) si la part complète le reste dû (espèces ≥ reste, ou carte = reste) : il enregistre. Sinon « Ajouter » (`IconPlus`) : la part est ajoutée et on revient au choix de l'autre moyen. Désactivé sans montant, ou si le dernier moyen restant ne couvre pas le reste (bloc : « Ce montant doit couvrir le reste », `IconAlertTriangle`).
- **Parts** : liste sous le total (une ligne par moyen : icône 20, libellé 16 / 600, montant 18 / 700, `ActionIcon` 44 `IconTrash` `--color-danger`, `aria-label` « Supprimer la part Espèces »). Supprimer une part remet son montant dans le reste dû.
- **Bloc de rendu** : nouveaux états « Il reste » sans saisie (`due`, parts ajoutées, même style que « Il reste ») et « Tout est réglé » (`paid`, carte = reste, même style que « Rien à rendre »). « Il reste » s'applique aux deux moyens (sous-libellé « Espèces reçues » ou « Carte », icône de l'autre moyen). États « Il manque » et libellés en jetons supprimés.
- **Total ≤ 0 (euros)** : bloc « Rien à encaisser » / « À rendre au client », boutons « Espèces » | « Carte » qui **sélectionnent** seulement, puis le bouton principal : « Rembourser » (`IconArrowBackUp`, total négatif) ou « Encaisser » (0 €), désactivé tant qu'aucun moyen n'est choisi.
- **Jetons** : récapitulatif, total et bouton principal seulement (« Encaisser », « Rembourser » si négatif). Ni bloc de rendu, ni suggestions, ni pavé, ni clavier physique.
- **Clavier physique** : actif une fois un moyen choisi (euros, total > 0) ; `Enter` déclenche le bouton principal (« Encaisser » ou « Ajouter ») s'il est actif.
- **Nombre de touchers** (total 7,50 €) : Carte = Valider, Carte, Encaisser (**3**) ; espèces exactes ou billet = Valider, Espèces, suggestion, Encaisser (**4**) ; mixte 5 € espèces + carte = Valider, Espèces, 5 (pavé), Ajouter, Carte, Encaisser (**6** sur tablette / desktop, +1 en téléphone pour « Autre montant »).

### Principe

1. Le vendeur touche « Valider » : la modale « Encaissement » s'ouvre avec le récapitulatif (lignes « 2 × Nom », D-026), le total, puis le choix du paiement.
2. **Rien à rendre → enregistrement dès le toucher** : « Carte » et « Appoint » enregistrent la vente immédiatement.
3. **Monnaie à rendre** : toucher un montant (suggestion ou pavé) affiche « À rendre » en grand **dans le même écran**. Le vendeur rend la monnaie, **puis** touche « Encaisser ». L'enregistrement vient après le rendu, pour que le montant reste affiché pendant qu'on compte.
4. Un montant saisi au pavé égal au total affiche « Rien à rendre » et attend « Encaisser » : on n'enregistre jamais pendant la frappe (taper « 7,5 » pour « 7,55 » enregistrerait trop tôt).
5. Le mode de paiement est **obligatoire, sans valeur par défaut**. Moyens : **Espèces** et **Carte** seulement. Choisir un montant d'espèces vaut choix « Espèces » : il n'y a pas de bouton « Espèces » à toucher avant (sauf total ≤ 0, voir plus bas).
6. **Paiement mixte** : si les espèces reçues sont inférieures au total, l'écran affiche « Il reste 2,50 € » et le bouton principal devient « Reste en carte (2,50 €) », qui enregistre. Seule la part en espèces peut donner lieu à un rendu ; la carte est toujours débitée du montant exact.
7. À l'ouverture de l'encaissement, **les toasts de succès sont fermés** (celui de la vente précédente recouvrait les boutons en téléphone) ; les toasts d'erreur restent (DS-2).
8. Après l'enregistrement : la modale se ferme, toast succès « Commande n°12 enregistrée · Espèces » (ou « · Carte », « · Espèces + Carte »), le Drawer du panier se referme en portrait (inchangé). En cas d'erreur API, la modale reste ouverte avec la saisie conservée et un toast d'erreur s'affiche (inchangé). Si l'API refuse une commande sans paiement (code `PAYMENT_REQUIRED`, D-035), le toast d'erreur invite à recharger la page (`payment_required_reload`).

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
- `[✕]` à droite de l'affichage (`ActionIcon size={44} variant="subtle"`, `IconX` `--color-text`, `aria-label` « Effacer le montant ») remet la saisie à vide.
- Toucher une suggestion **remplace** la saisie (l'affichage montre « 20 ») ; la touche suivante du pavé recommence une nouvelle saisie. Toucher une autre suggestion remplace la précédente : on n'additionne jamais.
- Saisie « 0 » ou vide = aucun montant (état « vide » du bloc de rendu).

### États du bloc de rendu

Toujours au même endroit, `Paper radius="md" p="md" mih={96}` (**`mih={112}` en téléphone portrait**, DS-4) (hauteur réservée : l'écran ne saute pas), `role="status" aria-live="polite"`. Fond `--color-surface-2`, rayon 20 (`--radius-card`). Montants `nowrap`, tabulaires. Sous-libellés « Reçu », « Espèces reçues » en `--color-text-2` ; montants principaux en `--color-text`.

| État | Quand | Contenu | Fond / bordure / icône |
| --- | --- | --- | --- |
| **Vide** | aucun montant | « Choisissez Carte ou le montant reçu » (jetons : « Choisissez le nombre de jetons reçus ») 16 `--color-text-2` | fond `surface-2`, 1 px `--color-border`, pas d'icône |
| **À rendre** | reçu > total | ligne 1 : « Reçu » 16 `--color-text-2` + « 20,00 € » 18 / 700 ; ligne 2 : « À rendre » 20 / 700 + montant **40 / 800** `--color-text` | fond `--color-primary-tint`, 2 px `--color-text` (clair) / `--color-primary` (sombre) ; `IconCoins` 28 `--color-icon-accent` |
| **À rendre élevé** | rendu > 100 € (euros seulement) | idem + ligne « Rendu élevé : vérifiez le montant reçu » 16 / 600, `IconAlertTriangle` 20 `--color-icon-accent`. Non bloquant | idem « À rendre » |
| **Rien à rendre** | reçu = total (pavé) | « Reçu 7,50 € » + « Rien à rendre » 24 / 800 | fond `surface-2`, 2 px `--color-border-strong` ; `IconCheck` 28 `--color-success` |
| **Il reste** (euros) | 0 < reçu < total | « Espèces reçues 5,00 € » + « Il reste » 20 / 700 + montant **32 / 800** `--color-text` | fond `surface-2`, 2 px `--color-text` ; `IconCreditCard` 28 `--color-text` |
| **Il manque** (jetons) | 0 < reçu < total | « Reçu 5 Jetons » + « Il manque » 20 / 700 + montant 32 / 800 `--color-danger` | fond `--color-danger-tint`, 2 px `--color-danger` ; `IconAlertTriangle` 28 `--color-danger` |
| **À rendre au client** | total < 0 | « À rendre au client » 20 / 700 + montant (valeur absolue) **40 / 800** | idem « À rendre » |
| **Rien à encaisser** | total = 0 | « Rien à encaisser » 20 / 700 | fond `surface-2`, 1 px `--color-border` |

Contrastes : `text` sur `primary-tint` 13.5:1 (clair) / 12:1 (sombre) ; `danger` sur `danger-tint` 5.3:1 / 5.4:1 ; bordures `text` 15.6:1 (clair), `primary` 14.7:1 (sombre), `danger` ≥ 3:1. Chaque état se lit par son texte et son icône, jamais par la seule couleur (le rouge de « Il manque » est doublé du mot « Il manque » et de `IconAlertTriangle`).

### Bouton principal (pied)

Un seul bouton principal en bas, toujours présent, `Button fullWidth` filled (encre `--color-primary`, texte `--color-on-primary`, rayon `--radius-action`), 18 / 800 :

| État du bloc | Bouton | Action |
| --- | --- | --- |
| Vide | « Encaisser » **désactivé**, `IconCheck` | — |
| À rendre / À rendre élevé / Rien à rendre | « Encaisser », `IconCheck` | enregistre (espèces = total) |
| Il reste (euros) | « Reste en carte (2,50 €) », `IconCreditCard` | enregistre (mixte) |
| Il manque (jetons) | « Encaisser » désactivé | — |
| Total ≤ 0 | pas de bouton principal (voir plus bas) | — |

**Désactivé** (« Encaisser » vide / « Il manque ») : même style que « Valider » du panier, encre estompée (`disabled`, `opacity: 0.45`), pas le gris Mantine (décision revue PR #30). Un contrôle désactivé est exempté de contraste ; l'état est porté par le bloc de rendu (« Choisissez… » / « Il manque »). Ne pas descendre sous 0.45 pour que le libellé reste lisible.

Pendant l'enregistrement (`isLoading`), **tous** les boutons de la modale sont désactivés et « Encaisser » / « Carte » / « Appoint » portent `loading` (anti double toucher).

### Bouton « Carte »

- Aucun montant d'espèces saisi : « Carte » (`IconCreditCard`).
- Un montant d'espèces est saisi : le libellé devient « Tout en carte (7,50 €) ». Le toucher enregistre tout en carte et ignore la saisie (correction d'un mauvais choix en 1 toucher).
- Écart accepté (revue design PR #24) : en demi-largeur, « Tout en carte (7,50 €) » était coupé. Le bouton affiche 2 lignes comme « Appoint » : « Tout en carte » 16 / 600 (clé `payment_all_card_label`) + montant 18 / 700 `nowrap` ; `IconCreditCard` 20 ; `px="xs"` et libellé `whiteSpace: 'normal'` (DS-1). Le libellé complet `payment_all_card` reste l'`aria-label`.

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

**Téléphone portrait** — `Modal fullScreen`. Corps en colonne flex sur toute la hauteur : seul le récapitulatif rétrécit (`ScrollArea` `flex: 1`, `mih={88}` pour garder 2 lignes, `offsetScrollbars` pour que la barre ne recouvre pas les prix, DS-3) ; le pied est collé en bas, `pb` = `env(safe-area-inset-bottom)`.

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
│ ┃   À rendre         12,50 €   ┃ │ 40/800, fond primary-tint, 2 px text (clair) / primary (sombre)
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
│ Total · 3 articles        7,50 € │ 44, 16 / total 20/800
│ [← Montants]        5 €     [✕]  │ 44 ; saisie 32/800 à droite
│ [  7  ][  8  ][  9  ]            │
│ [  4  ][  5  ][  6  ]            │ 56, 24/700, SimpleGrid cols=3
│ [  1  ][  2  ][  3  ]            │
│ [  ,  ][  0  ][  ⌫  ]            │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ▭ Espèces reçues      5,00 € ┃ │ fond surface-2, 2 px text
│ ┃   Il reste            2,50 € ┃ │ 32/800
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────┤
│ [ ▭ Reste en carte (2,50 €)    ] │ 56
└──────────────────────────────────┘
```
« ← Montants » (`Button variant="subtle" h={44}`, texte `--color-text`, `IconArrowLeft`) revient à la vue « Montants » en gardant la saisie.

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
| Total | `Group justify="space-between" wrap="nowrap"` : « Total · N articles » 16 (même ordre partout, ligne repliée comprise, DS-6) + montant 24 / 800 `nowrap` (20 / 800 sur la ligne repliée) | — |
| Carte | `Button variant="default"`, `leftSection={<IconCreditCard size={24} />}`, 18 / 700 | h 56 / 56 / 48 |
| Appoint | `Button variant="default"`, contenu `Stack gap={0}` : « Appoint » 16 / 600 + montant 18 / 700 `nowrap` (paysage : une ligne « Appoint 7,50 € ») | h 56 / 56 / 48 |
| Libellé « Espèces reçues » / « Jetons reçus » | `Text` 16 `dimmed`, `leftSection` visuel `IconCash` 20 | — |
| Suggestions | `SimpleGrid cols={4} spacing="xs"` de `Button variant="default"` 20 / 700 `nowrap`, `px={0}` ; sélectionnée : `variant="filled"` (encre, texte `--color-on-primary` 15,5:1 clair / 15:1 sombre) + `leftSection={<IconCheck size={18} />}` + `aria-pressed` | h 56 / 56 / 48 |
| Autre montant | `Button variant="default" fullWidth`, `leftSection={<IconKeyboard size={20} />}`, 16 / 700 | h 48 / absent / 48 |
| Pavé | `SimpleGrid cols={3}` (paysage `cols={4}`) `spacing="xs"` de `Button variant="default"` 24 / 700 ; ⌫ = `IconBackspace` 24 | h 56 / 64 / 44 |
| Bloc de rendu | voir « États du bloc de rendu ». Montant long : en portrait, tablette et desktop, il passe sous son libellé au lieu de déborder (écart accepté) ; en paysage, montant 28 / 800 en jetons (DS-5) | montant 40 / 40 / 32 (28 en jetons) ; `mih` 112 / 96 / 96 |
| Bouton principal | `Button fullWidth` filled, 18 / **800** (aligné sur « Valider », décision revue PR #30), icône 22 | h 56 / 56 / 48 |
| Espacements | `Stack gap="sm"` ; 8 px minimum entre cibles | — |

Tokens utilisés : `--color-primary`, `--color-primary-tint`, `--color-icon-accent`, `--color-danger(-tint)`, `--color-success`, `--color-text(-2)`, `--color-surface(-2)`, `--color-border(-strong)`. Boutons « Carte », « Appoint » et pavé : `variant="default"` (fond `--color-surface`, contour `--color-border`, texte `--color-text`).

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
| `payment_required_reload` | Le paiement n'a pas été enregistré : rechargez la page pour utiliser la dernière version de l'appli. | The payment was not recorded: reload the page to use the latest version of the app. |
| `payment_cash_received` | Espèces reçues | Cash received |
| `payment_other_amount` | Autre montant | Other amount |
| `payment_back_to_amounts` | Montants | Amounts |
| `payment_received` | Reçu | Received |
| `payment_received_aria` | Reçu {{amount}} | Received {{amount}} |
| `payment_change_due` | À rendre | Change due |
| `payment_no_change` | Rien à rendre | No change |
| `payment_remaining` | Il reste | Remaining |
| `payment_refund_due` | À rendre au client | Refund to customer |
| `payment_nothing_due` | Rien à encaisser | Nothing to collect |
| `payment_large_change` | Rendu élevé : vérifiez le montant reçu | Large change: check the amount received |
| `payment_collect` | Encaisser | Complete sale |
| `payment_clear_amount` | Effacer le montant | Clear amount |
| `payment_backspace` | Effacer le dernier chiffre | Delete last digit |
| `payment_placeholder_mode` (D-053) | Choisissez Espèces ou Carte | Choose Cash or Card |
| `payment_placeholder_cash` (D-053) | Choisissez le montant reçu | Choose the amount received |
| `payment_placeholder_card` (D-053) | Saisissez le montant payé par carte | Enter the amount paid by card |
| `payment_card_amount` (D-053) | Montant carte | Card amount |
| `payment_back_to_modes` (D-053) | Moyens | Methods |
| `payment_add_part` (D-053) | Ajouter | Add |
| `payment_remove_part` (D-053) | Supprimer la part {{mode}} | Remove the {{mode}} part |
| `payment_fully_paid` (D-053) | Tout est réglé | Fully paid |
| `payment_must_cover` (D-053) | Ce montant doit couvrir le reste | This amount must cover the rest |
| `payment_refund` (D-053) | Rembourser | Refund |
| `payment_mode_has_part` (D-053) | Ce moyen a déjà une part : supprimez-la pour la modifier | This method already has a part: remove it to change it |
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

Décalage bas : `--toastify-toast-bottom` dans `variables.css` (au-dessus de la barre panier en portrait : `calc(var(--cart-bar-height) + env(safe-area-inset-bottom) + 12px)`, 16 px ailleurs). Ne recouvre jamais l'en-tête ni le titre / la croix des modales.

**Aspect** : couleurs des tokens `--color-success-bg/-text`, `--color-danger-bg/-text`, `--color-info-bg/-text` (voir [colors.md](colors.md#tokens)), rayon 16, `--shadow-pop`, texte 16 / 600, icône d'état react-toastify conservée (succès ✓, erreur !, info i) : l'état ne dépend jamais de la couleur seule. L'info est l'encre inversée (pas de bleu).

## Modales (hors encaissement)

`Modal` Mantine : fond `--color-surface`, rayon 20 (`--radius-card`), `--shadow-pop`, overlay `rgba(28,27,25,.5)` (clair) / `rgba(0,0,0,.65)` (sombre) ; plein écran sur téléphone. En-tête : titre 18 / 700, croix `closeButtonProps={{ size: 44 }}` `--color-text`. Pas de bordure d'en-tête. Pied d'actions : boutons ≥ 44 px, `gap` 8 px, action principale encre à droite, « Annuler » `variant="default"` ; action destructive `color="red"` (`variant="light"` sauf confirmation finale `filled`). `ConfirmationModal` et formulaires produit / catégorie / remise suivent ces règles.

**Gabarits (PR #31, étape 4, validés)** :

- **Confirmations** (`ConfirmationModal`, suppression de commande / produit / catégorie) : modale **centrée, jamais plein écran**, même sur téléphone (petit contenu, le contexte reste visible derrière). « Annuler » `variant="default"` à gauche, action à droite (D-050) ; suppression = `color="red"` **plein** (`filled`). En sombre, le texte du bouton rouge plein est `--color-danger-text` (`#3A0B0B`, 6.2:1), jamais du blanc (≈ 2.8:1 sur `#F87171`).
- **Formulaires produit / catégorie, remise, « À propos »** : `fullScreen` sur téléphone ; sur desktop, modale centrée étroite (largeur du formulaire laissée libre pour l'instant, non spécifiée).
- **Pagination de l'historique** : boutons 44 × 44 px, écart 8 px ; page active encre (`--color-primary`, texte `--color-on-primary`), les autres `variant="default"`.
- **« Nouvelle catégorie »** (mode édition) : `--radius-control`, bordure pointillée 1.5 px `--color-border-strong`, fond `--color-bg`, icône `IconPlus` + libellé 16 / 600 ; même famille que la carte « Nouveau Produit ».
- **`SegmentedControl` de la remise** (Montant fixe / Pourcentage) : même style que la bascule du thème (`h` 44, rayon 14, sélectionné encre `--color-primary` + texte `--color-on-primary` 800). Les libellés peuvent passer sur deux lignes à 360 px ; ne jamais les tronquer.
- **Non décrits à ce jour** : états vide, erreur et chargement de l'historique ; largeur des formulaires desktop.

Champs : fond `--color-surface-2`, contour 1 px `--color-border-strong` (≥ 3:1, c'est un contrôle de saisie), rayon 14, `h` 48, texte 16 ; focus = anneau `--color-focus` 2 px.

## « À propos »

Modale ou page ouverte depuis le menu ⚙️ (`IconInfoCircle`, « À propos »). Contenu centré : logo (`BrandLogo`) 64 px, « Caisse Claire » 24 / 800, accroche « Une caisse simple, claire et nette. » 16 `--color-text-2`, puis numéro de version 14 `--color-text-2` tabulaire (et lien vers les mentions s'il existe). Ne remplace pas le nom de l'association de l'en-tête.

## Bascule clair/sombre — menu réglages

Dans le menu ⚙️, une entrée « Apparence » avec trois choix en `SegmentedControl` (`h` 44, rayon 14, sélectionné = encre `--color-primary` + texte `--color-on-primary` 800, libellés **et** icônes : `IconSun` « Clair », `IconMoon` « Sombre », `IconDeviceDesktop` « Auto ») : « Auto » suit `prefers-color-scheme`. Via `useMantineColorScheme()` ; le choix est mémorisé par Mantine (`localStorage`). Le changement est immédiat, sans rechargement ; tous les écrans doivent être vérifiés dans les deux thèmes (contrastes de [colors.md](colors.md#contrastes-attendus)). L'état courant se lit par le libellé et l'icône, pas par la couleur seule.
