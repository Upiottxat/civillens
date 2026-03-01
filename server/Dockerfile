# ──────────────────────────────────────────────────────────────────────────────
# CiviLens Server — Production Dockerfile (multi-stage)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install ALL deps (including devDependencies for prisma generate)
RUN npm ci

# ── Stage 2: Build / Generate ────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S civics && \
    adduser -S civics -u 1001 -G civics

# Copy only production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma client (it lives inside node_modules)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source
COPY package.json ./
COPY prisma ./prisma
COPY src ./src

# Set ownership
RUN chown -R civics:civics /app

# Switch to non-root user
USER civics

# Railway injects PORT at runtime
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE ${PORT}

# Use dumb-init for proper signal handling (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/server.js"]
