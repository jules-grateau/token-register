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

<!-- MANUAL ADDITIONS END -->
