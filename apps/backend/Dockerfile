# Multi-stage build for backend
FROM node:20-bullseye-slim AS base

# Install OpenSSL 1.1 and other required libraries for Prisma
# Debian 11 (bullseye) includes OpenSSL 1.1.1 in the default repositories
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/

# Create .npmrc for public hoisting (helps with module resolution)
RUN echo "public-hoist-pattern[]=*" > .npmrc && \
    echo "shamefully-hoist=true" >> .npmrc

# Install dependencies
RUN pnpm install

FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source code
COPY packages ./packages
COPY apps/backend ./apps/backend

# Generate Prisma client with correct binary target for Debian
WORKDIR /app/apps/backend
RUN rm -rf node_modules/.prisma node_modules/@prisma/client || true && \
    pnpm prisma:generate

# Build
RUN pnpm build

FROM deps AS dev
WORKDIR /app

ENV NODE_ENV=development

# Ensure workspace root files are present (volumes won't overwrite these)
# These are already in deps stage, but being explicit
COPY pnpm-workspace.yaml package.json ./

# Copy source code (volumes will mount over this, but needed for initial setup)
COPY packages ./packages
COPY apps/backend ./apps/backend

# Generate Prisma client with correct binary target for Debian
WORKDIR /app/apps/backend
RUN rm -rf node_modules/.prisma node_modules/@prisma/client || true && \
    pnpm prisma generate

WORKDIR /app

EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "--filter", "backend", "dev"]

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma
# Prisma client is already included in backend/node_modules, no need to copy from root

EXPOSE 3001

CMD ["node", "dist/index.js"]

