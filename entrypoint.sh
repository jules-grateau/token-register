#!/bin/sh
# Use /bin/sh for broader compatibility (alpine base image uses ash, not bash by default)
set -e # Exit immediately if a command exits with a non-zero status

echo "Entrypoint: Running Database Initialization..."

# Run the database initialization script from package.json
# This assumes your WORKDIR in Dockerfile is the app root
npm run prod:db:init

# Execute the command passed as CMD from the Dockerfile (which will be ["npm", "start"])
exec "$@"