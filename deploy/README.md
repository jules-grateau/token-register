# Deployment

All instances run on the VPS from its existing `compose.yaml`, behind Traefik.
The CI never edits that file: it only pushes images and restarts the matching services.

| Merge into | Image tag                            | Compose services                                                                        | Approval |
| ---------- | ------------------------------------ | --------------------------------------------------------------------------------------- | -------- |
| `develop`  | `julesgrateau/token-register:test`   | `token-register` (demo.julesgrateau.dev, tokens) + EUR demo (secret `DEMO_EUR_SERVICE`) | none     |
| `main`     | `julesgrateau/token-register:latest` | `token-register-<instance>` (secret `PROD_SERVICES`)                                    | required |

**EUR demo** (D-059): a second demo, in euros, redeployed with the token demo on every merge
into `develop`. Its compose service runs the `:test` image with `CURRENCY=EUR`. Its service
name, URL and login account (D-063) are repository secrets, never written in this repository. After the
deploy, `scripts/demo/seed-eur-catalog.mjs` gives it a demo catalog **only if it has no
category and no product at all**; it never modifies what exists (D-055) and refuses an instance
that is not in euros. The token demo gets no catalog from the CI. If the EUR demo does not
restart or its catalog cannot be created, the deploy fails.

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
  - `DEMO_EUR_SERVICE`: compose service of the EUR demo (`:test` image, `CURRENCY=EUR`)
  - `DEMO_EUR_URL`: base URL of the EUR demo (e.g. `https://<eur-demo-host>`)
  - `DEMO_EUR_LOGIN_USER`, `DEMO_EUR_LOGIN_PASS`: its dedicated cashier account (3.0.0, D-063;
    used by the catalog script after the deploy and by the release smoke check)
  - `DEMO_LOGIN_USER`, `DEMO_LOGIN_PASS`: the dedicated cashier account of the token demo (used by
    the release smoke check)
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

   An order line with no recorded price (possible in an old database) keeps an empty price:
   the preview warns with "N ligne(s) de commande sans prix enregistré (commandes #x, #y) :
   prix inconnu, laissé vide" and leaves those lines out of the history total (D-056).

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

## Cash days (2.4.0)

From 2.4.0, sales happen during a **cash day** (D-061): it is started and ended in the app
(⚙️ > "Journée de caisse", or the banner over the cart). Without an open day, the app and the API
refuse every sale, in tokens and in euros. The history only shows the open day's orders; the
orders of an ended day are listed, and deleted, in "Journées passées".

**The first start of 2.4.0 deletes every existing order** (answer 18 b of D-061): the migration
adds the `cash_days` table and `orders.cash_day_id`, then deletes the orders placed before the
cash days, with their lines, in the same transaction. It happens once, in the run that adds the
column; later starts change nothing. The catalog and the settings are kept. **Back up the
database before deploying** (see "Fixing a currency mismatch" for the `docker compose cp`
command) if the old orders must be kept somewhere.

After the deploy, start a day before the first sale. A tab left open on the previous version
gets an error on its next sale until a day is started and the page is reloaded.

A currency conversion also converts the totals announced at the end of each day; going to
tokens, their cash / card split is cleared, like the orders' (D-036).

## User accounts (3.0.0)

From 3.0.0, the Basic Auth is gone: each person logs in with their own account on the login
screen of the app (D-063). Roles: **admin**, **manager** (gérant) and **cashier** (caissier). The
three have every right of today (sale, catalog, cash day, order deletion); only the account
management (screen of the next version) is for the admin. Rights come from a role → permissions
table, read again on every request: a new role, or a disabled account, applies at once.

- **First admin**: `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD` on the service, read
  **only while the database has no account at all**, whether it holds data or not, then ignored
  (they can be removed afterwards). Without them on such a database, or with an invalid value, the
  container stops before the app starts, with a message naming the variable in `docker logs`.
  Username: 3 to 32 characters, letters, digits, `.`, `_` or `-` (case does not matter:
  `Marie` = `marie`). Password: 6 characters minimum. The password is never written in the logs.
- **`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`** are no longer read: a warning is logged at startup
  while they are set. Remove them from `compose.yaml`.
- **Session**: an httpOnly, `SameSite=Strict` cookie, `Secure` in production (`COOKIE_SECURE=false`
  only for a local HTTP instance). It ends after 7 days without any request, or at logout
  ("Se déconnecter" in ⚙️). The cart stays on the device.
- **`FRONTEND_URL`** must be the URL the app is opened from: a write request sent from another
  origin is refused (403).
- **`TRUST_PROXY_HOPS`**: number of reverse proxies in front of the container, **`1` behind
  Traefik**, `0` by default. It gives the real client IP to the login limiter (5 failures for a
  username and an IP: 1 minute of wait). Never more than the real number of proxies: a client could
  then choose its IP. The failure counts are kept in memory: a restart resets them.

### Before deploying 3.0.0

For **every** instance (production and both demos), in `compose.yaml`:

1. Add `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` (the admin of that instance).
2. Add `TRUST_PROXY_HOPS=1` (behind Traefik).
3. Remove `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`.
4. Back up the database (the migration only adds tables and empty columns, see MIGRATIONS.md).

For the demos (no public account, D-063): after the deploy, each demo gets a dedicated account
for the CI, meant to be a **cashier**. The account screen comes with the next version: until then,
create it with `reset-admin-password` below (it is then an admin), and make it a cashier once
the account screen is there. Then, in GitHub
(**Settings → Secrets and variables → Actions**):

- create `DEMO_LOGIN_USER` / `DEMO_LOGIN_PASS` (token demo) and `DEMO_EUR_LOGIN_USER` /
  `DEMO_EUR_LOGIN_PASS` (EUR demo);
- delete `DEMO_BASIC_AUTH_USER`, `DEMO_BASIC_AUTH_PASS`, `DEMO_EUR_BASIC_AUTH_USER` and
  `DEMO_EUR_BASIC_AUTH_PASS`.

A workflow that runs before these secrets exist (catalog of the EUR demo after the deploy, release
smoke check) fails at the login: create the secrets first, then re-run it once. Do not re-run it
in a loop: 5 failed logins make that account wait 1 minute.

### Lost admin access: `reset-admin-password`

```sh
# The new password is read from the environment, never from the command line: type it without
# echo, then pass the variable by name only.
read -rs RESET_ADMIN_PASSWORD && export RESET_ADMIN_PASSWORD
docker compose run --rm --no-deps --entrypoint "" -e RESET_ADMIN_PASSWORD <service> \
  npm run prod:db:reset-admin-password -- <username>
unset RESET_ADMIN_PASSWORD
```

- Existing account (any case): new password, account reactivated and made admin again, all its
  sessions closed. Unknown username: a new admin account is created.
- The password is not temporary in this version, and is never printed.
- Same rules as above (username, 6 characters); nothing is written if they are not met.
- No restart needed: the next login uses the new password.

### Rollback

The migration is additive (tables `users`, `roles`, `role_permissions`, `sessions`, columns
`orders.created_by`, `cash_days.opened_by`, `cash_days.closed_by`): a 2.x image starts on a
migrated database. **But a 2.x image protects the app with `BASIC_AUTH_*` only**: put them back on
the service before rolling back, otherwise the instance is unprotected.
