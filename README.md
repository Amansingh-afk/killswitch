# Kill-Switch Risk Engine

A scalable monorepo application for monitoring trading positions, calculating MTM (Mark-to-Market), evaluating risk thresholds, and triggering kill switches when loss limits are breached.

## Architecture

```
dhan/
├── apps/
│   ├── backend/          # Express.js API server
│   ├── frontend/          # Next.js 16 + shadcn/ui
│   └── docs/              # Documentation site
├── packages/
│   ├── shared/            # Shared types, utilities
│   └── config/            # Shared configs (ESLint, TypeScript, etc.)
```

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL, Redis, Prisma
- **Frontend**: Next.js 16, shadcn/ui, TypeScript, Tailwind CSS
- **Monorepo**: pnpm workspaces

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose (for local development)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment files and fill in your values:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 3. Start Docker Services (PostgreSQL & Redis)

```bash
docker-compose up -d
```

### 4. Run Database Migrations

```bash
docker exec -it killswitch-backend pnpm --filter backend prisma:migrate
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
pnpm dev

# Or start individually
pnpm dev:backend
pnpm dev:frontend
```

## Available Scripts

- `pnpm dev` - Start both backend and frontend in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Type check all packages

## Project Structure

- `apps/backend` - Express.js API server
- `apps/frontend` - Next.js 16 application
- `apps/docs` - Documentation site
- `packages/shared` - Shared TypeScript types and utilities
- `packages/config` - Shared ESLint and TypeScript configurations

## License

Private

