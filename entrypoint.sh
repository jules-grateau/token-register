#!/bin/sh
# Use /bin/sh for broader compatibility (alpine base image uses ash, not bash by default)
set -e # Exit immediately if a command exits with a non-zero status

echo "Entrypoint: Running Database Initialization..."

# Run the database initialization script from package.json
# This assumes your WORKDIR in Dockerfile is the app root
npm run prod:db:init

echo "Entrypoint: Running Database Migrations..."

# Run database migrations
# Migration script is idempotent and safe to run on every startup
npm run prod:db:migrate

echo "Entrypoint: Database setup complete. Starting application..."

# Execute the command passed as CMD from the Dockerfile (which will be ["npm", "start"])
exec "$@"