# syntax=docker/dockerfile:1
# CiviLens Server — Production Dockerfile (single-stage, clean build)

FROM node:20-alpine

WORKDIR /app

# System deps
RUN apk add --no-cache openssl dumb-init

# Install Node deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Verify server.js is valid (fails build if corrupted)
RUN node -c src/server.js && echo "server.js syntax OK"

# Create non-root user
RUN addgroup -g 1001 -S civics && \
    adduser -S civics -u 1001 -G civics && \
    chown -R civics:civics /app

USER civics

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
