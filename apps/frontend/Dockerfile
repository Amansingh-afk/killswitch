# Multi-stage build for Next.js
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files for dependency installation
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/frontend/package.json ./apps/frontend/

# Create .npmrc for public hoisting (helps Next.js find dependencies)
RUN echo "public-hoist-pattern[]=*" > .npmrc && \
    echo "shamefully-hoist=true" >> .npmrc

# Install dependencies
RUN pnpm install

FROM base AS builder
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Create .npmrc for public hoisting (helps Next.js find dependencies)
RUN echo "public-hoist-pattern[]=*" > .npmrc && \
    echo "shamefully-hoist=true" >> .npmrc

# Copy entire workspace from deps (includes all node_modules)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy source code (overwrite with latest)
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Build shared package first (required by frontend)
WORKDIR /app/packages/shared
RUN pnpm build

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

FROM deps AS dev
WORKDIR /app

ENV NODE_ENV=development

# Ensure workspace root files are present (volumes won't overwrite these)
# These are already in deps stage, but being explicit
COPY pnpm-workspace.yaml package.json ./

# Copy source code (volumes will mount over this, but needed for initial setup)
COPY packages ./packages
COPY apps/frontend ./apps/frontend

WORKDIR /app

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "--filter", "frontend", "dev"]

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
# Copy public directory (ensure it exists in source with at least .gitkeep)
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

WORKDIR /app/apps/frontend

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

