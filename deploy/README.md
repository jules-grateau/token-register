# Deployment

All instances run on the VPS from its existing `compose.yaml`, behind Traefik.
The CI never edits that file: it only pushes images and restarts the matching services.

| Merge into | Image tag                            | Compose services                                     | Approval |
| ---------- | ------------------------------------ | ---------------------------------------------------- | -------- |
| `develop`  | `julesgrateau/token-register:test`   | `token-register` (demo.julesgrateau.dev)             | none     |
| `main`     | `julesgrateau/token-register:latest` | `token-register-<instance>` (secret `PROD_SERVICES`) | required |

Flow: `feature/*` → PR into `develop` (CI runs tests) → merge → **auto-deploy to demo/test** →
PR `develop` → `main` → merge → **approve in GitHub** → deploy to production instances.

The pipeline lives in [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml):
`test` (lint, unit tests, build) → `build` (image pushed to Docker Hub) → `deploy` (SSH to the
VPS, `docker compose pull` + `up -d --no-deps` of those services only, then checks each
container is still running after the DB migrations).

Adding a new production instance: add its service to the VPS `compose.yaml` with the `:latest`
image, then add its name to the `PROD_SERVICES` repository secret (see below).

The list of production services is not written in this repository: the `deploy` job reads it
from the `PROD_SERVICES` secret, masked in the logs. If it is empty, the production deployment
fails before connecting to the VPS. The logs never print service or container names (they are
public): read the `docker compose` output on the VPS. The `production` environment has no URL.

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
  - `PROD_SERVICES`: production compose services to restart, space-separated
    (e.g. `token-register-<instance-a> token-register-<instance-b>`)
- **Settings → Environments → New environment `production`** → _Required reviewers_: yourself.
  Without it, a merge into `main` restarts the production instances immediately.
- **Settings → Branches** (recommended): protect `main` and `develop` (require PR + the `test` check).

## Rollback

Each build is also tagged `sha-<commit>`. On the VPS, temporarily set the service image to
`julesgrateau/token-register:sha-1a2b3c4` in `compose.yaml`, then:

```sh
docker compose up -d --no-deps token-register-<instance>
```

Restore the `:latest` image once a fixed version is merged.

## Currency

Each instance runs either in tokens or in euros, set by the `CURRENCY` environment variable of
its service in `compose.yaml`: `TOKEN` (default when unset) or `EUR` (decisions D-008 to D-014).
It is shown read-only in the app (⚙️ menu). Amounts are stored as whole numbers: tokens, or cents.

- **New EUR instance**: add `CURRENCY=EUR` to the new service before its first start. Like any new
  instance, it starts with no data (D-055) and records EUR in its database.
- **Existing production instances**: each one runs in tokens or in euros according to the
  `CURRENCY` of its service. An instance moved from tokens to euros has its history converted with
  the command below. The demo uses the `CURRENCY` of its service.
- **Databases that predate the currency feature**: on their first start, the migration records
  `TOKEN` in them.
- **Safety check**: on every start, the migration compares `CURRENCY` with the currency recorded
  in the database. If they differ, the container stops before the app starts, with a
  `Currency mismatch` message in `docker logs`. Nothing is ever converted automatically.

### Fixing a currency mismatch

1. **The configuration is wrong** (most common): set `CURRENCY` back to the value given in the
   error message, then `docker compose up -d --no-deps <service>`.
2. **The instance really has to change currency**: use the conversion command. It converts the
   catalog **and** the order history 1 for 1 (D-009): 3 tokens → 3,00 €; euros → tokens are
   rounded to the nearest token, .5 away from zero (1,50 € → 2, 1,49 € → 1, -1,50 € → -2).

   ```sh
   # 1. Stop the service and back up its database (docker compose cp works on a stopped container)
   docker compose stop <service>
   docker compose cp <service>:<DATABASE_PATH> ./backup/database-$(date +%Y%m%d-%H%M).sqlite

   # 2. Preview: lists every converted price and the history total, writes nothing
   docker compose run --rm --no-deps --entrypoint "" <service> \
     npm run prod:db:convert-currency -- --to=EUR

   # 3. Apply (single transaction), then record the new currency
   docker compose run --rm --no-deps --entrypoint "" <service> \
     npm run prod:db:convert-currency -- --to=EUR --apply

   # 4. Set CURRENCY=EUR on the service in compose.yaml, then restart it
   docker compose up -d --no-deps <service>
   ```

   `--entrypoint ""` skips the startup migration, which would otherwise stop on the mismatch.
   The command refuses to write anything if, after rounding, an order line would get a discount
   larger than its total (D-016); the preview lists those lines. Handle those orders first,
   then run the conversion again.

   Recorded payments (cash / card amounts, 1.3.0) are converted with the history when going to
   euros. Going **to tokens**, they are cleared, since token instances record no payment (D-036);
   order totals are converted as usual. The preview warns first: "N commandes : la répartition
   espèces / carte sera effacée".

## Client name

The app is called **Caisse Claire** (D-039). The name of the association using an instance is
shown in the header, next to the logo, and in the browser tab ("Asso · Caisse Claire"). It is set
by the `CLIENT_NAME` environment variable of its service in `compose.yaml` (D-040), and cannot be
changed in the app.

- Optional: without `CLIENT_NAME` (or with a blank value), the header shows the logo and
  "Caisse Claire" only.
- The name is never truncated: a long name wraps and the header grows. Keep it under 80
  characters.
- Quotes and accents are fine (`CLIENT_NAME: "L'amicale des pompiers"`). Restart the service
  (`docker compose up -d --no-deps <service>`) to apply a change; no data is touched.
- The technical names do not change (D-043): image `julesgrateau/token-register`, services
  `token-register-*`.

## Payments (1.3.0)

On EUR instances, each order records the amount paid in cash and the amount paid by card
(D-034). On the first start of 1.3.0, the migration adds two nullable columns to `orders`
(`cash_amount`, `card_amount`); existing orders keep no payment. Nothing to do by hand: back up
the database before deploying, as for any schema change. Token instances record no payment.

From 1.3.0, an EUR instance **refuses an order without payment** (D-035), including the format
sent by older versions of the app. A tab left open on the previous version gets an error until the
page is reloaded: after deploying an EUR instance, ask the cashiers to reload the page.
Token instances still accept the old format.
