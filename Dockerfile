# Multi-Stage Dockerfile for Zero-Knowledge Next.js SaaS Starter Kit
# Stage 1: Install dependencies
# Stage 2: Generate Prisma client, initialize database, build Next.js
# Stage 3: Minimal production runner

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/prisma/data/dev.db"

# Generate Prisma Client, initialize the SQLite database, and build Next.js
RUN mkdir -p /app/prisma/data \
 && npx prisma generate \
 && npx prisma db push --skip-generate \
 && npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/prisma/data/dev.db"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Seed copy of the initialized database
COPY --from=builder --chown=nextjs:nodejs /app/prisma/data/dev.db ./prisma/seed/dev.db

# Create runtime data directory
RUN mkdir -p /app/prisma/data && chown -R nextjs:nodejs /app/prisma

# Copy Next.js standalone server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy and prepare entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
