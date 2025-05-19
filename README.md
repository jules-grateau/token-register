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

1. **Clone the repository**

   ```sh
   git clone https://github.com/jules-grateau/token-register.git
   cd token-register
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Setup environment variables**

   - Copy `api/.env.example` to `api/.env` and fill in the values as needed.
   - Copy `client/.env.example` to `client/.env` and set the API URL if different.

4. **Initialize the database**

   ```sh
   npm run init-db -w=api
   ```

   This will create and seed the SQLite database at `api/src/db/data/database.sqlite` or where configured in the `api/.env` file

5. **Start the backend**

   ```sh
   npm run start -w=api
   ```

   The backend runs on the port specified in `api/.env` (default: 3001).

6. **Start the frontend**

   In a new terminal:

   ```sh
   npm run dev -w=client
   ```

   The frontend runs on [http://localhost:5173](http://localhost:5173) or where configured in the `client/.env` file.

## Production Deployment

To deploy the backend in production, this project uses [PM2](https://pm2.keymetrics.io/) for process management.

### 1. Build the backend and frontend
```sh
npm run build
```
This should create the `/dist` folder is both `/api` and `/client`

### 2. Set up environment variables

- Copy `api/.env.example` to `api/.env.production` (or `.env`) and fill in production values (e.g., `NODE_ENV=production`, correct `DATABASE_PATH`, credentials, etc.).

### 3. Initialize the database

Before starting the server, ensure the database is initialized:

```sh
npm run prod:db:init
```

### 4. Start the backend with PM2

If you do not have pm2, install it with

```sh
npm install pm2 -g
```

From the project root, run:

```sh
pm2 start ecosystem.config.js
```

This will launch the backend using the configuration in [`ecosystem.config.js`](ecosystem.config.js).

### 5. (Optional) Manage the process

- View logs: `pm2 logs`
- Restart: `pm2 restart token-register-api`
- Stop: `pm2 stop token-register-api`
- List: `pm2 list`

For more details, see the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/).

## Usage

- Open the frontend in your browser.
- Use the cart to add products and checkout orders.
- View and delete order history.
- All API requests are protected by basic authentication (credentials set in `api/.env`).

## Development

- **Flush the database:**  
  ```sh
  npm run flush-db -w=api
  ```

- **Initialize the database:**  
  ```sh
  npm run init-db -w=api
  ```

## Environment Variables

See [`api/.env.example`](api/.env.example) and [`client/.env.example`](client/.env.example) for all available variables.

## License

ISC
