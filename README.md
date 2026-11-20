# Caisse Claire

> Une caisse simple, claire et nette.

A simple register software for associations and events, built with a React + TypeScript frontend and an Express + SQLite backend.

The technical name stays `token-register` (repository, Docker image, containers, npm packages): see D-043 in `docs/business/decisions.md`.

## Features

- Product and category management (predefined in DB)
- Cart and order management
- Order history with deletion
- Basic authentication for API
- Modern UI with React, Redux Toolkit, and Vite
- TypeScript shared types between frontend and backend

## Project Structure

```
token-register/
├── api/                         # Express backend (TypeScript)
│   ├── src/
│   │   ├── db/
│   │   │   ├── data/            # SQLite database file
│   │   │   ├── scripts/         # DB init/flush scripts
│   │   │   └── index.ts
│   │   ├── middleware/          # Express middlewares
│   │   ├── logger.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── client/                      # React frontend (TypeScript, Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Cart/
│   │   │   ├── Catalog/
│   │   │   ├── Button/
│   │   │   ├── ErrorBoundary/
│   │   │   ├── Register/
│   │   │   └── ...
│   │   ├── redux/               # Redux slices and store
│   │   ├── services/            # API service hooks
│   │   ├── styles/              # CSS variables and global styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── shared-ts/                   # Shared TypeScript types
│   ├── index.ts
│   └── package.json
├── .gitignore
├── package.json                 # Monorepo root
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Setup

#### 1. **Clone the repository**

```sh
git clone https://github.com/jules-grateau/token-register.git
cd token-register
```

#### 2. **Install dependencies**

```sh
npm install
```

#### 3. **Setup environment variables**

- Copy `api/.env.example` to `api/.env` and fill in the values as needed.
- Copy `client/.env.example` to `client/.env` and set the API URL if different.
  
- Alternatively, you can setup the environment variable when running the docker image.
- If the client is distributed by the backend, you will also need to setup the client environment variable on the backend env, so it will be distributed to it. See [`client/config/index.ts`](client/config/index.ts)

##### **API**

```env
NODE_ENV= production # Environement
PORT= 3000 # Port where the server should run
DATABASE_PATH= /data/database.sqlite # Path to the Database
BASIC_AUTH_USER= demo 
BASIC_AUTH_PASS= demo
FRONTEND_URL= https://your-app # Used for CORS authorization - Should not be used in production
LOG_LEVEL= info # Level of log needed
RUNTIME_VITE_BASE_API_URL= https://your-app/api # URL to API - Used when the frontend is distributed by the backend.
RUNTIME_VITE_DEFAULT_LANGUAGE= en # Define the default language. - Used when the frontend is distributed by the backend.
CURRENCY= TOKEN # TOKEN (default) or EUR. Fixed per instance, see deploy/README.md > Currency.
CLIENT_NAME= Comité des fêtes # Optional. Association name shown in the header, see deploy/README.md > Client name.
```

##### **CLIENT**

```env
VITE_BASE_API_URL=http://localhost:3001/api # URL to API - Used when deploying FrontEnd separatly
VITE_DEFAULT_LANGUAGE=fr # Default Language - Used when deploying FrontEnd separatly
VITE_CURRENCY=TOKEN # TOKEN or EUR, must match the API CURRENCY - Used in development / when deploying FrontEnd separatly
VITE_CLIENT_NAME= # Optional association name in the header - Used in development / when deploying FrontEnd separatly
```

#### 4. **Initialize the database**

```sh
npm run init-db -w=api
```

This will create and seed the SQLite database at `api/src/db/data/database.sqlite` or where configured in the `api/.env` file

Then run the migrations, which also record the instance currency (the API refuses to start without it):

```sh
npm run dev:db:migrate -w=api
```

#### 5. **Start the backend**

```sh
npm run start -w=api
```

The backend runs on the port specified in `api/.env` (default: 3001).

#### 6. **Start the frontend**

In a new terminal:

```sh
npm run dev -w=client
```

The frontend runs on [http://localhost:5173](http://localhost:5173) or where configured in the `client/.env` file.

### Running Unit Tests

This project uses [Jest](https://jestjs.io/) for unit testing (with TypeScript support).

To run tests for backend:
```sh
npm run test -w=api
```

Test results and coverage reports will be shown in the terminal.

### Development

- Flush the database:
```sh
npm run flush-db -w=api
  ```

- Initialize the database:
```sh
npm run init-db -w=api
```

---

## Production Deployment

To deploy the backend in production, this project uses [PM2](https://pm2.keymetrics.io/) for process management.

### 1. Setup the environement variable

- Copy `api/.env.example` to `api/.env.production` (or `.env`) and fill in production values (e.g., `NODE_ENV=production`, correct `DATABASE_PATH`, credentials, etc.).
- Alternatively, you can setup the environment variable when running the docker image.

### 2. Build the backend and frontend

```sh
npm run build
```

This should create the `/dist` folder is both `/api` and `/client`

### 3. Initialize the database

Before starting the server, ensure the database is initialized:

```sh
npm run prod:db:init
```

### Run the app 
```sh
npm run prod:start
```
## Usage

- Open the frontend in your browser.
- Use the cart to add products and checkout orders.
- View and delete order history.
- All API requests are protected by basic authentication (credentials set in `api/.env`).

## Docker

You can build and run the entire application using Docker. This is useful for production deployments or local testing without installing Node.js and dependencies directly.

## Docker Image

The latest image is available on Docker Hub:

[https://hub.docker.com/r/julesgrateau/token-register](https://hub.docker.com/r/julesgrateau/token-register)

You can pull it directly:

```sh
docker pull julesgrateau/token-register:latest
```

### 1. Build the Docker Image

From the project root, run:

```sh
docker build -t token-register:latest .
```

### 2. Run the Docker Container

Use the following command to run the container, passing all necessary environment variables:

```sh
docker run \
  --hostname=21be9781661d \
  --env=PORT=3000 \
  --env=FRONTEND_URL=localhost:8080 \
  --env=DATABASE_PATH=_your_DB_path \
  --env=BASIC_AUTH_USER=your_auth_user \
  --env=BASIC_AUTH_PASS=your_auth_password \
  --env=LOG_LEVEL=info \
  --env=NODE_ENV=production \
  --env=RUNTIME_VITE_BASE_API_URL=localhost:8080 \
  --env=RUNTIME_VITE_DEFAULT_LANGUAGE=en \
  --env=CURRENCY=TOKEN \
  --env="CLIENT_NAME=Comité des fêtes" \
  --network=bridge \
  --workdir=/usr/src/app \
  -p 8080:3000 \
  --restart=no \
  --runtime=runc \
  -d token-register:latest
