# Token Register

A simple, cashless register software for events, built with a React + TypeScript frontend and an Express + SQLite backend.

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
```

##### **CLIENT**

```env
VITE_BASE_API_URL=http://localhost:3001/api # URL to API - Used when deploying FrontEnd separatly
VITE_DEFAULT_LANGUAGE=fr # Default Language - Used when deploying FrontEnd separatly
```

#### 4. **Initialize the database**

```sh
npm run init-db -w=api
```

This will create and seed the SQLite database at `api/src/db/data/database.sqlite` or where configured in the `api/.env` file

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

---

## License

ISC
