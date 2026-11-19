# Décisions métier

Registre des choix métier de **token-register**, tous **confirmés par le responsable produit**.
C'est la référence pour le développement : ce qui est écrit ici s'applique, et ce qui n'y est pas
doit être demandé avant d'être implémenté (voir `.claude/agents/developpeur.md`).

## Règles du registre

- Une entrée = une décision confirmée. On n'ajoute rien qui n'a pas été validé.
- On ne réécrit pas une décision : si elle change, on ajoute une nouvelle entrée qui la remplace
  et on passe l'ancienne au statut `Remplacée par D-XXX`.
- La décision est ajoutée dans le même commit que le code qui l'applique.

## Format d'une entrée

```markdown
### D-001 — Titre court de la décision

- **Date** : AAAA-MM-JJ
- **Confirmée par** : qui a validé la décision
- **Statut** : Active | Remplacée par D-XXX
- **Domaine** : Prix & jetons | Commandes | Catalogue | Remises | Accès | Autre
- **Contexte** : la question qui se posait, et pourquoi.
- **Décision** : ce qui a été décidé, formulé comme une règle vérifiable.
- **Options écartées** : les autres options envisagées, en une ligne chacune.
- **Impact** : fichiers / features concernés (PR ou spec liée si utile).
```

## Décisions

### D-001 — Format du numéro de version et version de départ

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : l'appli n'avait pas de numéro de version maintenu ; il faut en afficher un.
- **Décision** : la version suit le format `MAJOR.MINOR.PATCH` (ex. `1.2.3`). La première version est `1.0.0`.
- **Options écartées** : version par date (`2026.11.19`) ; simple compteur (`v14`) ; départ en `0.1.0`.
- **Impact** : `package.json` (racine et workspaces), README > Versioning.

### D-002 — Incrément manuel de la version à chaque mise en prod

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut décider qui monte le numéro et quand.
- **Décision** : la version est montée à la main dans la PR `develop` → `main`, par le développeur sur demande. La CI fait échouer la PR vers `main` si la version n'est pas supérieure à celle de `main`.
- **Options écartées** : incrément automatique déduit des titres de commits ; +1 automatique sur le dernier chiffre à chaque merge sur `main`.
- **Impact** : `.github/workflows/ci-cd.yml` (job `version-check`), `scripts/ci/version-bumped.sh`.

### D-003 — Affichage de la version en prod et en démo

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut décider quelles informations montrer selon l'instance.
- **Décision** : en prod, on affiche seulement « Version x.y.z ». En démo, on affiche la version, le code court du commit et un badge « Démo ». En local, un badge « Développement » s'affiche. Une information absente n'est jamais affichée.
- **Options écartées** : version + commit + date de build partout ; version seule partout.
- **Impact** : `client/src/config/version.ts`, `client/src/components/AboutModal`.

### D-004 — Marquage de chaque version mise en prod

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut pouvoir retrouver chaque version livrée et revenir en arrière.
- **Décision** : à chaque mise en prod, la CI crée le tag git `v<version>` et une Release GitHub dont les notes sont générées depuis les PR, et tague l'image Docker `:<version>`. La CI échoue si ce tag existe déjà, c'est-à-dire si la version n'a pas été montée.
- **Options écartées** : tag git seul ; `CHANGELOG.md` écrit à la main ; aucun marquage.
- **Impact** : `.github/workflows/ci-cd.yml` (jobs `build` et `release`).

### D-005 — Version visible par tous les utilisateurs

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Accès
- **Contexte** : il faut décider si l'accès au numéro de version est restreint.
- **Décision** : l'écran « À propos » et la version sont accessibles à tous les utilisateurs de la caisse.
- **Options écartées** : réserver l'accès à certains utilisateurs.
- **Impact** : `client/src/components/Register`.

### D-006 — Emplacement de la version : « À propos » dans le menu ⚙️

- **Date** : 2026-11-19
- **Confirmée par** : Jules (responsable produit), 2026-11-19
- **Statut** : Active
- **Domaine** : Autre
- **Contexte** : il faut décider où l'utilisateur trouve la version (proposition du designer).
- **Décision** : le menu ⚙️ contient un item « À propos » qui ouvre une modale avec le nom de l'appli, la version (cf. D-003) et un bouton « Copier les infos ». Ouvrir cette modale ne touche pas au panier.
- **Options écartées** : aucune autre option présentée (proposition du designer validée telle quelle).
- **Impact** : `client/src/components/Register`, `client/src/components/AboutModal`, `client/src/locales`.
