# Deployment

All instances run on the VPS from its existing `compose.yaml`, behind Traefik.
The CI never edits that file: it only pushes images and restarts the matching services.

| Merge into | Image tag                            | Compose services                                 | Approval |
| ---------- | ------------------------------------ | ------------------------------------------------ | -------- |
| `develop`  | `julesgrateau/token-register:test`   | `token-register` (demo.julesgrateau.dev)         | none     |
| `main`     | `julesgrateau/token-register:latest` | `token-register-poule`, `token-register-atakora` | required |

Flow: `feature/*` → PR into `develop` (CI runs tests) → merge → **auto-deploy to demo/test** →
PR `develop` → `main` → merge → **approve in GitHub** → deploy to production instances.

The pipeline lives in [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml):
`test` (lint, unit tests, build) → `build` (image pushed to Docker Hub) → `deploy` (SSH to the
VPS, `docker compose pull` + `up -d --no-deps` of those services only, then checks each
container is still running after the DB migrations).

Adding a new production instance: add its service to the VPS `compose.yaml` with the `:latest`
image, then add its name to `SERVICES` in the `deploy` job.

## One-time setup

### 1. VPS

Create an SSH key pair dedicated to the CI and add the public key to `~/.ssh/authorized_keys`
of the user that owns the `compose.yaml` (it must be able to run `docker`).

### 2. Docker Hub

Create an access token (Account settings → Personal access tokens, _Read & Write_).

### 3. GitHub

- **Branch**: create `develop` from `main` and push it.
- **Settings → Secrets and variables → Actions**, repository secrets:
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
  - `VPS_HOST`: VPS IP or hostname
  - `VPS_USER`: SSH user
  - `VPS_SSH_KEY`: private SSH key (the whole file content)
  - `VPS_DEPLOY_PATH`: absolute path of the directory containing `compose.yaml`
  - `VPS_PORT` (optional, defaults to 22)
- **Settings → Environments → New environment `production`** → _Required reviewers_: yourself.
  Without it, a merge into `main` restarts the production instances immediately.
- **Settings → Branches** (recommended): protect `main` and `develop` (require PR + the `test` check).

## Rollback

Each build is also tagged `sha-<commit>`. On the VPS, temporarily set the service image to
`julesgrateau/token-register:sha-1a2b3c4` in `compose.yaml`, then:

```sh
docker compose up -d --no-deps token-register-poule
```

Restore the `:latest` image once a fixed version is merged.
