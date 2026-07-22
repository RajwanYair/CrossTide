# CrossTide self-hosted — Vite frontend + Wrangler (miniflare) Worker backend.
#
# Build:  docker build -t crosstide .
# Run:    docker compose up
#
# Two-stage build:
#  1. Build the Vite frontend (static assets)
#  2. Run miniflare serving the Worker API + static files

FROM node:24-slim AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
COPY docs-site/package.json docs-site/

# Install dependencies (production + build tools)
RUN npm ci --ignore-scripts

# Copy source files
COPY index.html vite.config.ts tsconfig.json tsconfig.sw.json ./
COPY src/ src/
COPY public/ public/
COPY worker/ worker/
COPY config/ config/

# Build frontend
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────

FROM node:24-slim AS runtime

WORKDIR /app

# Install wrangler globally for miniflare
RUN npm install -g wrangler@4

# Copy Worker source + wrangler config
COPY worker/ worker/
COPY --from=build /app/node_modules/ node_modules/
COPY package.json ./

# Copy built frontend into a directory wrangler can serve
COPY --from=build /app/dist/ dist/

# Copy D1 migrations
COPY worker/migrations/ worker/migrations/

# Copy the self-hosting wrangler config (overrides production bindings)
COPY docker/wrangler.docker.toml worker/wrangler.toml

# Expose the Worker dev port
EXPOSE 8787

# Health check against the Worker API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8787/api/health || exit 1

# Start miniflare via wrangler dev
CMD ["wrangler", "dev", "--port", "8787", "--host", "0.0.0.0", "--config", "worker/wrangler.toml"]
