# token-register Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-01

## Active Technologies

- TypeScript 5.8.3 (Backend: Node.js with ts-node/compiled; Frontend: React with Vite) (002-order-history-preservation)
- SQLite3 database (existing tables: categories, products, orders, order_items) (002-order-history-preservation)

- TypeScript 5.8.3 (001-item-category-management)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.8.3: Follow standard conventions

## Recent Changes

- 002-order-history-preservation: Added TypeScript 5.8.3 (Backend: Node.js with ts-node/compiled; Frontend: React with Vite)

- 001-item-category-management: Added TypeScript 5.8.3

<!-- MANUAL ADDITIONS START -->

## Agents (`.claude/agents/`)

- `developpeur` : features, bugs, tests. `designer` : direction artistique (`docs/design/`), icônes, avis UI. `tech-lead` : relecture, ne modifie pas le code.
- Les choix métier ne sont jamais décidés par un agent : ils sont confirmés par l'utilisateur et consignés dans `docs/business/decisions.md`.

### Déroulé d'une feature avec le développeur

1. Lancer `developpeur` en **phase 1 (clarification)** : il analyse sans coder et renvoie ses questions métier groupées + son plan.
2. Poser **toutes** ces questions à l'utilisateur en une fois (AskUserQuestion, avec la recommandation de l'agent en premier), et lui montrer le plan.
3. Relancer **le même agent** (SendMessage, pour garder son contexte) en **phase 2** avec les réponses exactes de l'utilisateur.
4. Si l'agent remonte une nouvelle question « ❓ Choix métier à confirmer », la poser à l'utilisateur et le relancer de même.
5. Ne jamais répondre à une question métier à la place de l'utilisateur.

### Version et mise en prod

- La version est montée **dans la PR de la feature** (D-027), avec le type (PATCH / MINOR / MAJOR) demandé à l'utilisateur pendant la clarification. Pas de PR de bump séparée.
- Mise en prod : une seule PR `develop` → `main`. L'utilisateur la merge, puis approuve le déploiement ; le CI crée le tag et la Release.

### Revues automatiques et réponses

- Chaque PR est relue par le `tech-lead` (workflow `tech-lead-review.yml`, points `TL-n`). Le `designer` relit **une seule fois**, sur la PR de feature qui modifie l'interface, et seulement les écrans touchés, en téléphone portrait et desktop, plus EUR si des montants sont concernés (D-038). Ses points sont numérotés `DS-n`. Sur les PR `develop` → `main`, il n'y a plus de designer : le workflow `design-review.yml` (« Release smoke check ») parcourt la démo et bloque, sans coût, sur une étape en échec, une erreur JS ou un débordement.
- Coût en tokens (D-038) :
  - `designer` et `tech-lead` tournent en Sonnet (`model: sonnet`), le développeur hérite du modèle de la session ;
  - les captures sont en résolution ×1, et le développeur ne les ouvre pas ;
  - les comptes rendus des agents font 30 lignes maximum ;
  - quand on relance un agent, on lui donne la liste précise des écrans ou des fichiers à regarder.
- Pour traiter une revue : lancer `developpeur` avec le numéro de PR (section « Traiter une revue » de son agent). Il corrige, pousse, puis répond sur chaque fil et publie un récapitulatif « 🛠️ Réponse du développeur ». Les points qui demandent un choix métier remontent à l'utilisateur.
- Points reportés : tout point légitime laissé « pour plus tard » devient une issue GitHub (label `suivi`, plus `tech` ou `design`), avec le lien vers le commentaire d'origine. La réponse sur la PR cite l'issue (`📌 … — reporté → #n`). `⏸️` ne sert qu'aux points non retenus. Cela vaut pour le développeur comme pour la session principale. Le tech-lead et le designer, qui ne lancent pas de commandes, signalent seulement le point. La PR qui le traite met `Closes #n`. Liste : `gh issue list --label suivi`.
- Pour clore la boucle côté code : lancer `tech-lead` en mode « vérifier les corrections » sur la PR. Il confirme chaque `TL-n` (✅/❌) dans un commentaire.

### PR en brouillon pendant le travail

Une PR n'est mergeable que quand elle est prête. Le développeur crée ses PR en brouillon (`--draft`) et repasse une PR existante en brouillon (`gh pr ready <n> --undo`) avant de la modifier. Il la remet en « prête » (`gh pr ready <n>`) seulement quand tout est poussé et que les réponses aux revues sont publiées. Pour une PR qui modifie l'interface, il faut aussi que le designer ait validé les captures. La session principale fait de même quand elle relance un agent sur une PR. Le passage en « prête » relance la revue du tech-lead : on ne repasse pas une PR en brouillon pour de simples suggestions 🟡, pour ne pas tourner en boucle.

### Après chaque PR créée : traiter la revue sans attendre qu'on le demande

L'utilisateur n'a pas à demander de traiter les revues. Après chaque `gh pr create` dans une session :

1. La PR est créée en brouillon : le workflow `Tech-lead review` ignore les brouillons et ne tourne pas encore. Une fois tout poussé et lint/tests/build verts, la passer en « prête » (`gh pr ready <PR>`) : c'est ce qui déclenche la revue.
2. Attendre la fin du workflow `Tech-lead review` sur la PR (en arrière-plan) (`gh run list --workflow tech-lead-review.yml --branch <branche>`), puis lire la revue : `gh pr view <PR> --comments` et `gh api repos/{owner}/{repo}/pulls/<PR>/comments`.
3. S'il y a des points 🔴 ou 🟠 : repasser la PR en brouillon, lancer `developpeur` pour les traiter et y répondre, puis la remettre en « prête ». Ce passage relance une revue complète du tech-lead sur la PR corrigée. S'il n'y a que des 🟡 : pas de retour en brouillon. Le développeur les traite ou y répond sur la PR (⏸️ avec raison si non retenu, 📌 + issue si reporté), et c'est tout. Seuls les points qui demandent un choix métier remontent à l'utilisateur, groupés.
4. S'il n'y a rien à traiter : le dire en une ligne.
5. Ne présenter le travail comme terminé qu'une fois la revue traitée et les réponses publiées, avec un résumé des points et de leur statut (✅ / 📌 / ⏸️ / ❓).

Pour une PR de feature qui modifie l'interface : après la revue du tech-lead, faire relire par le `designer` les écrans touchés par la PR (revue ciblée, une seule fois). La PR ne passe en « prête » qu'après sa validation. Si le contrôle automatique d'une release échoue, la correction passe par une PR vers `develop`.

<!-- MANUAL ADDITIONS END -->
