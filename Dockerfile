# Dockerfile for a Node.js app with PM2 (baked-in code)

# ---- Base Stage ----
# Use a specific Node.js version. Alpine is smaller.
FROM node:22-alpine AS base
WORKDIR /usr/src/app

# Install OS-level dependencies if any are needed by your app or build process
# RUN apk add --no-cache <some-package>

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
COPY api/package*.json ./api/
COPY client/package*.json ./client/
COPY ecosystem.config.cjs ./x

# ---- Dependencies Stage ----
# Install ALL dependencies (including devDependencies for the build)
FROM base AS dependencies
RUN npm ci
# If you don't use a lock file:
# RUN npm install

# ---- Build Stage ----
# Copy the rest of your application code
FROM dependencies AS builder
COPY . .
# Run your build script (e.g., compiling TypeScript, bundling frontend assets)
RUN npm run build

# ---- Production Stage ----
# Start from a fresh base image to keep it clean and small,
# or from the 'base' stage if you installed OS packages there you need.
FROM base AS production

# Copy only necessary files from previous stages:
# 1. Production node_modules (re-installing cleanly is often better)
COPY package*.json ./
COPY api/package*.json ./api/
COPY client/package*.json ./client/
RUN npm ci --omit=dev

# 2. Copy the built application code from the 'builder' stage
COPY --from=builder /usr/src/app/api/dist ./api/dist 
COPY --from=builder /usr/src/app/client/dist ./client/dist  
COPY --from=builder /usr/src/app/ecosystem.config.cjs ./ecosystem.config.cjs
# Copy any other necessary runtime files/folders (e.g., public assets, views)
# Example: COPY --from=builder /usr/src/app/public ./public

# Copy the entrypoint script into the image
COPY entrypoint.sh /usr/local/bin/
# Make it executable
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["npm", "run", "prod:start"]