```

**Notes:**

- Adjust the environment variables as needed for your deployment (especially credentials and URLs).
- The backend will be available on port `3000` inside the container and mapped to `8080` on your host (`-p 8080:3000`).
- The frontend will be served from the same container and port.
- The FRONTEND_URL is only required if you wish to use the API with CORS
- The database file will be created inside the container at the path specified by `DATABASE_PATH`. If you want to persist data, consider mounting a volume.

### 3. Persisting Data (Optional)

To persist the SQLite database outside the container, add a volume:

```sh
-v /path/on/host/data:/usr/src/app/api/src/db/data
```

and set `DATABASE_PATH=/usr/src/app/api/src/db/data/database.sqlite`.

### 4. Database Migrations

When updating to a new version of the application, database migrations may be required. The Docker image automatically runs migrations on startup via the `entrypoint.sh` script.

**For existing containers:**
- The entrypoint runs migrations automatically on container start
- Migrations are idempotent (safe to run multiple times)
- See [feature migration guides](./specs/) for specific migration details

**Manual migration** (if needed):
```bash
# Run migration in existing container
docker exec -it <container-name> npm run prod:db:migrate

# Or run in temporary container with volume
docker run --rm \
  -v /host/path/to/data:/usr/src/app/api/src/db/data \
  -e DATABASE_PATH=/usr/src/app/api/src/db/data/database.sqlite \
  token-register:latest \
  npm run prod:db:migrate
```

**Important:** Always backup your database before deploying major updates:
```bash
docker cp <container-name>:/path/to/database.sqlite ./backup/database-$(date +%Y%m%d).sqlite
```

For detailed migration procedures, see:
- [Order History Preservation Deployment Guide](./specs/002-order-history-preservation/deployment.md)

---

## Versioning

The app version follows `MAJOR.MINOR.PATCH` (e.g. `1.2.3`). The **root `package.json`** is the
source of truth; the `api` and `client` workspaces carry the same number. It is shown in the app
under ⚙️ > "About" (with the commit hash and a "Demo" badge on the demo instance).

**Bump it by hand in the feature PR that will be released** (D-027), from the repo root. If a
release contains several PRs, only the first one bumps, unless a later one changes the category
(e.g. a fix release that gets a new feature: PATCH → MINOR). PRs that don't touch the app (docs,
agents, review workflows) don't bump. The release PR `develop` → `main` itself needs no change:

```sh
npm version <new-version> --workspaces --include-workspace-root --no-git-tag-version --allow-same-version
# e.g. npm version 1.1.0 ...  (PATCH: fixes only, MINOR: new features, MAJOR: breaking changes)
```

Then commit `package.json`, `api/package.json`, `client/package.json`, `shared-ts/package.json`
and `package-lock.json`.

What CI does with it:

- **PR to `main`**: fails if the version is not greater than the one on `main`.
- **Push to `main`**: refuses to build if tag `v<version>` already exists; tags the Docker image
  `:<version>` (in addition to `:latest` and `:sha-xxxxxxx`); after the production deploy, creates
  the git tag `v<version>` and a GitHub Release with notes generated from the merged PRs.
- **If the `release` job fails after a production deploy** (e.g. GitHub API error), re-run
  **only that job** ("Re-run failed jobs"). A full re-run would be blocked by `build` as soon as
  the tag exists.
- **Push to `develop`**: the demo image shows the current version + commit hash, with a "Demo" badge.

---

## License

ISC
