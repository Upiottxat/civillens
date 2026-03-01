# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────────────
# CiviLens Server — Production Dockerfile (multi-stage)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build / Generate ────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

COPY prisma ./prisma
RUN npx prisma generate

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl dumb-init

RUN addgroup -g 1001 -S civics && \
    adduser -S civics -u 1001 -G civics

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY package.json ./
COPY prisma ./prisma
COPY src ./src

RUN chown -R civics:civics /app
USER civics

ENV NODE_ENV=production
# Default port — Railway overrides this at runtime via injected PORT env var
ENV PORT=4000

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "timeout 15 npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo '[WARN] prisma db push failed — starting server anyway'; exec node src/server.js"]