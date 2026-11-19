# Deployment

Two environments run on the same VPS, behind Traefik:

| Branch    | Image tag | Compose service       | URL                                | Database volume          |
| --------- | --------- | --------------------- | ---------------------------------- | ------------------------ |
| `main`    | `:prod`   | `token-register`      | https://demo.julesgrateau.dev      | `token-register-db`      |
| `develop` | `:test`   | `token-register-test` | https://test.demo.julesgrateau.dev | `token-register-test-db` |

Flow: `feature/*` → PR into `develop` (CI runs tests) → merge → **auto-deploy to test** →
PR `develop` → `main` → merge → **auto-deploy to production**.

The pipeline lives in [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml):
`test` (lint, unit tests, build) → `build` (Docker image pushed to `ghcr.io/jules-grateau/token-register`)
→ `deploy` (SSH to the VPS, `docker compose pull` + `up -d` of **that environment only**,
then checks the container is still running after the DB migrations).

## One-time setup

No DNS change needed: the existing wildcard record already points `test.demo.julesgrateau.dev`
to the VPS, and Traefik gets its TLS certificate automatically.

### 1. VPS

In the directory that holds the current `compose.yaml` (**keep the same directory**: Docker
prefixes volume names with the directory name, so moving it would start prod on an empty DB):

```sh
cp compose.yaml compose.yaml.bak          # keep the old file
# copy deploy/compose.yaml from this repo as compose.yaml
# create .env, .env.prod and .env.test from the *.example files of this folder
chmod 600 .env .env.prod .env.test
docker volume ls                          # check the prod volume is <dir>_token-register-db
```

Then switch production from Docker Hub to GHCR once the first `main` build exists:

```sh
docker compose pull token-register && docker compose up -d token-register
```

Create a dedicated deploy user (member of the `docker` group) and add the public part of a
new SSH key to its `~/.ssh/authorized_keys`.

### 2. GitHub

- **Branch**: create `develop` from `main` and push it.
- **Settings → Secrets and variables → Actions**, repository secrets:
  - `VPS_HOST`: VPS IP or hostname
  - `VPS_USER`: deploy user
  - `VPS_SSH_KEY`: private SSH key (the whole file content)
  - `VPS_DEPLOY_PATH`: absolute path of the directory containing `compose.yaml`
  - `VPS_PORT` (optional, defaults to 22)
- **Settings → Environments**: `test` and `production` are created on the first run. Add
  _Required reviewers_ on `production` for a manual approval before each prod deploy.
- **Settings → Branches**: protect `main` and `develop` (require PR + the `test` check).

The VPS pulls with the workflow's short-lived `GITHUB_TOKEN`: no personal token is stored on it.

## Rollback

Each build is also tagged `sha-<commit>`. On the VPS:

```sh
echo "PROD_TAG=sha-1a2b3c4" >> .env     # or TEST_TAG
docker compose up -d token-register
```

Remove the line once a fixed version is merged.

## Useful commands (on the VPS)

```sh
docker compose ps
docker compose logs -f token-register-test
docker compose restart token-register
```
