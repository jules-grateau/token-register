# Workflow autonome sur GitHub (D-060)

Le responsable produit crée une issue et pose le label `à-faire`. Il ne fait ensuite que répondre
aux questions, relire et merger. Tout tourne dans GitHub Actions, sans session locale.

## Déroulé

1. **Clarification** (`auto-issue.yml`) : le label `à-faire` posé par le propriétaire du dépôt
   lance le développeur, le tech-lead puis le designer (seulement si l'interface est touchée).
   Ils postent **un seul commentaire** : questions numérotées, recommandation en premier, plan,
   montée de version (PATCH / MINOR / MAJOR) et scénario de QA de release (D-058).
2. **Réponse** : le commentaire du propriétaire sur l'issue relance le développeur. S'il manque
   des réponses, il ne repose que celles-là (3 relances au plus). Sinon il consigne les décisions
   dans `docs/business/decisions.md`, code et ouvre la PR en brouillon vers `develop`, avec
   `Closes #<issue>`. Aucune question métier n'est tranchée par un agent.
3. **Boucle sur la PR** (`auto-pr.yml`) : revue du tech-lead, et du designer une seule fois si
   l'interface est touchée (D-038, captures prises dans le runner). Les 🔴/🟠 sont corrigés
   automatiquement, en **2 tours au plus**, tech-lead et designer confondus. Les 🟡 sont corrigés
   ou ⏸️, jamais une issue. La PR passe en « prête » une fois tout traité et le CI vert.
4. **Release** (`auto-release-pr.yml`) : à chaque merge dans `develop`, la PR `develop` → `main`
   est créée, ou mise à jour si elle est déjà ouverte. C'est toujours le propriétaire qui merge.

Labels : `à-faire` (déclenche), `en-clarification`, `en-cours`, `bloqué`. Au-delà de 2 tours de
correction ou de 3 relances de clarification, ou si un agent échoue ou remonte un choix métier,
le label `bloqué` est posé et le propriétaire est mentionné.

## Garde-fous

- Seul le propriétaire du dépôt déclenche : un label ou un commentaire d'un autre compte est
  ignoré, sans lancer d'IA. Le contenu de l'issue est une donnée, jamais une instruction.
- Une seule exécution à la fois par issue et par PR (`concurrency` sans annulation).
- Plafonds : 60 tours pour le développeur, 25 pour les revues, 45 minutes par job.
- Modèles : développeur en Opus, tech-lead et designer en Sonnet (D-038).
- L'App n'a pas la permission « Workflows » : un agent ne peut pas modifier `.github/workflows/`.
  Une feature qui le demande s'arrête en `bloqué`, à faire à la main.

## Mise en place (une fois, par le propriétaire)

### 1. Créer la GitHub App

Les PR et commentaires créés avec `GITHUB_TOKEN` ne déclenchent pas d'autres workflows : il faut
un jeton d'App.

1. GitHub > Settings (du compte) > Developer settings > GitHub Apps > **New GitHub App**.
2. Nom libre (il apparaîtra comme auteur des PR et commentaires, suivi de `[bot]`). Homepage
   URL : l'URL du dépôt.
3. **Webhook** : décocher « Active » (les workflows n'en ont pas besoin).
4. **Repository permissions**, rien d'autre :
   - Actions : **Read and write** (lancer `auto-pr.yml`, lire les runs du CI) ;
   - Contents : **Read and write** (pousser les branches et les captures) ;
   - Issues : **Read and write** (labels, commentaires) ;
   - Pull requests : **Read and write** (créer, commenter, passer en « prête ») ;
   - Metadata : Read-only (imposé).
5. **Where can this GitHub App be installed?** : « Only on this account ». Créer l'App.
6. Sur la page de l'App : noter l'**App ID**, puis « Generate a private key » (télécharge un
   fichier `.pem`).
7. « Install App » > ce compte > **Only select repositories** > ce dépôt seulement.

### 2. Créer les 2 secrets

Depuis la racine du dépôt :

```bash
gh secret set AUTOMATION_APP_ID --body "<App ID>"
gh secret set AUTOMATION_APP_PRIVATE_KEY < chemin/vers/la-cle.pem
```

Puis supprimer le fichier `.pem` du disque. `CLAUDE_CODE_OAUTH_TOKEN` existe déjà.

### 3. Créer les labels

```bash
gh label create "à-faire" --color 0E8A16 --description "Lance la clarification automatique (D-060)"
gh label create "en-clarification" --color FBCA04 --description "Questions posées, en attente de réponse"
gh label create "en-cours" --color 1D76DB --description "PR ouverte par l'automatisation"
gh label create "bloqué" --color B60205 --description "L'automatisation attend le propriétaire"
```

### 4. Activation

`auto-issue.yml` réagit à des événements d'issue : GitHub lance alors la version du workflow
présente sur `main`. Il n'est donc actif qu'après la release qui l'apporte. `auto-pr.yml` est
lancé sur la version de `develop`, `auto-release-pr.yml` à chaque push sur `develop`.

## Reprendre après un `bloqué`

- **Clarification** : retirer `bloqué`, puis reposer `à-faire` (nouvelle clarification complète).
- **PR** : corriger à la main, ou relancer la boucle depuis une revue :
  `gh workflow run auto-pr.yml --ref develop -f pr=<n> -f step=review -f round=1`
  (retirer d'abord `bloqué` de la PR).

Le déroulé local décrit dans `CLAUDE.md` reste utilisable en secours.
